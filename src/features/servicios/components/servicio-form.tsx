"use client";

import * as React from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CurrencyInput } from "@/components/currency-input";
import { formatCurrency } from "@/lib/format";
import { computeServicioPricing } from "@/features/servicios/lib/pricing";
import { planillaPrecio } from "@/lib/pricing";
import {
  createServicioSchema,
  type CreateServicioInput,
} from "@/features/servicios/schemas";
import {
  createServicioAction,
  updateServicioAction,
} from "@/features/servicios/actions";

interface PersonaOption {
  id: string;
  razonSocial: string;
  ruc: string;
}

interface TipoServicioOption {
  id: string;
  nombre: string;
  categoria: string;
  requierePeriodo: boolean;
}

interface ContadorOption {
  id: string;
  nombre: string;
  apellido: string;
}

interface ServicioFormProps {
  mode: "create" | "edit";
  servicioId?: string;
  defaultValues?: Partial<CreateServicioInput>;
  personas: PersonaOption[];
  tiposServicio: TipoServicioOption[];
  contadores: ContadorOption[];
  currentUserId?: string;
  isContador?: boolean;
}

const MESES_OPTIONS = [
  { value: "1", label: "Enero" },
  { value: "2", label: "Febrero" },
  { value: "3", label: "Marzo" },
  { value: "4", label: "Abril" },
  { value: "5", label: "Mayo" },
  { value: "6", label: "Junio" },
  { value: "7", label: "Julio" },
  { value: "8", label: "Agosto" },
  { value: "9", label: "Septiembre" },
  { value: "10", label: "Octubre" },
  { value: "11", label: "Noviembre" },
  { value: "12", label: "Diciembre" },
];

const CURRENT_YEAR = new Date().getFullYear();
const YEARS_OPTIONS = Array.from({ length: 6 }, (_, i) => CURRENT_YEAR - 2 + i);

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-xs text-destructive">{message}</p>;
}

