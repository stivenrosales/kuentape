"use server";

import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { authorizeAction } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { logAction } from "@/lib/audit";
import { createStaffSchema, updateStaffSchema } from "./schemas";
import type { CreateStaffInput, UpdateStaffInput } from "./schemas";

export async function createStaffAction(data: CreateStaffInput) {
  const session = await authorizeAction(["GERENCIA"]);
  const actorId = (session.user as any).id as string;

  const parsed = createStaffSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  const { nombre, apellido, email, password, role, telefono } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { error: "Ya existe un usuario con ese email" };
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      nombre,
      apellido,
      email,
      passwordHash,
      role,
      telefono: telefono ?? null,
    },
  });

  await logAction({
    userId: actorId,
    accion: "STAFF_CREATE",
    entidad: "User",
    entidadId: user.id,
    metadata: { nombre, apellido, email, role },
  });

  revalidatePath("/equipo");
  return { success: true, id: user.id };
}

export async function updateStaffAction(id: string, data: UpdateStaffInput) {
  const session = await authorizeAction(["GERENCIA"]);
  const actorId = (session.user as any).id as string;

  const parsed = updateStaffSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  await prisma.user.update({
    where: { id },
    data: parsed.data,
  });

  await logAction({
    userId: actorId,
    accion: "STAFF_UPDATE",
    entidad: "User",
    entidadId: id,
    metadata: { changes: parsed.data },
  });

  revalidatePath("/equipo");
  revalidatePath(`/equipo/${id}`);
  return { success: true };
}

export async function toggleStaffActiveAction(id: string) {
  const session = await authorizeAction(["GERENCIA"]);
  const actorId = (session.user as any).id as string;

  const user = await prisma.user.findUnique({
    where: { id },
    select: { activo: true },
  });

  if (!user) {
    return { error: "Usuario no encontrado" };
  }

  await prisma.user.update({
    where: { id },
    data: { activo: !user.activo },
  });

  await logAction({
    userId: actorId,
    accion: "STAFF_TOGGLE_ACTIVE",
    entidad: "User",
    entidadId: id,
    metadata: { activo: !user.activo },
  });

  revalidatePath("/equipo");
  revalidatePath(`/equipo/${id}`);
  return { success: true, activo: !user.activo };
}

export async function resetPasswordAction(id: string, newPassword: string) {
  const session = await authorizeAction(["GERENCIA"]);
  const actorId = (session.user as any).id as string;

  if (newPassword.length < 6) {
    return { error: "La contraseña debe tener al menos 6 caracteres" };
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);

  await prisma.user.update({
    where: { id },
    data: { passwordHash },
  });

  await logAction({
    userId: actorId,
    accion: "STAFF_PASSWORD_RESET",
    entidad: "User",
    entidadId: id,
    metadata: {},
  });

  revalidatePath("/equipo");
  return { success: true };
}
