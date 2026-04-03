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
import { CurrencyInput } from "@/components/currency-input";
import { DatePicker } from "@/components/date-picker";
import { createCajaChicaSchema } from "../schemas";
import type { CreateCajaChicaInput } from "../schemas";
import { createCajaChicaAction, updateCajaChicaAction } from "../actions";

interface CajaChicaFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editId?: string;
  defaultValues?: Partial<CreateCajaChicaInput>;
}

export function CajaChicaForm({
  open,
  onOpenChange,
  editId,
  defaultValues,
}: CajaChicaFormProps) {
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateCajaChicaInput>({
    resolver: zodResolver(createCajaChicaSchema as any),
    defaultValues: {
      tipo: "INGRESO",
      monto: 0,
      fecha: new Date(),
      concepto: "",
      comprobanteUrl: null,
      ...defaultValues,
    },
  });

  async function onSubmit(data: CreateCajaChicaInput) {
    const result = editId
      ? await updateCajaChicaAction(editId, data)
      : await createCajaChicaAction(data);

    if (result.error) {
      toast.error("Revisá los datos ingresados");
      return;
    }

    toast.success(editId ? "Movimiento actualizado" : "Movimiento registrado");
    reset();
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {editId ? "Editar movimiento" : "Nuevo movimiento de caja chica"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          {/* Tipo */}
          <div className="space-y-1.5">
            <Label>Tipo</Label>
            <div className="flex gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" value="INGRESO" {...register("tipo")} />
                <span className="font-medium text-sm text-emerald-700 dark:text-emerald-400">
                  Ingreso
                </span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" value="GASTO" {...register("tipo")} />
                <span className="font-medium text-sm text-red-700 dark:text-red-400">
                  Gasto
                </span>
              </label>
            </div>
            {errors.tipo && (
              <p className="text-xs text-destructive">{errors.tipo.message}</p>
            )}
          </div>

          {/* Monto */}
          <div className="space-y-1.5">
            <Label htmlFor="cc-monto">Monto</Label>
            <Controller
              control={control}
              name="monto"
              render={({ field }) => (
                <CurrencyInput
                  id="cc-monto"
                  valueCentavos={field.value || null}
                  onChange={(v) => field.onChange(v ?? 0)}
                  aria-label="Monto del movimiento"
                />
              )}
            />
            {errors.monto && (
              <p className="text-xs text-destructive">{errors.monto.message}</p>
            )}
          </div>

          {/* Fecha */}
          <div className="space-y-1.5">
            <Label htmlFor="cc-fecha">Fecha</Label>
            <Controller
              control={control}
              name="fecha"
              render={({ field }) => (
                <DatePicker
                  id="cc-fecha"
                  value={field.value instanceof Date ? field.value : new Date(field.value)}
                  onChange={(d) => field.onChange(d)}
                  aria-label="Fecha del movimiento"
                />
              )}
            />
            {errors.fecha && (
              <p className="text-xs text-destructive">{errors.fecha.message as string}</p>
            )}
          </div>

          {/* Concepto */}
          <div className="space-y-1.5">
            <Label htmlFor="cc-concepto">Concepto</Label>
            <Input
              id="cc-concepto"
              placeholder="Descripción del movimiento"
              aria-invalid={!!errors.concepto}
              {...register("concepto")}
            />
            {errors.concepto && (
              <p className="text-xs text-destructive">{errors.concepto.message}</p>
            )}
          </div>

          {/* URL comprobante */}
          <div className="space-y-1.5">
            <Label htmlFor="cc-comprobante">URL del comprobante (opcional)</Label>
            <Input
              id="cc-comprobante"
              placeholder="https://..."
              type="url"
              {...register("comprobanteUrl")}
            />
            {errors.comprobanteUrl && (
              <p className="text-xs text-destructive">{errors.comprobanteUrl.message}</p>
            )}
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
                  : "Registrar movimiento"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
