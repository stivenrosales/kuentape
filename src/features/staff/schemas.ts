import { z } from "zod";

export const createStaffSchema = z.object({
  nombre: z.string().min(2, "Mínimo 2 caracteres"),
  apellido: z.string().min(2, "Mínimo 2 caracteres"),
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Mínimo 6 caracteres"),
  role: z.enum(["GERENCIA", "ADMINISTRADOR", "CONTADOR", "VENTAS"]),
  telefono: z.string().optional(),
});

export const updateStaffSchema = createStaffSchema
  .omit({ password: true, email: true })
  .partial();

export const resetPasswordSchema = z.object({
  newPassword: z.string().min(6, "Mínimo 6 caracteres"),
});

export type CreateStaffInput = z.infer<typeof createStaffSchema>;
export type UpdateStaffInput = z.infer<typeof updateStaffSchema>;
