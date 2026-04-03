import { z } from "zod";

export const createServicioSchema = z.object({
  personaId: z.string().min(1, "Debe seleccionar un cliente"),
  tipoServicioId: z.string().min(1, "Debe seleccionar el tipo de servicio"),
  contadorId: z.string().min(1, "Debe seleccionar el contador"),
  periodo: z
    .string()
    .regex(/^\d{4}(-\d{2})?$/, "Formato inválido (ej: 2026-03 o 2026)")
    .optional()
    .or(z.literal("")),
  baseImponible: z.number().int().min(0).optional(),
  noGravado: z.number().int().min(0).optional(),
  honorarios: z.number().int().min(0).optional(),
  descuento: z.number().int().optional(),
  numTrabajadores: z.number().int().min(0).optional(),
  notas: z.string().optional(),
});

export const updateServicioSchema = createServicioSchema.partial();

export const registrarCobroSchema = z.object({
  monto: z.number().int().min(1, "El monto debe ser mayor a cero"),
  cuentaId: z.string().min(1, "Debe seleccionar una cuenta"),
  fecha: z.date(),
  concepto: z.string().min(1, "El concepto es requerido"),
  numeroOperacion: z.string().optional(),
  comprobanteUrl: z.string().optional(),
});

export const createTipoServicioSchema = z.object({
  nombre: z.string().min(2, "Mínimo 2 caracteres"),
  categoria: z.enum([
    "MENSUAL",
    "ANUAL",
    "TRAMITE",
    "ASESORIA",
    "CONSTITUCION",
    "REGULARIZACION",
    "MODIF_ESTATUTO",
    "OTROS",
  ]),
  requierePeriodo: z.boolean().default(false),
  activo: z.boolean().default(true),
  orden: z.number().int().min(0).default(0),
});

export const updateTipoServicioSchema = createTipoServicioSchema.partial().extend({
  nombre: z.string().min(2, "Mínimo 2 caracteres"),
  categoria: z.enum([
    "MENSUAL",
    "ANUAL",
    "TRAMITE",
    "ASESORIA",
    "CONSTITUCION",
    "REGULARIZACION",
    "MODIF_ESTATUTO",
    "OTROS",
  ]),
});

export type CreateServicioInput = z.infer<typeof createServicioSchema>;
export type UpdateServicioInput = z.infer<typeof updateServicioSchema>;
export type RegistrarCobroInput = z.infer<typeof registrarCobroSchema>;
export type CreateTipoServicioInput = z.infer<typeof createTipoServicioSchema>;
export type UpdateTipoServicioInput = z.infer<typeof updateTipoServicioSchema>;
