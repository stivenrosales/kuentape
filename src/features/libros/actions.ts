"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { authorizeAction } from "@/lib/auth-guard";
import {
  createLibroSchema,
  bulkCreateLibrosSchema,
  TIPOS_LIBRO,
} from "./schemas";
import type { CreateLibroInput, BulkCreateLibrosInput } from "./schemas";

export async function createLibroAction(data: CreateLibroInput) {
  await authorizeAction(["GERENCIA", "ADMINISTRADOR", "CONTADOR"]);

  const parsed = createLibroSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  const { personaId, tipoLibro, anio, mes, completado, constanciaUrl } =
    parsed.data;

  // Check unique constraint
  const existing = await prisma.libro.findUnique({
    where: { personaId_tipoLibro_anio_mes: { personaId, tipoLibro, anio, mes } },
  });
  if (existing) {
    return {
      error: {
        _: ["Ya existe un libro con esa combinación de empresa, tipo, año y mes"],
      },
    };
  }

  const libro = await prisma.libro.create({
    data: {
      personaId,
      tipoLibro,
      anio,
      mes,
      completado,
      constanciaUrl: constanciaUrl || null,
    },
  });

  revalidatePath("/libros");
  return { success: true, id: libro.id };
}

export async function toggleLibroCompletadoAction(id: string) {
  await authorizeAction(["GERENCIA", "ADMINISTRADOR", "CONTADOR"]);

  const libro = await prisma.libro.findUnique({ where: { id } });
  if (!libro) return { error: "Libro no encontrado" };

  await prisma.libro.update({
    where: { id },
    data: { completado: !libro.completado },
  });

  revalidatePath("/libros");
  return { success: true, completado: !libro.completado };
}

export async function updateConstanciaAction(id: string, url: string) {
  await authorizeAction(["GERENCIA", "ADMINISTRADOR", "CONTADOR"]);

  const libro = await prisma.libro.findUnique({ where: { id } });
  if (!libro) return { error: "Libro no encontrado" };

  // Subir constancia → auto-completar
  await prisma.libro.update({
    where: { id },
    data: { constanciaUrl: url || null, completado: !!url },
  });

  revalidatePath("/libros");
  return { success: true, completado: !!url };
}

export async function removeConstanciaAction(id: string) {
  await authorizeAction(["GERENCIA", "ADMINISTRADOR", "CONTADOR"]);

  const libro = await prisma.libro.findUnique({ where: { id } });
  if (!libro) return { error: "Libro no encontrado" };

  await prisma.libro.update({
    where: { id },
    data: { constanciaUrl: null, completado: false },
  });

  revalidatePath("/libros");
  return { success: true };
}

export async function bulkCreateLibrosAction(data: BulkCreateLibrosInput) {
  await authorizeAction(["GERENCIA", "ADMINISTRADOR", "CONTADOR"]);

  const parsed = bulkCreateLibrosSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  const { personaId, anio, tipos } = parsed.data;
  const meses = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

  let created = 0;
  let skipped = 0;

  for (const tipoLibro of tipos) {
    for (const mes of meses) {
      const existing = await prisma.libro.findUnique({
        where: { personaId_tipoLibro_anio_mes: { personaId, tipoLibro, anio, mes } },
      });
      if (existing) {
        skipped++;
        continue;
      }
      await prisma.libro.create({
        data: { personaId, tipoLibro, anio, mes, completado: false },
      });
      created++;
    }
  }

  revalidatePath("/libros");
  return { success: true, created, skipped };
}
