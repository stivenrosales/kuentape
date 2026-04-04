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
import { CurrencyInput } from "@/components/currency-input";
import { DatePicker } from "@/components/date-picker";
import { formatCurrency } from "@/lib/format";
import {
  registrarCobroSchema,
  type RegistrarCobroInput,
} from "@/features/servicios/schemas";
import { registrarCobroAction } from "@/features/servicios/actions";

interface CuentaOption {
  id: string;
  nombre: string;
  banco: string;
}

interface RegistrarCobroDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  servicioId: string;
  montoCobradoActual: number;
  montoRestante: number;
  precioFinal: number;
  cuentas: CuentaOption[];
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-xs text-destructive">{message}</p>;
}

export function RegistrarCobroDialog({
  open,
  onOpenChange,
  servicioId,
  montoCobradoActual,
  montoRestante,
  precioFinal,
  cuentas,
}: RegistrarCobroDialogProps) {
  const [submitting, setSubmitting] = React.useState(false);

  const {
    register,
    control,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<RegistrarCobroInput>({
    resolver: zodResolver(registrarCobroSchema as any),
    defaultValues: {
      monto: montoRestante,
      fecha: new Date(),
      concepto: "Pago de honorarios",
    },
  });

  const watchedMonto = watch("monto") ?? 0;
  const nuevoMontoCobrado = montoCobradoActual + watchedMonto;
  const nuevoRestante = Math.max(0, precioFinal - nuevoMontoCobrado);

  async function onSubmit(data: RegistrarCobroInput) {
    setSubmitting(true);
    try {
      const result = await registrarCobroAction(servicioId, data);
      if (result.error) {
        toast.error("Error al registrar el cobro");
        return;
      }
      toast.success("Cobro registrado correctamente");
      reset();
      onOpenChange(false);
    } finally {
      setSubmitting(false);
    }
  }

  // Resetear monto cuando cambia montoRestante (al abrir dialog con nuevo servicio)
  React.useEffect(() => {
    if (open) {
      reset({
        monto: montoRestante,
        fecha: new Date(),
        concepto: "Pago de honorarios",
      });
    }
  }, [open, montoRestante, reset]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Registrar Cobro</DialogTitle>
        </DialogHeader>

        {/* Resumen */}
        <div className="rounded-lg border border-border bg-muted/30 p-3 text-sm space-y-1">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Precio final:</span>
            <span className="font-mono font-medium">{formatCurrency(precioFinal)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">
              Cobrado: {formatCurrency(montoCobradoActual)} →{" "}
              <span className="text-emerald-600 font-medium">
                {formatCurrency(nuevoMontoCobrado)}
              </span>
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">
              Restante: {formatCurrency(montoRestante)} →{" "}
              <span className={nuevoRestante > 0 ? "text-red-600 font-medium" : "text-emerald-600 font-medium"}>
                {formatCurrency(nuevoRestante)}
              </span>
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="monto">Monto a Cobrar *</Label>
            <Controller
              name="monto"
              control={control}
              render={({ field }) => (
                <CurrencyInput
                  id="monto"
                  valueCentavos={field.value ?? 0}
                  onChange={(v) => field.onChange(v ?? 0)}
                  className="mt-1"
                />
              )}
            />
            <FieldError message={errors.monto?.message} />
          </div>

          <div>
            <Label htmlFor="cuentaId">Cuenta Bancaria *</Label>
            <Controller
              name="cuentaId"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={(v) => v && field.onChange(v)}>
                  <SelectTrigger className="mt-1 w-full">
                    <SelectValue placeholder="Seleccionar cuenta" />
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
            <FieldError message={errors.cuentaId?.message} />
          </div>

          <div>
            <Label>Fecha *</Label>
            <div className="mt-1">
              <Controller
                name="fecha"
                control={control}
                render={({ field }) => (
                  <DatePicker
                    value={field.value}
                    onChange={(d) => field.onChange(d)}
                    className="w-full"
                  />
                )}
              />
            </div>
            <FieldError message={errors.fecha?.message} />
          </div>

          <div>
            <Label htmlFor="concepto">Concepto *</Label>
            <Input
              id="concepto"
              {...register("concepto")}
              placeholder="Pago de honorarios"
              className="mt-1"
            />
            <FieldError message={errors.concepto?.message} />
          </div>

          <div>
            <Label htmlFor="numeroOperacion">N° de Operación</Label>
            <Input
              id="numeroOperacion"
              {...register("numeroOperacion")}
              placeholder="Opcional"
              className="mt-1 font-mono"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Registrando..." : "Registrar Cobro"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
