import Link from "next/link";
import {
  Users,
  FileText,
  TrendingUp,
  AlertCircle,
  BookOpen,
  DollarSign,
  UserCheck,
  BadgePercent,
  ChevronRight,
} from "lucide-react";

import { auth } from "@/auth";
import { PageHeader } from "@/components/layout/page-header";
import { KPICard } from "@/components/kpi-card";
import { CobrosPendientes } from "@/features/dashboard/components/cobros-pendientes";
import {
  getTiposServicio,
  getContadoresActivos,
  getCuentasBancarias,
  getPersonasActivas,
} from "@/features/servicios/queries";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/format";
import {
  getDashboardGerencia,
  getDashboardContador,
  getDashboardVentas,
} from "@/features/dashboard/queries";
import { NuevoServicioDialog } from "@/features/servicios/components/nuevo-servicio-dialog";
import { NuevaIncidenciaDialog } from "@/features/incidencias/components/nueva-incidencia-dialog";
import { GenerarLibrosButton } from "@/features/libros/components/generar-libros-button";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const ESTADO_COBRANZA_LABEL: Record<string, string> = {
  PENDIENTE: "Pendiente",
  PARCIAL: "Parcial",
  COBRADO: "Cobrado",
  INCOBRABLE: "Incobrable",
};

const ESTADO_COBRANZA_VARIANT: Record<
  string,
  "default" | "secondary" | "destructive" | "outline"
> = {
  PENDIENTE: "destructive",
  PARCIAL: "secondary",
  COBRADO: "default",
  INCOBRABLE: "outline",
};

const ESTADO_LEAD_LABEL: Record<string, string> = {
  NUEVO: "Nuevo",
  CONTACTADO: "Contactado",
  COTIZADO: "Cotizado",
  CONVERTIDO: "Convertido",
  PERDIDO: "Perdido",
};

// ─── Dashboard Gerencia ───────────────────────────────────────────────────────

