"use client";

import * as React from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { createCuentaBancariaSchema } from "./schemas";
import type { CreateCuentaBancariaInput } from "./schemas";
import { createCuentaBancariaAction, updateCuentaBancariaAction } from "./actions";

const TIPOS_CUENTA = [
  { value: "CORRIENTE", label: "Corriente" },
  { value: "AHORROS", label: "Ahorros" },
  { value: "EFECTIVO", label: "Efectivo" },
  { value: "DIGITAL", label: "Digital" },
] as const;

interface CuentaBancariaFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editId?: string;
  defaultValues?: Partial<CreateCuentaBancariaInput>;
}

export function CuentaBancariaForm({
  open,
  onOpenChange,
  editId,
  defaultValues,
}: CuentaBancariaFormProps) {
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateCuentaBancariaInput>({
    resolver: zodResolver(createCuentaBancariaSchema as any),
    defaultValues: {
      nombre: "",
      banco: "",
      tipo: "CORRIENTE",
      activo: true,
      orden: 0,
      ...defaultValues,
    },
  });

  async function onSubmit(data: CreateCuentaBancariaInput) {
    const result = editId
      ? await updateCuentaBancariaAction(editId, data)
      : await createCuentaBancariaAction(data);

    if (result.error) {
      toast.error("Error al guardar. Verificá los datos.");
      return;
    }

    toast.success(editId ? "Cuenta actualizada" : "Cuenta creada");
    reset();
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {editId ? "Editar cuenta bancaria" : "Nueva cuenta bancaria"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="cb-nombre">Nombre de la cuenta</Label>
            <Input
              id="cb-nombre"
              placeholder="Ej: BCP Soles Principal"
              aria-invalid={!!errors.nombre}
              {...register("nombre")}
            />
            {errors.nombre && (
              <p className="text-xs text-destructive">{errors.nombre.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="cb-banco">Banco</Label>
            <Input
              id="cb-banco"
              placeholder="Ej: BCP, Interbank, BBVA"
              aria-invalid={!!errors.banco}
              {...register("banco")}
            />
            {errors.banco && (
              <p className="text-xs text-destructive">{errors.banco.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label>Tipo de cuenta</Label>
            <Controller
              control={control}
              name="tipo"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccioná un tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {TIPOS_CUENTA.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.tipo && (
              <p className="text-xs text-destructive">{errors.tipo.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="cb-orden">Orden de visualización</Label>
            <Input
              id="cb-orden"
              type="number"
              min={0}
              {...register("orden", { valueAsNumber: true })}
            />
            {errors.orden && (
              <p className="text-xs text-destructive">{errors.orden.message}</p>
            )}
          </div>

          <div className="flex items-center gap-3">
            <Controller
              control={control}
              name="activo"
              render={({ field }) => (
                <Switch
                  id="cb-activo"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              )}
            />
            <Label htmlFor="cb-activo" className="cursor-pointer">
              Cuenta activa
            </Label>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting
                ? "Guardando..."
                : editId
                  ? "Guardar cambios"
                  : "Crear cuenta"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
