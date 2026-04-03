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
import { Textarea } from "@/components/ui/textarea";
import { CurrencyInput } from "@/components/currency-input";
import { DatePicker } from "@/components/date-picker";
import { createFinanzaSchema, CATEGORIAS_GASTO } from "../schemas";
import type { CreateFinanzaInput } from "../schemas";
import { createFinanzaAction, updateFinanzaAction } from "../actions";

interface CuentaBancaria {
  id: string;
  nombre: string;
  banco: string;
}

interface ServicioConDeuda {
  id: string;
  montoRestante: number;
  persona: { razonSocial: string };
  tipoServicio: { nombre: string };
}

interface FinanzaFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cuentas: CuentaBancaria[];
  servicios: ServicioConDeuda[];
  editId?: string;
  defaultValues?: Partial<CreateFinanzaInput>;
}

export function FinanzaForm({
  open,
  onOpenChange,
  cuentas,
  servicios,
  editId,
  defaultValues,
}: FinanzaFormProps) {
  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateFinanzaInput>({
    resolver: zodResolver(createFinanzaSchema as any),
    defaultValues: {
      tipo: "INGRESO",
      monto: 0,
      fecha: new Date(),
      concepto: "",
      cuentaId: "",
      servicioId: null,
      categoriaGasto: null,
      numeroOperacion: "",
      comprobanteUrl: "",
      notas: "",
      ...defaultValues,
    },
  });

  const tipo = watch("tipo");

  // Reset dependent fields when tipo changes
  React.useEffect(() => {
    if (tipo === "INGRESO") {
      setValue("categoriaGasto", null);
    } else {
      setValue("servicioId", null);
    }
  }, [tipo, setValue]);

  async function onSubmit(data: CreateFinanzaInput) {
    const result = editId
      ? await updateFinanzaAction(editId, data)
      : await createFinanzaAction(data);

    if (result.error) {
      toast.error("Revisá los datos ingresados");
      return;
    }

    toast.success(editId ? "Transacción actualizada" : "Transacción registrada");
    reset();
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editId ? "Editar transacción" : "Nueva transacción"}
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
                <input type="radio" value="EGRESO" {...register("tipo")} />
                <span className="font-medium text-sm text-red-700 dark:text-red-400">
                  Egreso
                </span>
              </label>
            </div>
            {errors.tipo && (
              <p className="text-xs text-destructive">{errors.tipo.message}</p>
            )}
          </div>

          {/* Monto */}
          <div className="space-y-1.5">
            <Label htmlFor="monto">Monto</Label>
            <Controller
              control={control}
              name="monto"
              render={({ field }) => (
                <CurrencyInput
                  id="monto"
                  valueCentavos={field.value || null}
                  onChange={(v) => field.onChange(v ?? 0)}
                  aria-label="Monto de la transacción"
                />
              )}
            />
            {errors.monto && (
              <p className="text-xs text-destructive">{errors.monto.message}</p>
            )}
          </div>

          {/* Fecha */}
          <div className="space-y-1.5">
            <Label htmlFor="fecha">Fecha</Label>
            <Controller
              control={control}
              name="fecha"
              render={({ field }) => (
                <DatePicker
                  id="fecha"
                  value={field.value instanceof Date ? field.value : new Date(field.value)}
                  onChange={(d) => field.onChange(d)}
                  aria-label="Fecha de la transacción"
                />
              )}
            />
            {errors.fecha && (
              <p className="text-xs text-destructive">{errors.fecha.message as string}</p>
            )}
          </div>

          {/* Concepto */}
          <div className="space-y-1.5">
            <Label htmlFor="concepto">Concepto</Label>
            <Input
              id="concepto"
              placeholder="Descripción de la transacción"
              aria-invalid={!!errors.concepto}
              {...register("concepto")}
            />
            {errors.concepto && (
              <p className="text-xs text-destructive">{errors.concepto.message}</p>
            )}
          </div>

          {/* Cuenta */}
          <div className="space-y-1.5">
            <Label>Cuenta bancaria</Label>
            <Controller
              control={control}
              name="cuentaId"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccioná una cuenta" />
                  </SelectTrigger>
                  <SelectContent>
                    {cuentas.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.nombre} — {c.banco}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.cuentaId && (
              <p className="text-xs text-destructive">{errors.cuentaId.message}</p>
            )}
          </div>

          {/* Servicio (solo INGRESO) */}
          {tipo === "INGRESO" && (
            <div className="space-y-1.5">
              <Label>Servicio vinculado (opcional)</Label>
              <Controller
                control={control}
                name="servicioId"
                render={({ field }) => (
                  <Select
                    value={field.value ?? ""}
                    onValueChange={(v) => field.onChange(v || null)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sin vincular" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Sin vincular</SelectItem>
                      {servicios.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.persona.razonSocial} — {s.tipoServicio.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          )}

          {/* Categoría (solo EGRESO) */}
          {tipo === "EGRESO" && (
            <div className="space-y-1.5">
              <Label>Categoría de gasto</Label>
              <Controller
                control={control}
                name="categoriaGasto"
                render={({ field }) => (
                  <Select
                    value={field.value ?? ""}
                    onValueChange={(v) => field.onChange(v || null)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccioná una categoría" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIAS_GASTO.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.categoriaGasto && (
                <p className="text-xs text-destructive">{errors.categoriaGasto.message}</p>
              )}
            </div>
          )}

          {/* Número de operación */}
          <div className="space-y-1.5">
            <Label htmlFor="numeroOperacion">Número de operación (opcional)</Label>
            <Input
              id="numeroOperacion"
              placeholder="N° de operación bancaria"
              {...register("numeroOperacion")}
            />
          </div>

          {/* URL comprobante */}
          <div className="space-y-1.5">
            <Label htmlFor="comprobanteUrl">URL del comprobante (opcional)</Label>
            <Input
              id="comprobanteUrl"
              placeholder="https://..."
              type="url"
              {...register("comprobanteUrl")}
            />
            {errors.comprobanteUrl && (
              <p className="text-xs text-destructive">{errors.comprobanteUrl.message}</p>
            )}
          </div>

          {/* Notas */}
          <div className="space-y-1.5">
            <Label htmlFor="notas">Notas (opcional)</Label>
            <Textarea
              id="notas"
              placeholder="Información adicional..."
              className="resize-none"
              rows={3}
              {...register("notas")}
            />
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
                  : "Crear transacción"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
