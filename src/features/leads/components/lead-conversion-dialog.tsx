"use client";

import * as React from "react";
import Link from "next/link";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Building2, User, CheckCircle2, ChevronLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  convertLeadSchema,
  type ConvertLeadInput,
} from "@/features/leads/schemas";
import { convertLeadToPersonaAction } from "@/features/leads/actions";

interface LeadData {
  id: string;
  nombre: string;
  apellido: string;
  dni: string | null;
  celular: string;
  email: string | null;
  regimen: "MYPE" | "RER" | "REG" | null;
  numTrabajadores: number | null;
}

interface StaffOption {
  id: string;
  nombre: string;
  apellido: string;
}

interface LeadConversionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead: LeadData;
  staff: StaffOption[];
}

type Step = "tipo" | "form" | "success";

export function LeadConversionDialog({
  open,
  onOpenChange,
  lead,
  staff,
}: LeadConversionDialogProps) {
  const [step, setStep] = React.useState<Step>("tipo");
  const [tipoPersona, setTipoPersona] = React.useState<
    "JURIDICA" | "NATURAL" | null
  >(null);
  const [newPersonaId, setNewPersonaId] = React.useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ConvertLeadInput>({
    resolver: zodResolver(convertLeadSchema),
    defaultValues: {
      tipoPersona: "JURIDICA",
      regimen: lead.regimen ?? undefined,
    },
  });

  function handleClose() {
    onOpenChange(false);
    setTimeout(() => {
      setStep("tipo");
      setTipoPersona(null);
      setNewPersonaId(null);
      reset();
    }, 200);
  }

  function handleSelectTipo(tipo: "JURIDICA" | "NATURAL") {
    setTipoPersona(tipo);
    reset({ tipoPersona: tipo, regimen: lead.regimen ?? undefined });
    setStep("form");
  }

  async function onSubmit(data: ConvertLeadInput) {
    const result = await convertLeadToPersonaAction(lead.id, {
      ...data,
      tipoPersona: tipoPersona!,
    });

    if (result.error) {
      toast.error(
        typeof result.error === "string"
          ? result.error
          : "Error al convertir el prospecto"
      );
      return;
    }

    setNewPersonaId(result.data!.id);
    setStep("success");
    toast.success("Prospecto convertido a cliente exitosamente");
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        {step === "tipo" && (
          <>
            <DialogHeader>
              <DialogTitle>Convertir a cliente</DialogTitle>
              <DialogDescription>
                Elegí el tipo de persona para{" "}
                <strong>
                  {lead.nombre} {lead.apellido}
                </strong>
              </DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-2 gap-4 py-2">
              <button
                type="button"
                onClick={() => handleSelectTipo("JURIDICA")}
                className="flex flex-col items-center gap-3 rounded-xl border-2 border-border p-6 text-center transition-all hover:border-primary hover:bg-primary/5 cursor-pointer"
              >
                <Building2 className="h-8 w-8 text-muted-foreground" />
                <div>
                  <p className="text-sm font-semibold">Persona Jurídica</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Empresa con RUC propio
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleSelectTipo("NATURAL")}
                className="flex flex-col items-center gap-3 rounded-xl border-2 border-border p-6 text-center transition-all hover:border-primary hover:bg-primary/5 cursor-pointer"
              >
                <User className="h-8 w-8 text-muted-foreground" />
                <div>
                  <p className="text-sm font-semibold">Persona Natural</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Con datos del prospecto
                  </p>
                </div>
              </button>
            </div>
          </>
        )}

        {step === "form" && (
          <>
            <DialogHeader>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => setStep("tipo")}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <DialogTitle>
                  {tipoPersona === "JURIDICA" ? "Persona Jurídica" : "Persona Natural"}
                </DialogTitle>
              </div>
              <DialogDescription>
                {tipoPersona === "JURIDICA"
                  ? "Completá los datos de la empresa"
                  : `Se usarán los datos de ${lead.nombre} ${lead.apellido}`}
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {tipoPersona === "NATURAL" && (
                <div className="rounded-lg bg-muted/50 p-3 space-y-1 text-sm">
                  <p>
                    <span className="text-muted-foreground">Nombre: </span>
                    <span className="font-medium">
                      {lead.nombre} {lead.apellido}
                    </span>
                  </p>
                  {lead.dni && (
                    <p>
                      <span className="text-muted-foreground">DNI: </span>
                      <span className="font-medium">{lead.dni}</span>
                    </p>
                  )}
                  <p>
                    <span className="text-muted-foreground">Celular: </span>
                    <span className="font-medium">{lead.celular}</span>
                  </p>
                </div>
              )}

              {tipoPersona === "JURIDICA" && (
                <>
                  <div className="space-y-1.5">
                    <Label htmlFor="razonSocial">Razón Social *</Label>
                    <Input
                      id="razonSocial"
                      placeholder="Empresa S.A.C."
                      aria-invalid={!!errors.razonSocial}
                      {...register("razonSocial")}
                    />
                    {errors.razonSocial && (
                      <p className="text-xs text-destructive">
                        {errors.razonSocial.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="ruc">RUC *</Label>
                    <Input
                      id="ruc"
                      placeholder="20123456789"
                      maxLength={11}
                      aria-invalid={!!errors.ruc}
                      {...register("ruc")}
                    />
                    {errors.ruc && (
                      <p className="text-xs text-destructive">
                        {errors.ruc.message}
                      </p>
                    )}
                  </div>
                </>
              )}

              <div className="space-y-1.5">
                <Label>Régimen *</Label>
                <Controller
                  control={control}
                  name="regimen"
                  render={({ field }) => (
                    <Select value={field.value ?? ""} onValueChange={field.onChange}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Seleccionar régimen..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MYPE">MYPE</SelectItem>
                        <SelectItem value="RER">RER</SelectItem>
                        <SelectItem value="REG">Régimen General</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.regimen && (
                  <p className="text-xs text-destructive">
                    {errors.regimen.message}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label>Contador asignado *</Label>
                <Controller
                  control={control}
                  name="contadorAsignadoId"
                  render={({ field }) => (
                    <Select value={field.value ?? ""} onValueChange={field.onChange}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Seleccionar contador..." />
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
                {errors.contadorAsignadoId && (
                  <p className="text-xs text-destructive">
                    {errors.contadorAsignadoId.message}
                  </p>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  disabled={isSubmitting}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Convirtiendo..." : "Confirmar conversión"}
                </Button>
              </div>
            </form>
          </>
        )}

        {step === "success" && (
          <div className="flex flex-col items-center gap-4 py-4 text-center">
            <CheckCircle2 className="h-12 w-12 text-green-500" />
            <div>
              <h3 className="text-base font-semibold">¡Conversión exitosa!</h3>
              <p className="text-sm text-muted-foreground mt-1">
                El prospecto fue convertido a cliente correctamente.
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleClose}>
                Cerrar
              </Button>
              {newPersonaId && (
                <Button render={<Link href={`/clientes/${newPersonaId}`} />}>
                  Ver cliente
                </Button>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
