import Link from "next/link";
import { FileText, TrendingUp, CircleDollarSign, AlertCircle } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { requireAuth } from "@/lib/auth-guard";
import { formatCurrency, getPeriodoAnterior } from "@/lib/format";
import {
  getTiposServicio,
  getContadoresActivos,
  getCuentasBancarias,
  getPersonasActivas,
} from "@/features/servicios/queries";
import {
  getServiciosList,
  getServiciosListStats,
} from "@/features/servicios/queries-list";
import { ServicioListEnhanced } from "@/features/servicios/components/servicio-list-enhanced";
import { ServicioFiltersWithPdf } from "@/features/servicios/components/servicio-filters-with-pdf";
import { NuevoServicioDialog } from "@/features/servicios/components/nuevo-servicio-dialog";

interface SearchParams {
  periodo?: string;
  tipoServicioId?: string;
  contadorId?: string;
  search?: string;
}

export default async function ServiciosPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const session = await requireAuth();
  const role = (session.user as any).role as string;
  const canManage = role === "GERENCIA" || role === "ADMINISTRADOR";

  const sp = await searchParams;

  const periodoDefault = getPeriodoAnterior();
  const periodo = sp.periodo ?? periodoDefault;

  const listFilters = {
    periodo,
    tipoServicioId: sp.tipoServicioId,
    contadorId: sp.contadorId,
    search: sp.search,
  };

  const userId = (session.user as any).id as string;
  const isContador = role === "CONTADOR";

  const [servicios, stats, tiposServicio, cuentas, contadores, personas] =
    await Promise.all([
      getServiciosList(listFilters),
      getServiciosListStats(listFilters),
      getTiposServicio(),
      getCuentasBancarias(),
      getContadoresActivos(),
      getPersonasActivas(),
    ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Servicios"
        description={`${stats.totalCount} servicio(s)`}
      >
        <Link
          href="/servicios/archivados"
          className="inline-flex items-center gap-1.5 rounded-full border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors"
        >
          Archivados
        </Link>
        <NuevoServicioDialog
          tiposServicio={tiposServicio as any}
          personas={personas as any}
          contadores={contadores}
          currentUserId={userId}
          isContador={isContador}
        />
      </PageHeader>

      {/* KPI cards — compactas */}
      <div className="grid gap-2 grid-cols-2 lg:grid-cols-5">
        <div className="rounded-lg border border-border bg-card px-4 py-3 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Servicios</span>
            <FileText className="h-3 w-3 text-muted-foreground/50" />
          </div>
          <p className="text-lg font-bold mt-0.5">{stats.totalCount}</p>
        </div>
        <div className="rounded-lg border border-border bg-card px-4 py-3 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Honorarios</span>
            <TrendingUp className="h-3 w-3 text-muted-foreground/50" />
          </div>
          <p className="text-lg font-mono font-bold mt-0.5">{formatCurrency(stats.totalHonorarios)}</p>
        </div>
        <div className="rounded-lg border border-border bg-card px-4 py-3 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Cobrado</span>
            <CircleDollarSign className="h-3 w-3 text-muted-foreground/50" />
          </div>
          <p className="text-lg font-mono font-bold text-green-600 dark:text-green-400 mt-0.5">{formatCurrency(stats.totalCobrado)}</p>
        </div>
        <div className="rounded-lg border border-border bg-card px-4 py-3 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Restante</span>
            <AlertCircle className="h-3 w-3 text-muted-foreground/50" />
          </div>
          <p className="text-lg font-mono font-bold text-destructive mt-0.5">{formatCurrency(stats.totalRestante)}</p>
        </div>
        <div className="rounded-lg border border-border bg-card px-4 py-3 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Avance</span>
            <TrendingUp className="h-3 w-3 text-muted-foreground/50" />
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <p className="text-lg font-bold">{stats.avancePorcentaje}%</p>
            <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
              <div className="h-full rounded-full bg-primary" style={{ width: `${stats.avancePorcentaje}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* Filtros + PDF */}
      <ServicioFiltersWithPdf
        tiposServicio={tiposServicio}
        contadores={canManage ? contadores : undefined}
        isAdmin={canManage}
        periodoDefault={periodoDefault}
        servicios={servicios as any}
        periodoLabel={periodo}
      />

      {/* Lista principal */}
      <ServicioListEnhanced
        servicios={servicios}
        stats={stats}
        cuentas={cuentas}
      />
    </div>
  );
}
