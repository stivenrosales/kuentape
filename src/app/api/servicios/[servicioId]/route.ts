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

  const { servicioId } = await params;

  const servicio = await prisma.servicio.findUnique({
    where: { id: servicioId },
    include: {
      persona: { select: { id: true, razonSocial: true, tipoPersona: true, regimen: true } },
      tipoServicio: { select: { id: true, nombre: true, categoria: true } },
      contador: { select: { id: true, nombre: true, apellido: true } },
    },
  });

  if (!servicio) {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  }

  return NextResponse.json(servicio);
}
