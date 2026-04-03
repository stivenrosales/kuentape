import { z } from "zod";

export const createPersonaSchema = z.object({
  razonSocial: z.string().min(2, "Mínimo 2 caracteres"),
  ruc: z
    .string()
    .length(11, "RUC debe tener 11 dígitos")
    .regex(/^\d+$/, "Solo números"),
  tipoPersona: z.enum(["JURIDICA", "NATURAL", "IMMUNOTEC", "FOUR_LIFE", "RXH"]),
  regimen: z.enum(["MYPE", "RER", "REG"]),
  direccion: z.string().optional(),
  telefono: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  representanteNombre: z.string().optional(),
  representanteDni: z
    .string()
    .length(8, "DNI debe tener 8 dígitos")
    .regex(/^\d+$/)
    .optional()
    .or(z.literal("")),
  representanteTelefono: z.string().optional(),
  contadorAsignadoId: z.string().min(1, "Debe asignar un contador"),
  detracciones: z.boolean().default(false),
  planilla: z.boolean().default(false),
  numTrabajadores: z.number().int().min(0).optional(),
  tipoContabilidad: z.enum(["MANUAL", "COMPUTARIZADA"]).default("MANUAL"),
  partidaElectronica: z.string().optional(),
});

export const updatePersonaSchema = createPersonaSchema.partial().extend({
  razonSocial: z.string().min(2, "Mínimo 2 caracteres"),
  ruc: z
    .string()
    .length(11, "RUC debe tener 11 dígitos")
    .regex(/^\d+$/, "Solo números"),
  tipoPersona: z.enum(["JURIDICA", "NATURAL", "IMMUNOTEC", "FOUR_LIFE", "RXH"]),
  regimen: z.enum(["MYPE", "RER", "REG"]),
  contadorAsignadoId: z.string().min(1, "Debe asignar un contador"),
});

export const updateCredentialsSchema = z.object({
  claveSolUsuario: z.string().optional(),
  claveSolClave: z.string().optional(),
  afpUsuario: z.string().optional(),
  afpClave: z.string().optional(),
});

export const updateEstadoSchema = z.object({
  estado: z.enum(["ACTIVO", "INACTIVO", "ARCHIVADO"]),
});

export type CreatePersonaInput = z.infer<typeof createPersonaSchema>;
export type UpdatePersonaInput = z.infer<typeof updatePersonaSchema>;
export type UpdateCredentialsInput = z.infer<typeof updateCredentialsSchema>;
