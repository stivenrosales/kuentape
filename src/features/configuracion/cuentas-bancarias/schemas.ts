import { z } from "zod";

export const createCuentaBancariaSchema = z.object({
  nombre: z.string().min(2, "Mínimo 2 caracteres").max(100),
  banco: z.string().min(2, "Mínimo 2 caracteres").max(100),
  tipo: z.enum(["CORRIENTE", "AHORROS", "EFECTIVO", "DIGITAL"]),
  activo: z.boolean().default(true),
  orden: z.number().int().min(0).default(0),
});

export type CreateCuentaBancariaInput = z.infer<typeof createCuentaBancariaSchema>;
