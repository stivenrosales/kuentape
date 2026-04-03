import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;

  const lead = await prisma.lead.findUnique({
    where: { id },
    select: {
      id: true,
      nombre: true,
      apellido: true,
      dni: true,
      celular: true,
      email: true,
      regimen: true,
      rubro: true,
      numTrabajadores: true,
      estado: true,
      notas: true,
      createdAt: true,
      asignadoA: { select: { id: true, nombre: true, apellido: true } },
      convertidoA: { select: { id: true, razonSocial: true } },
    },
  });

  if (!lead) {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  }

  return NextResponse.json(lead);
}
