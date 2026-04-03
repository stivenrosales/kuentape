"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { X } from "lucide-react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createStaffAction } from "@/features/staff/actions";
import { createStaffSchema, type CreateStaffInput } from "@/features/staff/schemas";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const schema = createStaffSchema as any;

const ROLES = [
  { value: "GERENCIA", label: "Gerencia" },
  { value: "ADMINISTRADOR", label: "Administrador" },
  { value: "CONTADOR", label: "Contador" },
  { value: "VENTAS", label: "Ventas" },
] as const;

interface NuevoStaffDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NuevoStaffDialog({ open, onOpenChange }: NuevoStaffDialogProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const form = useForm<CreateStaffInput>({
    resolver: zodResolver(schema),
    defaultValues: {
      nombre: "",
      apellido: "",
      email: "",
      password: "",
      role: "CONTADOR",
      telefono: "",
    },
  });

  function onSubmit(data: CreateStaffInput) {
    startTransition(async () => {
      const result = await createStaffAction(data);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Miembro creado exitosamente");
        form.reset();
        onOpenChange(false);
        router.refresh();
      }
    });
  }

  function handleClose() {
    if (!isPending) {
      form.reset();
      onOpenChange(false);
    }
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={handleClose}
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />
      <div
        className="relative w-full max-w-md bg-card rounded-lg shadow-2xl overflow-hidden animate-in zoom-in-95 fade-in duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="text-base font-semibold">Nuevo miembro</h2>
          <button
            onClick={handleClose}
            disabled={isPending}
            className="rounded-lg p-1 hover:bg-muted transition-colors text-muted-foreground disabled:opacity-50"
          >
            <X className="size-4" />
            <span className="sr-only">Cerrar</span>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={form.handleSubmit(onSubmit)} className="px-5 py-4 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label htmlFor="nuevo-nombre" className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                Nombre
              </label>
              <input
                id="nuevo-nombre"
                {...form.register("nombre")}
                placeholder="Juan"
                className="w-full rounded border border-border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
              {form.formState.errors.nombre && (
                <p className="text-xs text-destructive">{form.formState.errors.nombre.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <label htmlFor="nuevo-apellido" className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                Apellido
              </label>
              <input
                id="nuevo-apellido"
                {...form.register("apellido")}
                placeholder="García"
                className="w-full rounded border border-border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
              {form.formState.errors.apellido && (
                <p className="text-xs text-destructive">{form.formState.errors.apellido.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="nuevo-email" className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
              Email
            </label>
            <input
              id="nuevo-email"
              type="email"
              {...form.register("email")}
              placeholder="juan@estudio.com"
              className="w-full rounded border border-border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
            {form.formState.errors.email && (
              <p className="text-xs text-destructive">{form.formState.errors.email.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <label htmlFor="nuevo-password" className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
              Contraseña
            </label>
            <input
              id="nuevo-password"
              type="password"
              {...form.register("password")}
              placeholder="Mínimo 6 caracteres"
              className="w-full rounded border border-border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
            {form.formState.errors.password && (
              <p className="text-xs text-destructive">{form.formState.errors.password.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
              Rol
            </p>
            <Select
              value={form.watch("role")}
              onValueChange={(val) =>
                form.setValue("role", val as CreateStaffInput["role"], {
                  shouldValidate: true,
                })
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue>
                  {ROLES.find((r) => r.value === form.watch("role"))?.label ?? "Seleccionar rol"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {ROLES.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="nuevo-telefono" className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
              Teléfono (opcional)
            </label>
            <input
              id="nuevo-telefono"
              {...form.register("telefono")}
              placeholder="999 888 777"
              className="w-full rounded border border-border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
            <button
              type="button"
              onClick={handleClose}
              disabled={isPending}
              className="rounded-md border border-border px-4 py-1.5 text-sm hover:bg-muted transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="rounded-md bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {isPending ? "Guardando..." : "Crear miembro"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
