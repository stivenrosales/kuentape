import { requireRole } from "@/lib/auth-guard";
import { getStaffList } from "@/features/staff/queries";
import { EquipoPageClient } from "@/features/staff/components/equipo-page-client";

export default async function EquipoPage() {
  await requireRole(["GERENCIA"]);

  const staff = await getStaffList();

  return <EquipoPageClient initialData={staff} />;
}
