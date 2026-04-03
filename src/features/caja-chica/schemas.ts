import { z } from "zod";

export const createCajaChicaSchema = z.object({
  tipo: z.enum(["INGRESO", "GASTO"]),
  monto: z.number().int().positive("El monto debe ser mayor a cero"),
  fecha: z.date(),
  concepto: z.string().min(2, "El concepto debe tener al menos 2 caracteres").max(255),
  comprobanteUrl: z.string().url("URL de comprobante inválida").optional().nullable(),
});

export type CreateCajaChicaInput = z.infer<typeof createCajaChicaSchema>;

export const updateCajaChicaSchema = createCajaChicaSchema;
export type UpdateCajaChicaInput = z.infer<typeof updateCajaChicaSchema>;

export interface CajaChicaFilters {
  tipo?: "INGRESO" | "GASTO";
  fechaDesde?: Date;
  fechaHasta?: Date;
  mes?: number;
  anio?: number;
}
