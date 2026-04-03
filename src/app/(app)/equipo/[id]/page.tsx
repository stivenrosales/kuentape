import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth-guard";
import {
  getStaffDetail,
  getStaffPerformance,
  getStaffRecentServicios,
} from "@/features/staff/queries";
import { StaffDetailClient } from "@/features/staff/components/staff-detail-client";

interface StaffDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function StaffDetailPage({ params }: StaffDetailPageProps) {
  await requireRole(["GERENCIA"]);

  const { id } = await params;

  const staff = await getStaffDetail(id);
  if (!staff) notFound();

  const now = new Date();
  const performance = await getStaffPerformance(
    id,
    now.getFullYear(),
    now.getMonth() + 1
  );
  const recentServicios = await getStaffRecentServicios(id);

  return (
    <StaffDetailClient
      staff={staff}
      performance={performance}
      recentServicios={recentServicios}
    />
  );
}
