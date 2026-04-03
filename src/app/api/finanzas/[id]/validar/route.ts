import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const role = (session.user as any).role;
  if (role !== "GERENCIA" && role !== "ADMINISTRADOR") {
    return NextResponse.json({ error: "Solo admin puede validar pagos" }, { status: 403 });
  }

  const { id } = await params;
  const userId = (session.user as any).id as string;

  const finanza = await prisma.finanza.findUnique({ where: { id }, select: { validado: true } });
  if (!finanza) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  const nuevoEstado = !finanza.validado;

  await prisma.finanza.update({
    where: { id },
    data: {
      validado: nuevoEstado,
      validadoPorId: nuevoEstado ? userId : null,
      validadoAt: nuevoEstado ? new Date() : null,
    },
  });

  return NextResponse.json({ validado: nuevoEstado });
}
