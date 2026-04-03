import { prisma } from "@/lib/prisma";

export async function logAction(params: {
  userId: string;
  accion: string;
  entidad: string;
  entidadId: string;
  metadata?: Record<string, unknown>;
  ip?: string;
}) {
  const { userId, accion, entidad, entidadId, metadata, ip } = params;
  await prisma.auditLog.create({
    data: {
      userId,
      accion,
      entidad,
      entidadId,
      metadata: (metadata ?? undefined) as any,
      ip: ip ?? undefined,
    },
  });
}
