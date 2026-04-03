import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { decrypt } from "@/lib/encryption";
import { scopedPersonaWhere } from "@/lib/auth-guard";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ personaId: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { personaId } = await params;
  const role = (session.user as any).role as string;
  const userId = (session.user as any).id as string;

  const allowedRoles = ["GERENCIA", "ADMINISTRADOR", "CONTADOR"];
  if (!allowedRoles.includes(role)) {
    return NextResponse.json({ error: "Sin permiso" }, { status: 403 });
  }

  const baseWhere = { id: personaId };
  const where = scopedPersonaWhere(baseWhere, role, userId);

  const persona = await prisma.persona.findFirst({
    where,
    select: {
      id: true,
      razonSocial: true,
      claveSolUsuario: true,
      claveSolClave: true,
      afpUsuario: true,
      afpClave: true,
    },
  });

  if (!persona) {
    return NextResponse.json(
      { error: "Persona no encontrada o sin permiso" },
      { status: 404 }
    );
  }

  const safeDecrypt = (val: string | null): string => {
    if (!val) return "";
    try {
      return decrypt(val);
    } catch {
      return "";
    }
  };

  // Log the credential view
  await prisma.auditLog.create({
    data: {
      userId,
      accion: "CREDENTIAL_VIEW",
      entidad: "Persona",
      entidadId: personaId,
      metadata: { razonSocial: persona.razonSocial },
      ip: req.headers.get("x-forwarded-for") ?? req.headers.get("x-real-ip") ?? undefined,
    },
  });

  return NextResponse.json({
    claveSolUsuario: safeDecrypt(persona.claveSolUsuario),
    claveSolClave: safeDecrypt(persona.claveSolClave),
    afpUsuario: safeDecrypt(persona.afpUsuario),
    afpClave: safeDecrypt(persona.afpClave),
  });
}
