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
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  createPersonaSchema,
  updateCredentialsSchema,
  type CreatePersonaInput,
  type UpdateCredentialsInput,
} from "@/features/personas/schemas";
import {
  createPersonaAction,
  updatePersonaAction,
  updateCredentialsAction,
} from "@/features/personas/actions";

interface ContadorOption {
  id: string;
  nombre: string;
  apellido: string;
}

interface PersonaFormProps {
  mode: "create" | "edit";
  personaId?: string;
  defaultValues?: Partial<CreatePersonaInput>;
  contadores: ContadorOption[];
}

const TIPO_OPTIONS = [
  { value: "JURIDICA", label: "Jurídica" },
  { value: "NATURAL", label: "Natural" },
  { value: "IMMUNOTEC", label: "Immunotec" },
  { value: "FOUR_LIFE", label: "Four Life" },
  { value: "RXH", label: "Recibo por Honorarios" },
] as const;

const REGIMEN_OPTIONS = [
  { value: "MYPE", label: "MYPE" },
  { value: "RER", label: "RER" },
  { value: "REG", label: "Régimen General" },
] as const;

const CONTABILIDAD_OPTIONS = [
  { value: "MANUAL", label: "Manual" },
  { value: "COMPUTARIZADA", label: "Computarizada" },
] as const;

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-xs text-destructive">{message}</p>;
}

