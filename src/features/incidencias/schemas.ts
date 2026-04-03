import { z } from "zod";

export const createIncidenciaSchema = z.object({
  personaId: z.string().min(1, "Debe seleccionar una empresa"),
  contadorId: z.string().min(1, "Debe seleccionar un contador"),
  prioridad: z.enum(["ALTA", "MEDIA", "BAJA"]).default("MEDIA"),
  titulo: z.string().min(1, "El título es requerido"),
  descripcion: z.string().min(1, "La descripción es requerida"),
  detalleFinanciero: z.string().optional(),
  estado: z
    .enum(["ABIERTA", "EN_PROGRESO", "RESUELTA", "CERRADA"])
    .default("ABIERTA"),
  fechaLimite: z.date().optional().nullable(),
  periodo: z
    .string()
    .regex(/^\d{4}-\d{2}$/, "Formato inválido (ej: 2026-03)")
    .optional()
    .or(z.literal("")),
});

export const updateIncidenciaSchema = createIncidenciaSchema.partial().extend({
  personaId: z.string().min(1, "Debe seleccionar una empresa"),
  contadorId: z.string().min(1, "Debe seleccionar un contador"),
  titulo: z.string().min(1, "El título es requerido"),
  descripcion: z.string().min(1, "La descripción es requerida"),
});

export const updateEstadoIncidenciaSchema = z.object({
  estado: z.enum(["ABIERTA", "EN_PROGRESO", "RESUELTA", "CERRADA"]),
});

export type CreateIncidenciaInput = z.infer<typeof createIncidenciaSchema>;
export type UpdateIncidenciaInput = z.infer<typeof updateIncidenciaSchema>;
export type UpdateEstadoIncidenciaInput = z.infer<
  typeof updateEstadoIncidenciaSchema
>;
