import Link from "next/link";
import { List } from "lucide-react";

import { requireRole } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/layout/page-header";
import { getLeadsKanban, getLeadKanbanStats } from "@/features/leads/queries-kanban";
import { LeadsKanbanBoard } from "@/features/leads/components/leads-kanban-board";
import { NuevoLeadDialog } from "@/features/leads/components/nuevo-lead-dialog";

export default async function ProspectosKanbanPage() {
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
        description="Pipeline visual de clientes potenciales"
      >
        <Link
          href="/prospectos"
          className="inline-flex items-center gap-1.5 rounded-full border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors"
        >
          <List className="h-4 w-4" />
          Vista lista
        </Link>
        <NuevoLeadDialog staff={staff} />
      </PageHeader>

      <LeadsKanbanBoard initialData={kanbanData} stats={stats} staff={staff} />
    </div>
  );
}
