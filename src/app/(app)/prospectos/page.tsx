import Link from "next/link";
import { Kanban, Users, TrendingUp, CheckCircle2, Target } from "lucide-react";
import type { EstadoLead } from "@prisma/client";

import { requireRole } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/layout/page-header";
import { getLeads, getLeadStats } from "@/features/leads/queries";
import { LeadTableSimple } from "@/features/leads/components/lead-table-simple";
import { LeadFilters } from "@/features/leads/components/lead-filters";
import { NuevoLeadDialog } from "@/features/leads/components/nuevo-lead-dialog";

interface SearchParams {
  estado?: string;
  regimen?: string;
  search?: string;
  asignadoAId?: string;
}

export default async function ProspectosPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const session = await requireRole(["GERENCIA", "ADMINISTRADOR", "VENTAS"]);
  const role = (session.user as { role: string }).role;
  const isAdmin = role === "GERENCIA" || role === "ADMINISTRADOR";

  const params = await searchParams;

  const [leads, stats, staff] = await Promise.all([
    getLeads({
      estado: params.estado as EstadoLead | undefined,
      regimen: params.regimen,
      search: params.search,
      asignadoAId: params.asignadoAId,
    }),
    getLeadStats(),
    prisma.user.findMany({
      where: { activo: true },
      select: { id: true, nombre: true, apellido: true },
      orderBy: { nombre: "asc" },
    }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Prospectos"
        description={`${leads.length} prospecto(s) encontrado(s)`}
      >
        <Link
          href="/prospectos/kanban"
          className="inline-flex items-center gap-1.5 rounded-full border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors"
        >
          <Kanban className="h-4 w-4" />
          Vista Kanban
        </Link>
        <NuevoLeadDialog staff={staff} />
      </PageHeader>

      {/* KPI cards */}
      <div className="grid gap-2 grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border border-border bg-card px-4 py-3 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Total</span>
            <Users className="h-3 w-3 text-muted-foreground/50" />
          </div>
          <p className="text-lg font-bold mt-0.5">{stats.total}</p>
        </div>
        <div className="rounded-lg border border-border bg-card px-4 py-3 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">En pipeline</span>
            <TrendingUp className="h-3 w-3 text-muted-foreground/50" />
          </div>
          <p className="text-lg font-bold mt-0.5">{stats.pipeline}</p>
        </div>
        <div className="rounded-lg border border-border bg-card px-4 py-3 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Convertidos</span>
            <CheckCircle2 className="h-3 w-3 text-muted-foreground/50" />
          </div>
          <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">{stats.convertidos}</p>
        </div>
        <div className="rounded-lg border border-border bg-card px-4 py-3 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Tasa conversión</span>
            <Target className="h-3 w-3 text-muted-foreground/50" />
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <p className="text-lg font-bold">{stats.conversionRate}%</p>
            <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
              <div className="h-full rounded-full bg-primary" style={{ width: `${stats.conversionRate}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <LeadFilters staff={staff} isAdmin={isAdmin} />

      {/* Tabla */}
      <LeadTableSimple data={leads as any} staff={staff} />
    </div>
  );
}
