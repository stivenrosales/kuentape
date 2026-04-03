import { z } from "zod";

export const createLeadSchema = z.object({
  nombre: z.string().min(2, "Mínimo 2 caracteres"),
  apellido: z.string().min(2, "Mínimo 2 caracteres"),
  dni: z
    .string()
    .length(8, "DNI debe tener 8 dígitos")
    .regex(/^\d+$/, "Solo dígitos")
    .optional()
    .or(z.literal("")),
  celular: z.string().min(9, "Celular inválido"),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  regimen: z.enum(["MYPE", "RER", "REG"]).optional(),
  rubro: z.string().optional(),
  numTrabajadores: z.number().int().min(0).optional(),
  notas: z.string().optional(),
  asignadoAId: z.string().optional(),
});

export const updateLeadEstadoSchema = z.object({
  estado: z.enum(["NUEVO", "CONTACTADO", "COTIZADO", "CONVERTIDO", "PERDIDO"]),
});

export const convertLeadSchema = z.object({
  tipoPersona: z.enum(["JURIDICA", "NATURAL"]),
  razonSocial: z.string().min(2, "Mínimo 2 caracteres").optional(),
  ruc: z
    .string()
    .length(11, "RUC debe tener 11 dígitos")
    .regex(/^\d+$/, "Solo dígitos")
    .optional(),
  regimen: z.enum(["MYPE", "RER", "REG"]),
  contadorAsignadoId: z.string().min(1, "Debe asignar un contador"),
});

export type CreateLeadInput = z.infer<typeof createLeadSchema>;
export type UpdateLeadEstadoInput = z.infer<typeof updateLeadEstadoSchema>;
export type ConvertLeadInput = z.infer<typeof convertLeadSchema>;
