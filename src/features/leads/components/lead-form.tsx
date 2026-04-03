"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createLeadSchema, type CreateLeadInput } from "@/features/leads/schemas";
import { createLeadAction, updateLeadAction } from "@/features/leads/actions";

const RUBROS = [
  "Transportes A",
  "Transportes B",
  "Transportes C",
  "Servicios y Constructoras",
  "Constructoras",
  "Inmuebles Lotes",
  "Inmuebles Casas",
  "Redes de Mercadeo",
  "Otros",
];

interface StaffOption {
  id: string;
  nombre: string;
  apellido: string;
}

interface LeadFormProps {
  mode: "create" | "edit";
  leadId?: string;
  defaultValues?: Partial<CreateLeadInput>;
  staff: StaffOption[];
}

export function LeadForm({ mode, leadId, defaultValues, staff }: LeadFormProps) {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<CreateLeadInput>({
    resolver: zodResolver(createLeadSchema),
    defaultValues: {
      nombre: "",
      apellido: "",
      dni: "",
      celular: "",
      email: "",
      notas: "",
      ...defaultValues,
    },
  });

  async function onSubmit(data: CreateLeadInput) {
    const result =
      mode === "create"
        ? await createLeadAction(data)
        : await updateLeadAction(leadId!, data);

    if (result.error) {
      toast.error("Revisá los datos ingresados");
      return;
    }

    toast.success(
      mode === "create" ? "Prospecto creado correctamente" : "Prospecto actualizado"
    );

    if (mode === "create" && result.data) {
      router.push(`/prospectos/${result.data.id}`);
    } else {
      router.push(`/prospectos/${leadId}`);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="rounded-xl border bg-card p-6 space-y-4">
        <h2 className="text-sm font-semibold text-foreground">Datos personales</h2>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="nombre">Nombre *</Label>
            <Input
              id="nombre"
              placeholder="Juan"
              aria-invalid={!!errors.nombre}
              {...register("nombre")}
            />
            {errors.nombre && (
              <p className="text-xs text-destructive">{errors.nombre.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="apellido">Apellido *</Label>
            <Input
              id="apellido"
              placeholder="García"
              aria-invalid={!!errors.apellido}
              {...register("apellido")}
            />
            {errors.apellido && (
              <p className="text-xs text-destructive">{errors.apellido.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="dni">DNI (opcional)</Label>
            <Input
              id="dni"
              placeholder="12345678"
              maxLength={8}
              aria-invalid={!!errors.dni}
              {...register("dni")}
            />
            {errors.dni && (
              <p className="text-xs text-destructive">{errors.dni.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="celular">Celular *</Label>
            <Input
              id="celular"
              placeholder="987654321"
              aria-invalid={!!errors.celular}
              {...register("celular")}
            />
            {errors.celular && (
              <p className="text-xs text-destructive">{errors.celular.message}</p>
            )}
          </div>

          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="email">Email (opcional)</Label>
            <Input
              id="email"
              type="email"
              placeholder="juan@empresa.com"
              aria-invalid={!!errors.email}
              {...register("email")}
            />
            {errors.email && (
              <p className="text-xs text-destructive">{errors.email.message}</p>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-xl border bg-card p-6 space-y-4">
        <h2 className="text-sm font-semibold text-foreground">Datos del negocio</h2>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="regimen">Régimen tributario</Label>
            <Controller
              control={control}
              name="regimen"
              render={({ field }) => (
                <Select value={field.value ?? ""} onValueChange={field.onChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Seleccionar..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MYPE">MYPE</SelectItem>
                    <SelectItem value="RER">RER</SelectItem>
                    <SelectItem value="REG">Régimen General</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="rubro">Rubro</Label>
            <Controller
              control={control}
              name="rubro"
              render={({ field }) => (
                <Select value={field.value ?? ""} onValueChange={field.onChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Seleccionar..." />
                  </SelectTrigger>
                  <SelectContent>
                    {RUBROS.map((r) => (
                      <SelectItem key={r} value={r}>
                        {r}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="numTrabajadores">N° de trabajadores</Label>
            <Input
              id="numTrabajadores"
              type="number"
              min={0}
              placeholder="0"
              {...register("numTrabajadores", { valueAsNumber: true })}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="asignadoAId">Asignado a</Label>
            <Controller
              control={control}
              name="asignadoAId"
              render={({ field }) => (
                <Select value={field.value ?? ""} onValueChange={field.onChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Sin asignar" />
                  </SelectTrigger>
                  <SelectContent>
                    {staff.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.nombre} {s.apellido}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="notas">Notas</Label>
          <Textarea
            id="notas"
            placeholder="Observaciones, contexto del prospecto..."
            rows={3}
            {...register("notas")}
          />
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isSubmitting}
        >
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting
            ? "Guardando..."
            : mode === "create"
            ? "Crear prospecto"
            : "Guardar cambios"}
        </Button>
      </div>
    </form>
  );
}
