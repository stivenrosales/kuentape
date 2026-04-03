import Link from "next/link";
import { LayoutGrid } from "lucide-react";
import type { EstadoLead } from "@prisma/client";

import { requireRole } from "@/lib/auth-guard";
import { PageHeader } from "@/components/layout/page-header";
import { getLeads, getLeadPipelineCounts } from "@/features/leads/queries";
import { getContadoresActivos } from "@/features/servicios/queries";
import { LeadPipelineWrapper } from "@/features/leads/components/lead-pipeline-wrapper";
import { LeadTableSimple } from "@/features/leads/components/lead-table-simple";
import { NuevoLeadDialog } from "@/features/leads/components/nuevo-lead-dialog";

interface SearchParams {
  estado?: string;
  search?: string;
  asignadoAId?: string;
}

export default async function ProspectosListaPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const session = await requireRole(["GERENCIA", "ADMINISTRADOR", "VENTAS"]);
  const userId = (session.user as any).id as string;

  const params = await searchParams;

  const [leads, counts, staff] = await Promise.all([
    getLeads({
      estado: params.estado as EstadoLead | undefined,
      search: params.search,
      asignadoAId: params.asignadoAId,
    }),
    getLeadPipelineCounts(),
    getContadoresActivos(),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Prospectos — Lista"
        description="Todos los prospectos en vista tabla"
      >
        <Link
          href="/prospectos"
          className="inline-flex items-center gap-1.5 rounded-full border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors"
        >
          <LayoutGrid className="h-4 w-4" />
          Vista kanban
        </Link>
        <NuevoLeadDialog staff={staff} currentUserId={userId} />
      </PageHeader>

      <LeadPipelineWrapper
        counts={counts}
        activeEstado={params.estado as EstadoLead | undefined}
      />

      <LeadTableSimple data={leads as any} />
    </div>
  );
}
