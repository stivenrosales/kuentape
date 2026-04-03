import { requireRole } from "@/lib/auth-guard";
import { PageHeader } from "@/components/layout/page-header";
import {
  getFinanzas,
  getEgresosPorCategoria,
  getEgresosPorCategoriaAnual,
  getCuentasBancarias,
  getServiciosConDeuda,
} from "@/features/finanzas/queries";
import { EgresosClient } from "@/features/finanzas/components/egresos-client";

interface SearchParams {
  anio?: string;
  mes?: string;
}

export default async function EgresosPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const session = await requireRole(["GERENCIA", "ADMINISTRADOR"]);
  const role = (session.user as { role: string }).role;
  const canEdit = role === "GERENCIA" || role === "ADMINISTRADOR";

  const sp = await searchParams;
  const now = new Date();
  const anio = sp.anio ? Number(sp.anio) : now.getFullYear();
  const mes = sp.mes ? Number(sp.mes) : now.getMonth() + 1;

  const fechaInicio = new Date(anio, mes - 1, 1);
  const fechaFin = new Date(anio, mes, 0, 23, 59, 59, 999);

  const [
    egresosPorCategoria,
    egresosPorCategoriaAnual,
    cuentas,
    servicios,
    { items: transacciones },
  ] = await Promise.all([
    getEgresosPorCategoria(anio, mes),
    getEgresosPorCategoriaAnual(anio),
    getCuentasBancarias(),
    getServiciosConDeuda(),
    getFinanzas({ tipo: "EGRESO", fechaDesde: fechaInicio, fechaHasta: fechaFin, pageSize: 100 }),
  ]);

  const totalEgresos = transacciones.reduce((acc, t) => acc + t.monto, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Egresos"
        description="Control de gastos operativos del estudio"
      />

      <EgresosClient
        totalEgresos={totalEgresos}
        egresosPorCategoriaAnual={egresosPorCategoriaAnual}
        egresosPorCategoria={egresosPorCategoria}
        transacciones={transacciones as any}
        cuentas={cuentas}
        servicios={servicios}
        canEdit={canEdit}
        anio={anio}
        mes={mes}
      />
    </div>
  );
}