export function ServicioForm({
  mode,
  servicioId,
  defaultValues,
  personas,
  tiposServicio,
  contadores,
  currentUserId,
  isContador = false,
}: ServicioFormProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = React.useState(false);
  const [periodoMes, setPeriodoMes] = React.useState<string>(() => {
    if (defaultValues?.periodo) {
      const parts = defaultValues.periodo.split("-");
      return parts[1] ?? "";
    }
    return "";
  });
  const [periodoAnio, setPeriodoAnio] = React.useState<string>(() => {
    if (defaultValues?.periodo) {
      return defaultValues.periodo.split("-")[0] ?? String(CURRENT_YEAR);
    }
    return String(CURRENT_YEAR);
  });

  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<CreateServicioInput>({
    resolver: zodResolver(createServicioSchema as any),
    defaultValues: {
      baseImponible: 0,
      noGravado: 0,
      honorarios: 0,
      descuento: 0,
      contadorId: isContador ? currentUserId : undefined,
      ...defaultValues,
    },
  });

  const watchedTipoServicioId = watch("tipoServicioId");
  const watchedBase = watch("baseImponible") ?? 0;
  const watchedNoGravado = watch("noGravado") ?? 0;
  const watchedHonorarios = watch("honorarios") ?? 0;
  const watchedDescuento = watch("descuento") ?? 0;
  const watchedNumTrab = watch("numTrabajadores");

  const selectedTipo = tiposServicio.find((t) => t.id === watchedTipoServicioId);
  const requierePeriodo = selectedTipo?.requierePeriodo ?? false;

  const pricing = computeServicioPricing({
    baseImponible: watchedBase,
    noGravado: watchedNoGravado,
    honorarios: watchedHonorarios,
    descuento: watchedDescuento,
    montoCobrado: 0,
  });

  const planillaSugerido =
    watchedNumTrab && watchedNumTrab > 0
      ? planillaPrecio(watchedNumTrab)
      : null;

  function buildPeriodo(): string | undefined {
    if (!requierePeriodo) return undefined;
    if (periodoAnio && periodoMes) {
      const mesStr = String(parseInt(periodoMes)).padStart(2, "0");
      return `${periodoAnio}-${mesStr}`;
    }
    if (periodoAnio) return periodoAnio;
    return undefined;
  }

  async function onSubmit(data: CreateServicioInput) {
    setSubmitting(true);
    try {
      const payload = { ...data, periodo: buildPeriodo() };
      if (mode === "create") {
        const result = await createServicioAction(payload);
        if (result.error) {
          toast.error("Error al crear el servicio");
          return;
        }
        toast.success("Servicio creado correctamente");
        router.push(`/servicios/${result.id}`);
      } else if (mode === "edit" && servicioId) {
        const result = await updateServicioAction(servicioId, payload);
        if (result.error) {
          toast.error("Error al actualizar el servicio");
          return;
        }
        toast.success("Servicio actualizado correctamente");
        router.push(`/servicios/${servicioId}`);
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Datos principales */}
      <Card>
        <CardHeader>
          <CardTitle>Datos del Servicio</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label htmlFor="personaId">Cliente *</Label>
            <Controller
              name="personaId"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={(v) => v && field.onChange(v)}>
                  <SelectTrigger className="mt-1 w-full">
                    <SelectValue placeholder="Seleccionar cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    {personas.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.razonSocial} — {p.ruc}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            <FieldError message={errors.personaId?.message} />
          </div>

          <div>
            <Label htmlFor="tipoServicioId">Tipo de Servicio *</Label>
            <Controller
              name="tipoServicioId"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={(v) => v && field.onChange(v)}>
                  <SelectTrigger className="mt-1 w-full">
                    <SelectValue placeholder="Seleccionar tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {tiposServicio.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            <FieldError message={errors.tipoServicioId?.message} />
          </div>

          <div>
            <Label htmlFor="contadorId">Contador *</Label>
            <Controller
              name="contadorId"
              control={control}
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={(v) => v && field.onChange(v)}
                  disabled={isContador}
                >
                  <SelectTrigger className="mt-1 w-full">
                    <SelectValue placeholder="Seleccionar contador" />
                  </SelectTrigger>
                  <SelectContent>
                    {contadores.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.apellido}, {c.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            <FieldError message={errors.contadorId?.message} />
          </div>

          {requierePeriodo && (
            <>
              <div>
                <Label>Mes del Periodo</Label>
                <Select value={periodoMes} onValueChange={(v) => setPeriodoMes(v ?? "")} >
                  <SelectTrigger className="mt-1 w-full">
                    <SelectValue placeholder="Mes (opcional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {MESES_OPTIONS.map((m) => (
                      <SelectItem key={m.value} value={m.value}>
                        {m.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Año del Periodo</Label>
                <Select value={periodoAnio} onValueChange={(v) => setPeriodoAnio(v ?? "")} >
                  <SelectTrigger className="mt-1 w-full">
                    <SelectValue placeholder="Año" />
                  </SelectTrigger>
                  <SelectContent>
                    {YEARS_OPTIONS.map((y) => (
                      <SelectItem key={y} value={String(y)}>
                        {y}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Montos */}
      <Card>
        <CardHeader>
          <CardTitle>Montos y Precios</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="baseImponible">Base Imponible</Label>
            <Controller
              name="baseImponible"
              control={control}
              render={({ field }) => (
                <CurrencyInput
                  id="baseImponible"
                  valueCentavos={field.value ?? 0}
                  onChange={(v) => field.onChange(v ?? 0)}
                  className="mt-1"
                />
              )}
            />
          </div>

          <div>
            <Label htmlFor="noGravado">No Gravado</Label>
            <Controller
              name="noGravado"
              control={control}
              render={({ field }) => (
                <CurrencyInput
                  id="noGravado"
                  valueCentavos={field.value ?? 0}
                  onChange={(v) => field.onChange(v ?? 0)}
                  className="mt-1"
                />
              )}
            />
          </div>

          <div>
            <Label htmlFor="honorarios">Honorarios *</Label>
            <Controller
              name="honorarios"
              control={control}
              render={({ field }) => (
                <CurrencyInput
                  id="honorarios"
                  valueCentavos={field.value ?? 0}
                  onChange={(v) => field.onChange(v ?? 0)}
                  className="mt-1"
                />
              )}
            />
            <FieldError message={errors.honorarios?.message} />
          </div>

          <div>
            <Label htmlFor="descuento">
              Descuento{" "}
              <span className="text-xs text-muted-foreground">
                (negativo = aumento)
              </span>
            </Label>
            <Controller
              name="descuento"
              control={control}
              render={({ field }) => (
                <CurrencyInput
                  id="descuento"
                  valueCentavos={field.value ?? 0}
                  onChange={(v) => field.onChange(v ?? 0)}
                  className="mt-1"
                />
              )}
            />
          </div>

          <div>
            <Label htmlFor="numTrabajadores">N° Trabajadores (Planilla)</Label>
            <Input
              id="numTrabajadores"
              type="number"
              min={0}
              {...register("numTrabajadores", { valueAsNumber: true })}
              placeholder="0"
              className="mt-1"
            />
            {planillaSugerido !== null && (
              <p className="mt-1 text-xs text-muted-foreground">
                Precio sugerido planilla:{" "}
                <span className="font-mono font-medium text-foreground">
                  {formatCurrency(planillaSugerido)}
                </span>
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Preview de pricing */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader>
          <CardTitle className="text-base">Vista Previa de Precios</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-2 sm:grid-cols-2">
            {[
              { label: "IGV (18%)", value: pricing.igv },
              { label: "Total Imponible", value: pricing.totalImponible },
              {
                label: "Precio Final",
                value: pricing.precioFinal,
                highlight: true,
              },
            ].map(({ label, value, highlight }) => (
              <div key={label} className="flex justify-between">
                <dt className="text-sm text-muted-foreground">{label}</dt>
                <dd
                  className={`font-mono text-sm font-medium ${highlight ? "text-primary" : ""}`}
                >
                  {formatCurrency(value)}
                </dd>
              </div>
            ))}
          </dl>
        </CardContent>
      </Card>

      {/* Notas */}
      <Card>
        <CardHeader>
          <CardTitle>Notas</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            {...register("notas")}
            placeholder="Observaciones adicionales..."
            rows={3}
          />
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={submitting}
        >
          Cancelar
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting
            ? "Guardando..."
            : mode === "create"
              ? "Crear Servicio"
              : "Guardar Cambios"}
        </Button>
      </div>
    </form>
  );
}
