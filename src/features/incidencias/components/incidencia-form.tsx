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
import { DatePicker } from "@/components/date-picker";
import {
  createIncidenciaSchema,
  type CreateIncidenciaInput,
} from "@/features/incidencias/schemas";
import {
  createIncidenciaAction,
  updateIncidenciaAction,
} from "@/features/incidencias/actions";

interface PersonaOption {
  id: string;
  razonSocial: string;
  ruc: string;
}

interface ContadorOption {
  id: string;
  nombre: string;
  apellido: string;
}

interface IncidenciaFormProps {
  mode: "create" | "edit";
  incidenciaId?: string;
  defaultValues?: Partial<CreateIncidenciaInput>;
  personas: PersonaOption[];
  contadores: ContadorOption[];
  currentUserId?: string;
  isContador?: boolean;
}

const CURRENT_YEAR = new Date().getFullYear();
const YEARS_OPTIONS = Array.from({ length: 6 }, (_, i) => CURRENT_YEAR - 2 + i);
const MESES_OPTIONS = [
  { value: "01", label: "Enero" },
  { value: "02", label: "Febrero" },
  { value: "03", label: "Marzo" },
  { value: "04", label: "Abril" },
  { value: "05", label: "Mayo" },
  { value: "06", label: "Junio" },
  { value: "07", label: "Julio" },
  { value: "08", label: "Agosto" },
  { value: "09", label: "Septiembre" },
  { value: "10", label: "Octubre" },
  { value: "11", label: "Noviembre" },
  { value: "12", label: "Diciembre" },
];

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-xs text-destructive">{message}</p>;
}

export function IncidenciaForm({
  mode,
  incidenciaId,
  defaultValues,
  personas,
  contadores,
  currentUserId,
  isContador = false,
}: IncidenciaFormProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = React.useState(false);
  const [periodoMes, setPeriodoMes] = React.useState<string>(() => {
    if (defaultValues?.periodo) {
      return defaultValues.periodo.split("-")[1] ?? "";
    }
    return "";
  });
  const [periodoAnio, setPeriodoAnio] = React.useState<string>(() => {
    if (defaultValues?.periodo) {
      return defaultValues.periodo.split("-")[0] ?? String(CURRENT_YEAR);
    }
    return "";
  });

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateIncidenciaInput>({
    resolver: zodResolver(createIncidenciaSchema),
    defaultValues: {
      prioridad: "MEDIA",
      estado: "ABIERTA",
      contadorId: isContador ? currentUserId : undefined,
      ...defaultValues,
    },
  });

  function buildPeriodo(): string | undefined {
    if (periodoAnio && periodoMes) {
      return `${periodoAnio}-${periodoMes}`;
    }
    return undefined;
  }

  async function onSubmit(data: CreateIncidenciaInput) {
    setSubmitting(true);
    try {
      const payload = { ...data, periodo: buildPeriodo() };
      if (mode === "create") {
        const result = await createIncidenciaAction(payload);
        if ("error" in result && result.error) {
          toast.error("Error al crear la incidencia");
          return;
        }
        toast.success("Incidencia creada correctamente");
        router.push(`/incidencias/${result.id}`);
      } else if (mode === "edit" && incidenciaId) {
        const result = await updateIncidenciaAction(incidenciaId, payload);
        if ("error" in result && result.error) {
          toast.error("Error al actualizar la incidencia");
          return;
        }
        toast.success("Incidencia actualizada correctamente");
        router.push(`/incidencias/${incidenciaId}`);
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Datos de la Incidencia</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          {/* Empresa */}
          <div className="sm:col-span-2">
            <Label htmlFor="personaId">Empresa *</Label>
            <Controller
              name="personaId"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="mt-1 w-full">
                    <SelectValue placeholder="Seleccionar empresa" />
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

          {/* Título */}
          <div className="sm:col-span-2">
            <Label htmlFor="titulo">Título *</Label>
            <Input
              id="titulo"
              {...register("titulo")}
              placeholder="Título de la incidencia"
              className="mt-1"
            />
            <FieldError message={errors.titulo?.message} />
          </div>

          {/* Prioridad */}
          <div>
            <Label>Prioridad *</Label>
            <Controller
              name="prioridad"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="mt-1 w-full">
                    <SelectValue placeholder="Seleccionar prioridad" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALTA">Alta</SelectItem>
                    <SelectItem value="MEDIA">Media</SelectItem>
                    <SelectItem value="BAJA">Baja</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
            <FieldError message={errors.prioridad?.message} />
          </div>

          {/* Estado */}
          <div>
            <Label>Estado *</Label>
            <Controller
              name="estado"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="mt-1 w-full">
                    <SelectValue placeholder="Seleccionar estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ABIERTA">Abierta</SelectItem>
                    <SelectItem value="EN_PROGRESO">En Progreso</SelectItem>
                    <SelectItem value="RESUELTA">Resuelta</SelectItem>
                    <SelectItem value="CERRADA">Cerrada</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
            <FieldError message={errors.estado?.message} />
          </div>

          {/* Contador */}
          <div>
            <Label>Contador *</Label>
            <Controller
              name="contadorId"
              control={control}
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
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

          {/* Fecha Límite */}
          <div>
            <Label>Fecha Límite</Label>
            <Controller
              name="fechaLimite"
              control={control}
              render={({ field }) => (
                <div className="mt-1">
                  <DatePicker
                    value={field.value ?? null}
                    onChange={field.onChange}
                    placeholder="Sin fecha límite"
                    className="w-full"
                  />
                </div>
              )}
            />
          </div>

          {/* Periodo */}
          <div>
            <Label>Mes del Periodo</Label>
            <Select
              value={periodoMes}
              onValueChange={(v) => setPeriodoMes(v ?? "")}
            >
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
            <Select
              value={periodoAnio}
              onValueChange={(v) => setPeriodoAnio(v ?? "")}
            >
              <SelectTrigger className="mt-1 w-full">
                <SelectValue placeholder="Año (opcional)" />
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
        </CardContent>
      </Card>

      {/* Descripción */}
      <Card>
        <CardHeader>
          <CardTitle>Descripción</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="descripcion">Descripción *</Label>
            <Textarea
              id="descripcion"
              {...register("descripcion")}
              placeholder="Descripción detallada de la incidencia..."
              rows={5}
              className="mt-1"
            />
            <FieldError message={errors.descripcion?.message} />
          </div>

          <div>
            <Label htmlFor="detalleFinanciero">Detalle Financiero</Label>
            <Textarea
              id="detalleFinanciero"
              {...register("detalleFinanciero")}
              placeholder="Información financiera relevante (opcional)..."
              rows={3}
              className="mt-1"
            />
          </div>
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
              ? "Crear Incidencia"
              : "Guardar Cambios"}
        </Button>
      </div>
    </form>
  );
}