async function DashboardGerencia({
  nombre,
  userId,
  anio,
  mes,
}: {
  nombre: string;
  userId: string;
  anio: number;
  mes: number;
}) {
  const [data, tiposServicio, personas, contadores] = await Promise.all([
    getDashboardGerencia(anio, mes),
    getTiposServicio(),
    getPersonasActivas(),
    getContadoresActivos(),
  ]);

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      {/* ── Columna principal (2/3) ──────────────────────────────────── */}
      <div className="space-y-4 lg:col-span-2">

        {/* KPI bar compacta */}
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <div className="rounded-lg border border-border bg-card px-4 py-3 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Clientes</span>
              <Users className="h-3 w-3 text-muted-foreground/50" />
            </div>
            <p className="mt-0.5 text-lg font-bold">{data.totalClientesActivos}</p>
          </div>
          <div className="rounded-lg border border-border bg-card px-4 py-3 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Servicios</span>
              <FileText className="h-3 w-3 text-muted-foreground/50" />
            </div>
            <p className="mt-0.5 text-lg font-bold">{data.serviciosMes}</p>
          </div>
          <div className="rounded-lg border border-border bg-card px-4 py-3 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Ingresos</span>
              <TrendingUp className="h-3 w-3 text-muted-foreground/50" />
            </div>
            <p className="mt-0.5 text-lg font-mono font-bold text-green-600 dark:text-green-400">
              {formatCurrency(data.ingresosMes)}
            </p>
          </div>
          <div className="rounded-lg border border-border bg-card px-4 py-3 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Deuda total</span>
              <DollarSign className="h-3 w-3 text-muted-foreground/50" />
            </div>
            <p className="mt-0.5 text-lg font-mono font-bold text-destructive">
              {formatCurrency(data.deudaTotal)}
            </p>
          </div>
        </div>

        {/* Rendimiento por contador */}
        <div className="rounded-lg border border-border bg-card shadow-sm">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <h2 className="text-sm font-semibold">Rendimiento por contador</h2>
            <span className="text-xs text-muted-foreground">Este mes</span>
          </div>
          {data.cobranzasPorContador.length === 0 ? (
            <p className="py-6 text-center text-xs text-muted-foreground">Sin datos para este período</p>
          ) : (
            <div className="divide-y divide-border/50">
              <div className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-x-4 px-4 py-2">
                <span className="text-xs font-medium text-muted-foreground">Contador</span>
                <span className="text-xs font-medium text-muted-foreground text-right">Servicios</span>
                <span className="text-xs font-medium text-muted-foreground text-right">Honorarios</span>
                <span className="text-xs font-medium text-muted-foreground text-right">Cobrado</span>
                <span className="text-xs font-medium text-muted-foreground text-right">%</span>
              </div>
              {data.cobranzasPorContador.map((c) => (
                <Link
                  key={c.contadorId}
                  href={`/equipo/${c.contadorId}`}
                  className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-x-4 px-4 py-2.5 hover:bg-muted/40 transition-colors"
                >
                  <span className="truncate text-sm font-medium">{c.contador}</span>
                  <span className="text-xs text-muted-foreground text-right tabular-nums">—</span>
                  <span className="text-xs font-mono text-right tabular-nums">{formatCurrency(c.honorarios)}</span>
                  <span className="text-xs font-mono text-green-600 dark:text-green-400 text-right tabular-nums">{formatCurrency(c.cobrado)}</span>
                  <span
                    className={`text-xs font-semibold text-right tabular-nums ${
                      c.porcentaje >= 80
                        ? "text-green-600 dark:text-green-400"
                        : c.porcentaje >= 50
                        ? "text-amber-600"
                        : "text-destructive"
                    }`}
                  >
                    {c.porcentaje}%
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Últimas transacciones */}
        <div className="rounded-lg border border-border bg-card shadow-sm">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <h2 className="text-sm font-semibold">Últimas transacciones</h2>
            <Link href="/finanzas" className="text-xs text-muted-foreground hover:text-primary transition-colors">
              Ver finanzas
            </Link>
          </div>
          {data.ultimasTransacciones.length === 0 ? (
            <p className="py-6 text-center text-xs text-muted-foreground">Sin transacciones recientes</p>
          ) : (
            <div className="divide-y divide-border/50">
              {data.ultimasTransacciones.map((t) => (
                <Link
                  key={t.id}
                  href="/finanzas"
                  className="flex items-center gap-3 px-4 py-2.5 hover:bg-muted/40 transition-colors"
                >
                  <div
                    className={`flex size-7 shrink-0 items-center justify-center rounded-md ${
                      t.tipo === "INGRESO"
                        ? "bg-emerald-500/10 text-emerald-600"
                        : "bg-red-500/10 text-red-600"
                    }`}
                  >
                    {t.tipo === "INGRESO" ? (
                      <TrendingUp className="size-3.5" />
                    ) : (
                      <DollarSign className="size-3.5" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm">{t.concepto}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {t.servicio?.persona?.razonSocial ?? t.cuenta.nombre} · {formatDate(t.fecha)}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 text-sm font-mono font-semibold ${
                      t.tipo === "INGRESO" ? "text-emerald-600" : "text-red-600"
                    }`}
                  >
                    {t.tipo === "INGRESO" ? "+" : "-"}{formatCurrency(t.monto)}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Columna lateral (1/3) ────────────────────────────────────── */}
      <div className="space-y-4">

        {/* Estado del mes */}
        <div className="rounded-lg border border-border bg-card shadow-sm">
          <div className="px-4 py-3 border-b border-border">
            <h2 className="text-sm font-semibold">Estado del mes</h2>
          </div>
          <div className="divide-y divide-border/50">
            <Link href="/incidencias" className="flex items-center justify-between px-4 py-2.5 hover:bg-muted/40 transition-colors group">
              <div className="flex items-center gap-2.5">
                <AlertCircle className="h-4 w-4 text-destructive" />
                <span className="text-sm">Incidencias abiertas</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-semibold tabular-nums">{data.incidenciasAbiertas}</span>
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </Link>
            <Link href="/libros" className="flex items-center justify-between px-4 py-2.5 hover:bg-muted/40 transition-colors group">
              <div className="flex items-center gap-2.5">
                <BookOpen className="h-4 w-4 text-amber-600" />
                <span className="text-sm">Libros pendientes</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-semibold tabular-nums">{data.librosPendientesMes}</span>
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </Link>
            <div className="flex items-center justify-between px-4 py-2.5">
              <div className="flex items-center gap-2.5">
                <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
                <span className="text-sm">Cobranza general</span>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`text-sm font-semibold tabular-nums ${
                    data.porcentajeCobranzaGeneral >= 80
                      ? "text-green-600 dark:text-green-400"
                      : data.porcentajeCobranzaGeneral >= 50
                      ? "text-amber-600"
                      : "text-destructive"
                  }`}
                >
                  {data.porcentajeCobranzaGeneral}%
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Acciones rápidas */}
        <div className="rounded-lg border border-border bg-card shadow-sm">
          <div className="px-4 py-3 border-b border-border">
            <h2 className="text-sm font-semibold">Acciones rápidas</h2>
          </div>
          <div className="flex flex-col gap-2 p-4">
            <NuevoServicioDialog
              tiposServicio={tiposServicio as any}
              personas={personas as any}
              contadores={contadores}
              currentUserId={userId}
              isContador={false}
            />
            <NuevaIncidenciaDialog
              personas={personas as any}
              contadores={contadores}
              currentUserId={userId}
              isContador={false}
            />
            <GenerarLibrosButton />
            <Link
              href="/reportes"
              className="inline-flex items-center justify-center rounded-lg border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              Ver Reportes
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}

// ─── Dashboard Contador ───────────────────────────────────────────────────────

async function DashboardContador({
  nombre,
  userId,
  anio,
  mes,
}: {
  nombre: string;
  userId: string;
  anio: number;
  mes: number;
}) {
  const [data, cuentas] = await Promise.all([
    getDashboardContador(userId, anio, mes),
    getCuentasBancarias(),
  ]);

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard
          label="Mis clientes"
          value={String(data.misClientes)}
          icon={<Users className="size-4" />}
        />
        <KPICard
          label="Mis servicios del mes"
          value={String(data.misServiciosMes)}
          icon={<FileText className="size-4" />}
        />
        <KPICard
          label="Mi % de cobranza"
          value={`${data.porcentajeCobranza}%`}
          icon={<BadgePercent className="size-4" />}
        />
        <KPICard
          label="Mi monto pendiente"
          value={formatCurrency(data.montoPendiente)}
          icon={<DollarSign className="size-4" />}
        />
      </div>

      {/* Incidencias abiertas */}
      <div className="flex items-center gap-4 rounded-[1.25rem] bg-card p-5 shadow-[0_4px_16px_-4px_rgba(0,0,0,0.12)] ring-1 ring-foreground/10">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
          <AlertCircle className="size-5" />
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Mis incidencias abiertas</p>
          <p className="text-2xl font-semibold">{data.misIncidenciasAbiertas}</p>
        </div>
        <div className="ml-auto">
          <Link href="/incidencias" className="text-xs text-muted-foreground hover:text-primary transition-colors">
            Ver todas
          </Link>
        </div>
      </div>

      {/* Servicios con cobro pendiente */}
      <div className="rounded-lg border border-border bg-card shadow-sm p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold">Mis cobros pendientes</h2>
          <Link href="/servicios" className="text-xs text-muted-foreground hover:text-primary transition-colors">
            Ver todos
          </Link>
        </div>
        <CobrosPendientes servicios={data.misServiciosPendientes as any} cuentas={cuentas as any} />
      </div>
    </div>
  );
}

// ─── Dashboard Ventas ─────────────────────────────────────────────────────────

async function DashboardVentas({
  nombre,
  userId,
}: {
  nombre: string;
  userId: string;
}) {
  const data = await getDashboardVentas(userId);

  const pipeline = [
    { estado: "NUEVO", label: "Nuevos", color: "bg-blue-500/10 text-blue-600" },
    { estado: "CONTACTADO", label: "Contactados", color: "bg-amber-500/10 text-amber-600" },
    { estado: "COTIZADO", label: "Cotizados", color: "bg-purple-500/10 text-purple-600" },
  ];

  return (
    <div className="space-y-6">
      {/* Pipeline KPIs */}
      <div className="grid gap-4 sm:grid-cols-3">
        {pipeline.map((p) => (
          <div
            key={p.estado}
            className="flex flex-col gap-2 rounded-[1.25rem] bg-card p-5 shadow-[0_4px_16px_-4px_rgba(0,0,0,0.12)] ring-1 ring-foreground/10"
          >
            <p className="text-sm text-muted-foreground">{p.label}</p>
            <p className="text-3xl font-semibold">
              {data.pipeline[p.estado as keyof typeof data.pipeline]}
            </p>
            <Link href={`/prospectos?estado=${p.estado}`} className="w-fit -ml-2 text-xs text-muted-foreground hover:text-primary transition-colors">
              Ver leads →
            </Link>
          </div>
        ))}
      </div>

      {/* Leads recientes */}
      <div className="rounded-[1.25rem] bg-card p-5 shadow-[0_4px_16px_-4px_rgba(0,0,0,0.12)] ring-1 ring-foreground/10">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold">Mis leads recientes</h2>
          <Link href="/prospectos" className="text-xs text-muted-foreground hover:text-primary transition-colors">
            Ver todos
          </Link>
        </div>

        {data.misLeadsRecientes.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            Sin leads asignados
          </p>
        ) : (
          <div className="divide-y divide-border/50">
            {data.misLeadsRecientes.map((lead) => (
              <Link
                key={lead.id}
                href={`/prospectos/${lead.id}`}
                className="flex items-center gap-3 py-3 hover:bg-muted/40 -mx-2 px-2 rounded-lg transition-colors"
              >
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <UserCheck className="size-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {lead.nombre} {lead.apellido}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(lead.createdAt)}
                    {lead.regimen ? ` · ${lead.regimen}` : ""}
                  </p>
                </div>
                <Badge variant="outline">
                  {ESTADO_LEAD_LABEL[lead.estado] ?? lead.estado}
                </Badge>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Quick action */}
      <div className="rounded-[1.25rem] bg-card p-5 shadow-[0_4px_16px_-4px_rgba(0,0,0,0.12)] ring-1 ring-foreground/10">
        <h2 className="mb-4 text-base font-semibold">Acciones rápidas</h2>
        <div className="flex flex-wrap gap-2">
          <Link href="/prospectos/nuevo" className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors">
            Nuevo prospecto
          </Link>
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function DashboardPage() {
  const session = await auth();
  const nombre = session?.user?.name?.split(" ")[0] ?? "Usuario";
  const role = (session?.user as { role?: string })?.role ?? "CONTADOR";
  const userId = (session?.user as { id?: string })?.id ?? "";

  const now = new Date();
  const anio = now.getFullYear();
  const mes = now.getMonth() + 1;

  const roleLabel: Record<string, string> = {
    GERENCIA: "Gerencia",
    ADMINISTRADOR: "Administración",
    CONTADOR: "Contador",
    VENTAS: "Ventas",
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Bienvenido, ${nombre}`}
        description={`Panel de ${roleLabel[role] ?? role} · ${new Date(anio, mes - 1).toLocaleDateString("es-PE", { month: "long", year: "numeric" })}`}
      />

      {(role === "GERENCIA" || role === "ADMINISTRADOR") && (
        <DashboardGerencia nombre={nombre} userId={userId} anio={anio} mes={mes} />
      )}

      {role === "CONTADOR" && (
        <DashboardContador
          nombre={nombre}
          userId={userId}
          anio={anio}
          mes={mes}
        />
      )}

      {role === "VENTAS" && (
        <DashboardVentas nombre={nombre} userId={userId} />
      )}
    </div>
  );
}
