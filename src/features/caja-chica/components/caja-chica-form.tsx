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
  SelectTrigger,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { CurrencyInput } from "@/components/currency-input";
import { DatePicker } from "@/components/date-picker";
import { createCajaChicaSchema, CATEGORIAS_CAJA_CHICA } from "../schemas";
import type { CreateCajaChicaInput } from "../schemas";
import { createCajaChicaAction, updateCajaChicaAction } from "../actions";
import { UploadIcon, Loader2Icon, XIcon } from "lucide-react";

function FileUpload({ value, onChange }: { value: string | null | undefined; onChange: (url: string | null) => void }) {
  const [uploading, setUploading] = React.useState(false);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "caja-chica");
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      if (!res.ok) { toast.error("Error al subir"); return; }
      const { url } = await res.json();
      onChange(url);
      toast.success("Comprobante subido");
    } catch { toast.error("Error al subir"); }
    finally { setUploading(false); }
  }

  if (value) {
    return (
      <div className="relative rounded-lg border border-border overflow-hidden">
        <img src={value} alt="Comprobante" className="w-full h-28 object-contain bg-muted/20" />
        <button
          type="button"
          onClick={() => onChange(null)}
          className="absolute top-1.5 right-1.5 p-1 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
        >
          <XIcon className="h-3 w-3" />
        </button>
      </div>
    );
  }

  return (
    <label className="flex items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border py-4 cursor-pointer hover:border-primary/40 hover:bg-muted/20 transition-colors">
      {uploading ? (
        <Loader2Icon className="h-4 w-4 animate-spin text-muted-foreground" />
      ) : (
        <>
          <UploadIcon className="h-4 w-4 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">Subir boleta o comprobante</span>
        </>
      )}
      <input type="file" className="hidden" accept="image/*,application/pdf" onChange={handleFile} disabled={uploading} />
    </label>
  );
}

interface CuentaBancaria {
  id: string;
  nombre: string;
  banco: string;
}

interface CajaChicaFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editId?: string;
  defaultValues?: Partial<CreateCajaChicaInput>;
  cuentas?: CuentaBancaria[];
}

export function CajaChicaForm({
  open,
  onOpenChange,
  editId,
  defaultValues,
  cuentas = [],
}: CajaChicaFormProps) {
  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CreateCajaChicaInput>({
    resolver: zodResolver(createCajaChicaSchema as any),
    defaultValues: {
      tipo: "INGRESO",
      monto: 0,
      fecha: new Date(),
      concepto: "",
      categoriaGasto: null,
      comprobanteUrl: null,
      cuentaOrigenId: null,
      ...defaultValues,
    },
  });

  const tipo = watch("tipo");

  async function onSubmit(data: CreateCajaChicaInput) {
    const result = editId
      ? await updateCajaChicaAction(editId, data)
      : await createCajaChicaAction(data);

    if (result.error) {
      toast.error("Revisá los datos ingresados");
      return;
    }

    const msg = editId ? "Movimiento actualizado" : "Movimiento registrado";
    if (!editId && data.tipo === "INGRESO" && data.cuentaOrigenId) {
      toast.success(`${msg}. Egreso registrado en Finanzas automáticamente.`);
    } else {
      toast.success(msg);
    }
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
                  Ingreso (reposición)
                </span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" value="GASTO" {...register("tipo")} />
                <span className="font-medium text-sm text-red-700 dark:text-red-400">
                  Gasto
                </span>
              </label>
            </div>
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
                />
              )}
            />
            {errors.monto && <p className="text-xs text-destructive">{errors.monto.message}</p>}
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
                />
              )}
            />
          </div>

          {/* Concepto */}
          <div className="space-y-1.5">
            <Label htmlFor="cc-concepto">Concepto</Label>
            <Input id="cc-concepto" placeholder="Descripción del movimiento" {...register("concepto")} />
            {errors.concepto && <p className="text-xs text-destructive">{errors.concepto.message}</p>}
          </div>

          {/* Categoría de gasto — solo GASTO */}
          {tipo === "GASTO" && (
            <div className="space-y-1.5">
              <Label>Categoría</Label>
              <Controller
                control={control}
                name="categoriaGasto"
                render={({ field }) => (
                  <Select value={field.value ?? ""} onValueChange={(v) => field.onChange(v || null)}>
                    <SelectTrigger size="sm" className="w-full">
                      {field.value || "Seleccionar categoría"}
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIAS_CAJA_CHICA.map((cat) => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          )}

          {/* Cuenta de origen — solo INGRESO nuevo (genera egreso en Finanzas) */}
          {tipo === "INGRESO" && !editId && cuentas.length > 0 && (
            <div className="space-y-1.5">
              <Label>¿De qué cuenta sale?</Label>
              <Controller
                control={control}
                name="cuentaOrigenId"
                render={({ field }) => (
                  <Select value={field.value ?? ""} onValueChange={(v) => field.onChange(v || null)}>
                    <SelectTrigger size="sm" className="w-full">
                      {field.value
                        ? cuentas.find((c) => c.id === field.value)?.nombre ?? "Seleccionar"
                        : "Seleccionar cuenta"
                      }
                    </SelectTrigger>
                    <SelectContent>
                      {cuentas.map((c) => (
                        <SelectItem key={c.id} value={c.id}>{c.nombre} — {c.banco}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              <p className="text-[10px] text-muted-foreground">
                Se registra automáticamente un egreso en Finanzas desde esta cuenta.
              </p>
            </div>
          )}

          {/* Comprobante — upload */}
          <div className="space-y-1.5">
            <Label>Comprobante (opcional)</Label>
            <Controller
              control={control}
              name="comprobanteUrl"
              render={({ field }) => (
                <FileUpload
                  value={field.value}
                  onChange={(url) => field.onChange(url)}
                />
              )}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Guardando..." : editId ? "Guardar" : "Registrar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
