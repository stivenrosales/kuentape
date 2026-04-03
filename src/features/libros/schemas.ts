import { z } from "zod";

export const TIPOS_LIBRO = [
  "Libro Diario Formato Simplificado",
  "Libro Mayor",
  "Registro de Compras",
  "Registro de Ventas",
  "Libro de Inventarios y Balances",
  "Libro Caja y Bancos",
] as const;

export const createLibroSchema = z.object({
  personaId: z.string().min(1, "Debe seleccionar una empresa"),
  tipoLibro: z.enum(TIPOS_LIBRO, { error: "Debe seleccionar el tipo de libro" }),
  anio: z
    .number()
    .int()
    .min(2000, "Año inválido")
    .max(2100, "Año inválido"),
  mes: z
    .number()
    .int()
    .min(1, "Mes inválido")
    .max(12, "Mes inválido"),
  completado: z.boolean().default(false),
  constanciaUrl: z.string().url("URL inválida").optional().or(z.literal("")),
});

export const updateLibroSchema = createLibroSchema.partial().extend({
  personaId: z.string().min(1, "Debe seleccionar una empresa"),
  tipoLibro: z.enum(TIPOS_LIBRO),
  anio: z.number().int().min(2000).max(2100),
  mes: z.number().int().min(1).max(12),
});

export const bulkCreateLibrosSchema = z.object({
  personaId: z.string().min(1, "Debe seleccionar una empresa"),
  anio: z.number().int().min(2000).max(2100),
  tipos: z.array(z.enum(TIPOS_LIBRO)).min(1, "Debe seleccionar al menos un tipo"),
});

export type CreateLibroInput = z.infer<typeof createLibroSchema>;
export type UpdateLibroInput = z.infer<typeof updateLibroSchema>;
export type BulkCreateLibrosInput = z.infer<typeof bulkCreateLibrosSchema>;
