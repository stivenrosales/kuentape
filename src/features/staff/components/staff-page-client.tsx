"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/page-header";
import { StaffTable } from "./staff-table";
import { StaffForm } from "./staff-form";
import type { getStaffList } from "../queries";

type StaffList = Awaited<ReturnType<typeof getStaffList>>;

interface StaffPageClientProps {
  initialData: StaffList;
}

export function StaffPageClient({ initialData }: StaffPageClientProps) {
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <div className="space-y-6">
      <PageHeader title="Equipo" description="Gestión de miembros del equipo">
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="size-4" />
          Nuevo miembro
        </Button>
      </PageHeader>

      <StaffTable data={initialData} />

      <StaffForm mode="create" open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}
