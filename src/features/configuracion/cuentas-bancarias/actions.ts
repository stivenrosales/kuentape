"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { authorizeAction } from "@/lib/auth-guard";
import { createCuentaBancariaSchema } from "./schemas";
import type { CreateCuentaBancariaInput } from "./schemas";

export async function createCuentaBancariaAction(data: CreateCuentaBancariaInput) {
  await authorizeAction(["GERENCIA"]);

  const parsed = createCuentaBancariaSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  const cuenta = await prisma.cuentaBancaria.create({ data: parsed.data });
  revalidatePath("/configuracion/cuentas-bancarias");
  return { data: cuenta };
}

export async function updateCuentaBancariaAction(id: string, data: CreateCuentaBancariaInput) {
  await authorizeAction(["GERENCIA"]);

  const parsed = createCuentaBancariaSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  const cuenta = await prisma.cuentaBancaria.update({
    where: { id },
    data: parsed.data,
  });

  revalidatePath("/configuracion/cuentas-bancarias");
  return { data: cuenta };
}

export async function toggleCuentaActivaAction(id: string, activo: boolean) {
  await authorizeAction(["GERENCIA"]);

  const cuenta = await prisma.cuentaBancaria.update({
    where: { id },
    data: { activo },
  });

  revalidatePath("/configuracion/cuentas-bancarias");
  return { data: cuenta };
}
