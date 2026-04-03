import { auth } from "@/auth";
import { redirect } from "next/navigation";
import type { Role } from "@prisma/client";

export async function requireAuth() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  return session;
}

export async function requireRole(roles: Role[]) {
  const session = await requireAuth();
  if (!roles.includes((session.user as any).role as Role))
    redirect("/dashboard");
  return session;
}

export async function authorizeAction(roles: Role[]) {
  const session = await auth();
  if (!session?.user) throw new Error("No autorizado");
  if (!roles.includes((session.user as any).role as Role))
    throw new Error("No autorizado");
  return session;
}

export function scopedWhere(
  baseWhere: Record<string, any>,
  role: string,
  userId: string
) {
  if (role === "GERENCIA" || role === "ADMINISTRADOR") return baseWhere;
  return { ...baseWhere, contadorId: userId };
}

export function scopedPersonaWhere(
  baseWhere: Record<string, any>,
  role: string,
  userId: string
) {
  if (role === "GERENCIA" || role === "ADMINISTRADOR") return baseWhere;
  return { ...baseWhere, contadorAsignadoId: userId };
}
