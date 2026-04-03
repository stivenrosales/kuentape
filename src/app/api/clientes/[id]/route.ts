import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { scopedPersonaWhere } from "@/lib/auth-guard";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const role = (session.user as any).role as string;
  const userId = (session.user as any).id as string;

  const baseWhere = { id };
  const where = scopedPersonaWhere(baseWhere, role, userId);

  const persona = await prisma.persona.findFirst({
    where,
    include: {
      contadorAsignado: {
        select: { id: true, nombre: true, apellido: true, email: true },
      },
      _count: {
        select: {
          servicios: true,
          incidencias: true,
          libros: true,
        },
      },
      servicios: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: {
          id: true,
          createdAt: true,
          estado: true,
          tipoServicio: { select: { nombre: true } },
        },
      },
    },
  });

  if (!persona) {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  }

  return NextResponse.json(persona);
}
