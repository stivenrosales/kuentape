import { z } from "zod";

export const CATEGORIAS_GASTO = [
  "Alquiler",
  "Planilla",
  "Servicios Públicos",
  "SUNARP",
  "Transporte",
  "Comunicaciones",
  "Notarial",
  "Caja Chica",
  "Otros",
] as const;

export type CategoriaGasto = (typeof CATEGORIAS_GASTO)[number];

export const createFinanzaSchema = z
  .object({
    tipo: z.enum(["INGRESO", "EGRESO"]),
    monto: z.number().int("El monto debe ser entero en centavos").positive("El monto debe ser mayor a cero"),
    fecha: z.date(),
    concepto: z.string().min(2, "El concepto debe tener al menos 2 caracteres").max(255),
    cuentaId: z.string().min(1, "La cuenta bancaria es requerida"),
    servicioId: z.string().optional().nullable(),
    categoriaGasto: z.enum(CATEGORIAS_GASTO).optional().nullable(),
    numeroOperacion: z.string().max(100).optional().nullable(),
    comprobanteUrl: z.string().url("URL de comprobante inválida").optional().nullable(),
    notas: z.string().max(2000).optional().nullable(),
  })
  .superRefine((data, ctx) => {
    if (data.tipo === "EGRESO" && !data.categoriaGasto) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "La categoría de gasto es requerida para egresos",
        path: ["categoriaGasto"],
      });
    }
  });

export type CreateFinanzaInput = z.infer<typeof createFinanzaSchema>;

export const updateFinanzaSchema = createFinanzaSchema;

export type UpdateFinanzaInput = z.infer<typeof updateFinanzaSchema>;

export interface FinanzaFilters {
  tipo?: "INGRESO" | "EGRESO";
  cuentaId?: string;
  categoriaGasto?: string;
  fechaDesde?: Date;
  fechaHasta?: Date;
  search?: string;
  page?: number;
  pageSize?: number;
}
