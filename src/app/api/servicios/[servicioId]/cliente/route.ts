import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ servicioId: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  // servicioId here is actually personaId (reusing the route param name)
  const { servicioId: personaId } = await params;

  const persona = await prisma.persona.findUnique({
    where: { id: personaId },
    select: {
      id: true,
      razonSocial: true,
      ruc: true,
      tipoPersona: true,
      regimen: true,
      estado: true,
      direccion: true,
      telefono: true,
      email: true,
      representanteNombre: true,
      representanteDni: true,
      representanteTelefono: true,
      detracciones: true,
      planilla: true,
      numTrabajadores: true,
      tipoContabilidad: true,
      partidaElectronica: true,
    },
  });

  if (!persona) {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  }

  return NextResponse.json(persona);
}
