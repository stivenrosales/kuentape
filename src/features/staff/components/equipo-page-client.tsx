"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { EquipoTable } from "./equipo-table";
import { StaffDetailDialog } from "./staff-detail-dialog";
import { NuevoStaffDialog } from "./nuevo-staff-dialog";
import type { getStaffList } from "../queries";

type StaffMember = Awaited<ReturnType<typeof getStaffList>>[number];

interface EquipoPageClientProps {
  initialData: StaffMember[];
}

export function EquipoPageClient({ initialData }: EquipoPageClientProps) {
  const [selectedMember, setSelectedMember] = useState<StaffMember | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <div className="space-y-6">
      <PageHeader title="Equipo" description="Gestión de miembros del equipo">
        <button
          onClick={() => setCreateOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-full bg-primary px-5 py-2 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Nuevo miembro
        </button>
      </PageHeader>

      <EquipoTable
        data={initialData}
        onRowClick={(member) => setSelectedMember(member)}
      />

      <StaffDetailDialog
        member={selectedMember}
        onClose={() => setSelectedMember(null)}
      />

      <NuevoStaffDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}
