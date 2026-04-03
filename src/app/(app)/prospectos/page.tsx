import Link from "next/link";
import { LayoutList } from "lucide-react";

import { requireRole } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/layout/page-header";
import { getLeadsKanban, getLeadKanbanStats } from "@/features/leads/queries-kanban";
import { LeadsKanbanBoard } from "@/features/leads/components/leads-kanban-board";
import { NuevoLeadDialog } from "@/features/leads/components/nuevo-lead-dialog";

export default async function ProspectosPage() {
  await requireRole(["GERENCIA", "ADMINISTRADOR", "VENTAS"]);

  const [kanbanData, stats, staff] = await Promise.all([
    getLeadsKanban(),
    getLeadKanbanStats(),
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
        description="Pipeline de clientes potenciales"
      >
        <div className="flex items-center gap-2">
          <Link
            href="/prospectos/lista"
            className="inline-flex items-center gap-1.5 rounded-full border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            <LayoutList className="h-4 w-4" />
            Vista lista
          </Link>
          <NuevoLeadDialog staff={staff} />
        </div>
      </PageHeader>

      <LeadsKanbanBoard
        initialData={kanbanData}
        stats={stats}
        staff={staff}
      />
    </div>
  );
}
