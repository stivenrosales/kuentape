import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json([], { status: 401 });

  const { id: personaId } = await params;

  const incidencias = await prisma.incidencia.findMany({
    where: { personaId },
    select: {
      id: true,
      titulo: true,
      descripcion: true,
      prioridad: true,
      estado: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  return NextResponse.json(incidencias);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id: personaId } = await params;
  const userId = (session.user as any).id as string;
  const body = await req.json();

  const { titulo, descripcion, prioridad } = body;

  if (!titulo) {
    return NextResponse.json({ error: "Título requerido" }, { status: 400 });
  }

  const incidencia = await prisma.incidencia.create({
    data: {
      personaId,
      contadorId: userId,
      titulo,
      descripcion: descripcion || "",
      prioridad: prioridad || "MEDIA",
      estado: "ABIERTA",
    },
  });

  return NextResponse.json(incidencia, { status: 201 });
}
