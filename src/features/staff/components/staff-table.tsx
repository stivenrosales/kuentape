"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal, KeyRound } from "lucide-react";
import { toast } from "sonner";

import { DataTable } from "@/components/data-table/data-table";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toggleStaffActiveAction, resetPasswordAction } from "../actions";
import { StaffForm } from "./staff-form";
import type { getStaffList } from "../queries";

type StaffMember = Awaited<ReturnType<typeof getStaffList>>[number];

const roleBadgeClass: Record<string, string> = {
  GERENCIA: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
  ADMINISTRADOR: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  CONTADOR: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  VENTAS: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
};

const roleLabel: Record<string, string> = {
  GERENCIA: "Gerencia",
  ADMINISTRADOR: "Administrador",
  CONTADOR: "Contador",
  VENTAS: "Ventas",
};

function ResetPasswordDialog({
  userId,
  open,
  onOpenChange,
}: {
  userId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [password, setPassword] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleSubmit() {
    startTransition(async () => {
      const result = await resetPasswordAction(userId, password);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Contraseña actualizada");
        setPassword("");
        onOpenChange(false);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cambiar contraseña</DialogTitle>
        </DialogHeader>
        <div className="space-y-2 py-2">
          <Label htmlFor="new-password">Nueva contraseña</Label>
          <Input
            id="new-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Mínimo 6 caracteres"
          />
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isPending || password.length < 6}
          >
            {isPending ? "Guardando..." : "Guardar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ActionsCell({ row }: { row: { original: StaffMember } }) {
  const staff = row.original;
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [resetOpen, setResetOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  function handleToggle() {
    startTransition(async () => {
      const result = await toggleStaffActiveAction(staff.id);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(
          result.activo ? "Miembro activado" : "Miembro desactivado"
        );
      }
    });
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger className="inline-flex size-8 items-center justify-center rounded-lg hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50">
          <MoreHorizontal className="size-4" />
          <span className="sr-only">Abrir menú</span>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => router.push(`/equipo/${staff.id}`)}>
            Ver detalle
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setEditOpen(true)}>
            Editar
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setResetOpen(true)}>
            <KeyRound className="size-4" />
            Cambiar contraseña
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant={staff.activo ? "destructive" : "default"}
            onClick={handleToggle}
          >
            {staff.activo ? "Desactivar" : "Activar"}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ResetPasswordDialog
        userId={staff.id}
        open={resetOpen}
        onOpenChange={setResetOpen}
      />

      <StaffForm
        mode="edit"
        staffId={staff.id}
        defaultValues={{
          nombre: staff.nombre,
          apellido: staff.apellido,
          role: staff.role,
          telefono: staff.telefono ?? undefined,
        }}
        open={editOpen}
        onOpenChange={setEditOpen}
      />
    </>
  );
}

const columns: ColumnDef<StaffMember>[] = [
  {
    id: "nombre_completo",
    header: "Nombre",
    accessorFn: (row) => `${row.nombre} ${row.apellido}`,
    cell: ({ row }) => (
      <div>
        <p className="font-medium">
          {row.original.nombre} {row.original.apellido}
        </p>
        <p className="text-xs text-muted-foreground">{row.original.email}</p>
      </div>
    ),
  },
  {
    accessorKey: "role",
    header: "Rol",
    cell: ({ row }) => (
      <span
        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
          roleBadgeClass[row.original.role] ?? ""
        }`}
      >
        {roleLabel[row.original.role] ?? row.original.role}
      </span>
    ),
  },
  {
    accessorKey: "activo",
    header: "Estado",
    cell: ({ row }) => (
      <div className="flex items-center gap-1.5">
        <span
          className={`size-2 rounded-full ${
            row.original.activo ? "bg-green-500" : "bg-gray-400"
          }`}
        />
        <span className="text-sm">
          {row.original.activo ? "Activo" : "Inactivo"}
        </span>
      </div>
    ),
  },
  {
    id: "servicios",
    header: "Servicios",
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground">
        {row.original._count.servicios}
      </span>
    ),
  },
  {
    id: "personas",
    header: "Clientes",
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground">
        {row.original._count.personasAsignadas}
      </span>
    ),
  },
  {
    id: "actions",
    header: "",
    cell: ({ row }) => <ActionsCell row={row} />,
  },
];

interface StaffTableProps {
  data: StaffMember[];
}

export function StaffTable({ data }: StaffTableProps) {
  return (
    <DataTable
      columns={columns}
      data={data}
      searchKey="nombre_completo"
      searchPlaceholder="Buscar miembro..."
      emptyMessage="No hay miembros del equipo."
    />
  );
}