export function PersonaForm({
  mode,
  personaId,
  defaultValues,
  contadores,
}: PersonaFormProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = React.useState(false);
  const [credSubmitting, setCredSubmitting] = React.useState(false);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<CreatePersonaInput>({
    resolver: zodResolver(createPersonaSchema),
    defaultValues: {
      tipoPersona: "JURIDICA",
      regimen: "MYPE",
      tipoContabilidad: "MANUAL",
      detracciones: false,
      planilla: false,
      ...defaultValues,
    },
  });

  const {
    register: registerCred,
    handleSubmit: handleCredSubmit,
    formState: { errors: credErrors },
  } = useForm<UpdateCredentialsInput>({
    resolver: zodResolver(updateCredentialsSchema),
    defaultValues: {
      claveSolUsuario: "",
      claveSolClave: "",
      afpUsuario: "",
      afpClave: "",
    },
  });

  async function onSubmit(data: CreatePersonaInput) {
    setSubmitting(true);
    try {
      if (mode === "create") {
        const result = await createPersonaAction(data);
        if (result.error) {
          toast.error("Error al crear el cliente");
          return;
        }
        toast.success("Cliente creado correctamente");
        router.push(`/clientes/${result.id}`);
      } else if (mode === "edit" && personaId) {
        const result = await updatePersonaAction(personaId, data);
        if (result.error) {
          toast.error("Error al actualizar el cliente");
          return;
        }
        toast.success("Cliente actualizado correctamente");
        router.push(`/clientes/${personaId}`);
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function onCredentialsSubmit(data: UpdateCredentialsInput) {
    if (!personaId) return;
    setCredSubmitting(true);
    try {
      const result = await updateCredentialsAction(personaId, data);
      if (result.error) {
        toast.error("Error al guardar las credenciales");
        return;
      }
      toast.success("Credenciales guardadas correctamente");
    } finally {
      setCredSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Sección 1: Datos Fiscales */}
        <Card>
          <CardHeader>
            <CardTitle>Datos Fiscales</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label htmlFor="razonSocial">Razón Social *</Label>
              <Input
                id="razonSocial"
                {...register("razonSocial")}
                placeholder="Empresa S.A.C."
                className="mt-1"
              />
              <FieldError message={errors.razonSocial?.message} />
            </div>

            <div>
              <Label htmlFor="ruc">RUC *</Label>
              <Input
                id="ruc"
                {...register("ruc")}
                placeholder="20123456789"
                maxLength={11}
                className="mt-1 font-mono"
              />
              <FieldError message={errors.ruc?.message} />
            </div>

            <div>
              <Label htmlFor="tipoPersona">Tipo de Persona *</Label>
              <Controller
                name="tipoPersona"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="mt-1 w-full">
                      <SelectValue placeholder="Seleccionar tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      {TIPO_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              <FieldError message={errors.tipoPersona?.message} />
            </div>

            <div>
              <Label htmlFor="regimen">Régimen *</Label>
              <Controller
                name="regimen"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="mt-1 w-full">
                      <SelectValue placeholder="Seleccionar régimen" />
                    </SelectTrigger>
                    <SelectContent>
                      {REGIMEN_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              <FieldError message={errors.regimen?.message} />
            </div>

            <div>
              <Label htmlFor="direccion">Dirección</Label>
              <Input
                id="direccion"
                {...register("direccion")}
                placeholder="Av. Principal 123, Lima"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="partidaElectronica">Partida Electrónica</Label>
              <Input
                id="partidaElectronica"
                {...register("partidaElectronica")}
                placeholder="P00123456"
                className="mt-1"
              />
            </div>
          </CardContent>
        </Card>

        {/* Sección 2: Representante Legal */}
        <Card>
          <CardHeader>
            <CardTitle>Representante Legal</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label htmlFor="representanteNombre">Nombre Completo</Label>
              <Input
                id="representanteNombre"
                {...register("representanteNombre")}
                placeholder="Juan Pérez García"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="representanteDni">DNI</Label>
              <Input
                id="representanteDni"
                {...register("representanteDni")}
                placeholder="12345678"
                maxLength={8}
                className="mt-1 font-mono"
              />
              <FieldError message={errors.representanteDni?.message} />
            </div>

            <div>
              <Label htmlFor="representanteTelefono">Teléfono</Label>
              <Input
                id="representanteTelefono"
                {...register("representanteTelefono")}
                placeholder="987654321"
                className="mt-1"
              />
            </div>
          </CardContent>
        </Card>

        {/* Sección 3: Configuración */}
        <Card>
          <CardHeader>
            <CardTitle>Configuración</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label htmlFor="contadorAsignadoId">Contador Asignado *</Label>
              <Controller
                name="contadorAsignadoId"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
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
              <FieldError message={errors.contadorAsignadoId?.message} />
            </div>

            <div>
              <Label htmlFor="tipoContabilidad">Tipo de Contabilidad</Label>
              <Controller
                name="tipoContabilidad"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="mt-1 w-full">
                      <SelectValue placeholder="Seleccionar tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      {CONTABILIDAD_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div>
              <Label htmlFor="numTrabajadores">N° de Trabajadores</Label>
              <Input
                id="numTrabajadores"
                type="number"
                min={0}
                {...register("numTrabajadores", { valueAsNumber: true })}
                placeholder="0"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="telefono">Teléfono de la Empresa</Label>
              <Input
                id="telefono"
                {...register("telefono")}
                placeholder="01-234-5678"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                {...register("email")}
                placeholder="contacto@empresa.com"
                className="mt-1"
              />
              <FieldError message={errors.email?.message} />
            </div>

            <div className="flex items-center gap-3">
              <Controller
                name="detracciones"
                control={control}
                render={({ field }) => (
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    id="detracciones"
                  />
                )}
              />
              <Label htmlFor="detracciones" className="cursor-pointer">
                Sujeto a Detracciones
              </Label>
            </div>

            <div className="flex items-center gap-3">
              <Controller
                name="planilla"
                control={control}
                render={({ field }) => (
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    id="planilla"
                  />
                )}
              />
              <Label htmlFor="planilla" className="cursor-pointer">
                Tiene Planilla
              </Label>
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
              ? "Crear Cliente"
              : "Guardar Cambios"}
          </Button>
        </div>
      </form>

      {/* Sección 4: Credenciales (solo en modo edición) */}
      {mode === "edit" && personaId && (
        <form onSubmit={handleCredSubmit(onCredentialsSubmit)}>
          <Card>
            <CardHeader>
              <CardTitle>Credenciales</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="claveSolUsuario">Clave SOL — Usuario</Label>
                <Input
                  id="claveSolUsuario"
                  {...registerCred("claveSolUsuario")}
                  placeholder="Usuario SUNAT"
                  className="mt-1"
                  autoComplete="off"
                />
                <FieldError message={credErrors.claveSolUsuario?.message} />
              </div>

              <div>
                <Label htmlFor="claveSolClave">Clave SOL — Clave</Label>
                <Input
                  id="claveSolClave"
                  type="password"
                  {...registerCred("claveSolClave")}
                  placeholder="Clave SUNAT"
                  className="mt-1"
                  autoComplete="new-password"
                />
                <FieldError message={credErrors.claveSolClave?.message} />
              </div>

              <div>
                <Label htmlFor="afpUsuario">AFP — Usuario</Label>
                <Input
                  id="afpUsuario"
                  {...registerCred("afpUsuario")}
                  placeholder="Usuario AFP"
                  className="mt-1"
                  autoComplete="off"
                />
                <FieldError message={credErrors.afpUsuario?.message} />
              </div>

              <div>
                <Label htmlFor="afpClave">AFP — Clave</Label>
                <Input
                  id="afpClave"
                  type="password"
                  {...registerCred("afpClave")}
                  placeholder="Clave AFP"
                  className="mt-1"
                  autoComplete="new-password"
                />
                <FieldError message={credErrors.afpClave?.message} />
              </div>

              <div className="sm:col-span-2 flex justify-end">
                <Button type="submit" variant="outline" disabled={credSubmitting}>
                  {credSubmitting ? "Guardando..." : "Guardar Credenciales"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      )}
    </div>
  );
}
