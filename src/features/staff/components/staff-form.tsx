"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createStaffAction, updateStaffAction } from "../actions";
import {
  createStaffSchema,
  updateStaffSchema,
  type CreateStaffInput,
  type UpdateStaffInput,
} from "../schemas";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const createSchema = createStaffSchema as any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const updateSchema = updateStaffSchema as any;

const ROLES = [
  { value: "GERENCIA", label: "Gerencia" },
  { value: "ADMINISTRADOR", label: "Administrador" },
  { value: "CONTADOR", label: "Contador" },
  { value: "VENTAS", label: "Ventas" },
] as const;

interface StaffFormBaseProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface StaffFormCreateProps extends StaffFormBaseProps {
  mode: "create";
  staffId?: never;
  defaultValues?: never;
}

interface StaffFormEditProps extends StaffFormBaseProps {
  mode: "edit";
  staffId: string;
  defaultValues: UpdateStaffInput;
}

type StaffFormProps = StaffFormCreateProps | StaffFormEditProps;

function CreateForm({
  open,
  onOpenChange,
}: StaffFormBaseProps) {
  const [isPending, startTransition] = useTransition();

  const form = useForm<CreateStaffInput>({
    resolver: zodResolver(createSchema),
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
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nuevo miembro</DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="create-nombre">Nombre</Label>
              <Input id="create-nombre" {...form.register("nombre")} placeholder="Juan" />
              {form.formState.errors.nombre && (
                <p className="text-xs text-destructive">{form.formState.errors.nombre.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="create-apellido">Apellido</Label>
              <Input id="create-apellido" {...form.register("apellido")} placeholder="García" />
              {form.formState.errors.apellido && (
                <p className="text-xs text-destructive">{form.formState.errors.apellido.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="create-email">Email</Label>
            <Input id="create-email" type="email" {...form.register("email")} placeholder="juan@estudio.com" />
            {form.formState.errors.email && (
              <p className="text-xs text-destructive">{form.formState.errors.email.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="create-password">Contraseña</Label>
            <Input id="create-password" type="password" {...form.register("password")} placeholder="Mínimo 6 caracteres" />
            {form.formState.errors.password && (
              <p className="text-xs text-destructive">{form.formState.errors.password.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label>Rol</Label>
            <Select
              value={form.watch("role")}
              onValueChange={(val) =>
                form.setValue("role", val as CreateStaffInput["role"], { shouldValidate: true })
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Seleccionar rol" />
              </SelectTrigger>
              <SelectContent>
                {ROLES.map((r) => (
                  <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="create-telefono">Teléfono (opcional)</Label>
            <Input id="create-telefono" {...form.register("telefono")} placeholder="999 888 777" />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Guardando..." : "Crear miembro"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function EditForm({
  staffId,
  defaultValues,
  open,
  onOpenChange,
}: StaffFormEditProps) {
  const [isPending, startTransition] = useTransition();

  const form = useForm<UpdateStaffInput>({
    resolver: zodResolver(updateSchema),
    defaultValues: {
      nombre: defaultValues?.nombre ?? "",
      apellido: defaultValues?.apellido ?? "",
      role: defaultValues?.role ?? "CONTADOR",
      telefono: defaultValues?.telefono ?? "",
    },
  });

  function onSubmit(data: UpdateStaffInput) {
    startTransition(async () => {
      const result = await updateStaffAction(staffId, data);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Miembro actualizado exitosamente");
        onOpenChange(false);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Editar miembro</DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="edit-nombre">Nombre</Label>
              <Input id="edit-nombre" {...form.register("nombre")} placeholder="Juan" />
              {form.formState.errors.nombre && (
                <p className="text-xs text-destructive">{form.formState.errors.nombre.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-apellido">Apellido</Label>
              <Input id="edit-apellido" {...form.register("apellido")} placeholder="García" />
              {form.formState.errors.apellido && (
                <p className="text-xs text-destructive">{form.formState.errors.apellido.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Rol</Label>
            <Select
              value={form.watch("role") ?? "CONTADOR"}
              onValueChange={(val) =>
                form.setValue("role", val as UpdateStaffInput["role"], { shouldValidate: true })
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Seleccionar rol" />
              </SelectTrigger>
              <SelectContent>
                {ROLES.map((r) => (
                  <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="edit-telefono">Teléfono (opcional)</Label>
            <Input id="edit-telefono" {...form.register("telefono")} placeholder="999 888 777" />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Guardando..." : "Guardar cambios"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function StaffForm(props: StaffFormProps) {
  if (props.mode === "create") {
    return <CreateForm open={props.open} onOpenChange={props.onOpenChange} />;
  }
  return <EditForm {...props} />;
}
