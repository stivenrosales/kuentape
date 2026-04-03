import { requireRole } from "@/lib/auth-guard";
import { PageHeader } from "@/components/layout/page-header";
import { getContadoresParaReporte } from "@/features/reportes/queries";
import { ReportesClient } from "@/features/reportes/components/reportes-client";

export default async function ReportesPage() {
  await requireRole(["GERENCIA", "ADMINISTRADOR"]);

  const contadores = await getContadoresParaReporte();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reportes"
        description="Generá PDFs de reportes mensuales por contador, caja chica y cotizaciones."
      />
      <ReportesClient contadores={contadores} />
    </div>
  );
}
