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
import {
  createTipoServicioSchema,
  type CreateTipoServicioInput,
} from "@/features/servicios/schemas";
import {
  createTipoServicioAction,
  updateTipoServicioAction,
} from "@/features/servicios/actions";
import type { TipoServicioRow } from "./tipo-servicio-table";

const CATEGORIA_OPTIONS = [
  { value: "MENSUAL", label: "Mensual" },
  { value: "ANUAL", label: "Anual" },
  { value: "TRAMITE", label: "Trámite" },
  { value: "ASESORIA", label: "Asesoría" },
  { value: "CONSTITUCION", label: "Constitución" },
  { value: "REGULARIZACION", label: "Regularización" },
  { value: "MODIF_ESTATUTO", label: "Modificación de Estatuto" },
  { value: "OTROS", label: "Otros" },
] as const;

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-xs text-destructive">{message}</p>;
}

interface TipoServicioDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingItem?: TipoServicioRow | null;
}

export function TipoServicioDialog({
  open,
  onOpenChange,
  editingItem,
}: TipoServicioDialogProps) {
  const [submitting, setSubmitting] = React.useState(false);
  const isEdit = Boolean(editingItem);

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateTipoServicioInput>({
    resolver: zodResolver(createTipoServicioSchema as any),
    defaultValues: {
      nombre: "",
      categoria: "MENSUAL",
      requierePeriodo: false,
      activo: true,
      orden: 0,
    },
  });

  // Populate form when editing
  React.useEffect(() => {
    if (open) {
      if (editingItem) {
        reset({
          nombre: editingItem.nombre,
          categoria: editingItem.categoria,
          requierePeriodo: editingItem.requierePeriodo,
          activo: editingItem.activo,
          orden: editingItem.orden,
        });
      } else {
        reset({
          nombre: "",
          categoria: "MENSUAL",
          requierePeriodo: false,
          activo: true,
          orden: 0,
        });
      }
    }
  }, [open, editingItem, reset]);

  async function onSubmit(data: CreateTipoServicioInput) {
    setSubmitting(true);
    try {
      if (isEdit && editingItem) {
        const result = await updateTipoServicioAction(editingItem.id, data);
        if (result.error) {
          toast.error("Error al actualizar el tipo de servicio");
          return;
        }
        toast.success("Tipo de servicio actualizado");
      } else {
        const result = await createTipoServicioAction(data);
        if (result.error) {
          toast.error("Error al crear el tipo de servicio");
          return;
        }
        toast.success("Tipo de servicio creado");
      }
      onOpenChange(false);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Editar Tipo de Servicio" : "Nuevo Tipo de Servicio"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="nombre">Nombre *</Label>
            <Input
              id="nombre"
              {...register("nombre")}
              placeholder="Declaración Mensual"
              className="mt-1"
            />
            <FieldError message={errors.nombre?.message} />
          </div>

          <div>
            <Label htmlFor="categoria">Categoría *</Label>
            <Controller
              name="categoria"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={(v) => v && field.onChange(v)}>
                  <SelectTrigger className="mt-1 w-full">
                    <SelectValue placeholder="Seleccionar categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIA_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            <FieldError message={errors.categoria?.message} />
          </div>

          <div>
            <Label htmlFor="orden">Orden</Label>
            <Input
              id="orden"
              type="number"
              min={0}
              {...register("orden", { valueAsNumber: true })}
              placeholder="0"
              className="mt-1"
            />
          </div>

          <div className="flex items-center gap-3">
            <Controller
              name="requierePeriodo"
              control={control}
              render={({ field }) => (
                <Switch
                  id="requierePeriodo"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              )}
            />
            <Label htmlFor="requierePeriodo" className="cursor-pointer">
              Requiere Periodo
            </Label>
          </div>

          <div className="flex items-center gap-3">
            <Controller
              name="activo"
              control={control}
              render={({ field }) => (
                <Switch
                  id="activo"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              )}
            />
            <Label htmlFor="activo" className="cursor-pointer">
              Activo
            </Label>
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
              {submitting
                ? "Guardando..."
                : isEdit
                  ? "Guardar Cambios"
                  : "Crear Tipo"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
