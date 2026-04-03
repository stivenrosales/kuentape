"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Users,
  Briefcase,
  TrendingUp,
  ArrowLeft,
  KeyRound,
} from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/layout/page-header";
import { KPICard } from "@/components/kpi-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCurrency, formatPercent } from "@/lib/format";
import { toggleStaffActiveAction, resetPasswordAction } from "../actions";
import { StaffForm } from "./staff-form";
import type { getStaffDetail, getStaffPerformance, getStaffRecentServicios } from "../queries";

type StaffDetail = NonNullable<Awaited<ReturnType<typeof getStaffDetail>>>;
type Performance = Awaited<ReturnType<typeof getStaffPerformance>>;
type RecentServicios = Awaited<ReturnType<typeof getStaffRecentServicios>>;

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

const estadoCobranzaLabel: Record<string, string> = {
  PENDIENTE: "Pendiente",
  PARCIAL: "Parcial",
  COBRADO: "Cobrado",
  INCOBRABLE: "Incobrable",
};

interface StaffDetailClientProps {
  staff: StaffDetail;
  performance: Performance;
  recentServicios: RecentServicios;
}

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
          <Label htmlFor="new-password-detail">Nueva contraseña</Label>
          <Input
            id="new-password-detail"
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

export function StaffDetailClient({
  staff,
  performance,
  recentServicios,
}: StaffDetailClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [editOpen, setEditOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);

  function handleToggleActive() {
    startTransition(async () => {
      const result = await toggleStaffActiveAction(staff.id);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(result.activo ? "Miembro activado" : "Miembro desactivado");
        router.refresh();
      }
    });
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${staff.nombre} ${staff.apellido}`}
        description={staff.email}
      >
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push("/equipo")}
          >
            <ArrowLeft className="size-4" />
            Volver
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setResetOpen(true)}
          >
            <KeyRound className="size-4" />
            Contraseña
          </Button>
          <Button
            variant={staff.activo ? "destructive" : "secondary"}
            size="sm"
            onClick={handleToggleActive}
            disabled={isPending}
          >
            {staff.activo ? "Desactivar" : "Activar"}
          </Button>
          <Button size="sm" onClick={() => setEditOpen(true)}>
            Editar
          </Button>
        </div>
      </PageHeader>

      {/* Info row */}
      <div className="flex flex-wrap items-center gap-3">
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
            roleBadgeClass[staff.role] ?? ""
          }`}
        >
          {roleLabel[staff.role] ?? staff.role}
        </span>
        <div className="flex items-center gap-1.5">
          <span
            className={`size-2 rounded-full ${
              staff.activo ? "bg-green-500" : "bg-gray-400"
            }`}
          />
          <span className="text-sm text-muted-foreground">
            {staff.activo ? "Activo" : "Inactivo"}
          </span>
        </div>
        {staff.telefono && (
          <span className="text-sm text-muted-foreground">{staff.telefono}</span>
        )}
      </div>

      {/* KPI cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <KPICard
          label="Servicios asignados"
          value={String(staff._count.servicios)}
          icon={<Briefcase className="size-5" />}
        />
        <KPICard
          label="Clientes asignados"
          value={String(staff._count.personasAsignadas)}
          icon={<Users className="size-5" />}
        />
        <KPICard
          label={`% Cobranza (${performance.periodo})`}
          value={formatPercent(performance.porcentajeCobranza)}
          icon={<TrendingUp className="size-5" />}
        />
      </div>

      {/* Performance period summary */}
      <div className="rounded-[1.25rem] bg-card p-5 shadow-[0_4px_16px_-4px_rgba(0,0,0,0.12),0_2px_8px_-2px_rgba(0,0,0,0.08)] ring-1 ring-foreground/10">
        <h2 className="mb-4 text-base font-semibold">
          Rendimiento — {performance.periodo}
        </h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <p className="text-sm text-muted-foreground">Honorarios</p>
            <p className="mt-1 font-mono text-lg font-semibold">
              {formatCurrency(performance.totalHonorarios)}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Cobrado</p>
            <p className="mt-1 font-mono text-lg font-semibold text-green-600 dark:text-green-400">
              {formatCurrency(performance.totalCobrado)}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Servicios del período</p>
            <p className="mt-1 font-mono text-lg font-semibold">
              {performance.totalServicios}
            </p>
          </div>
        </div>
      </div>

      {/* Recent servicios */}
      <div className="rounded-[1.25rem] bg-card p-5 shadow-[0_4px_16px_-4px_rgba(0,0,0,0.12),0_2px_8px_-2px_rgba(0,0,0,0.08)] ring-1 ring-foreground/10">
        <h2 className="mb-4 text-base font-semibold">Servicios recientes</h2>
        {recentServicios.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sin servicios registrados.</p>
        ) : (
          <div className="divide-y divide-border/60">
            {recentServicios.map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium text-sm">
                    {s.persona.razonSocial}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {s.tipoServicio.nombre}
                    {s.periodo ? ` · ${s.periodo}` : ""}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <span className="font-mono text-sm">
                    {formatCurrency(s.honorarios)}
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      s.estadoCobranza === "COBRADO"
                        ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300"
                        : s.estadoCobranza === "PARCIAL"
                        ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"
                        : s.estadoCobranza === "INCOBRABLE"
                        ? "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {estadoCobranzaLabel[s.estadoCobranza] ?? s.estadoCobranza}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

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
        onOpenChange={(open) => {
          setEditOpen(open);
          if (!open) router.refresh();
        }}
      />

      <ResetPasswordDialog
        userId={staff.id}
        open={resetOpen}
        onOpenChange={setResetOpen}
      />
    </div>
  );
}
