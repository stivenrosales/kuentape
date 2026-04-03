import { requireRole } from "@/lib/auth-guard";
import { PageHeader } from "@/components/layout/page-header";
import {
  getFinanzas,
  getFinanzaKPIs,
  getIngresosPorCuenta,
  getFinanzasMensuales,
  getIngresosPorTipoServicio,
  getVentasPorContador,
  getVentasPorServicio,
  getMontoPorCobrarPorContador,
  getEgresosPorCategoria,
  getCuentasBancarias,
  getServiciosConDeuda,
} from "@/features/finanzas/queries";
import { FinanzasOverview } from "@/features/finanzas/components/finanzas-overview";

type Tab = "overview" | "transacciones" | "analisis";

interface SearchParams {
  anio?: string;
  mes?: string;
  tab?: string;
}

export default async function FinanzasPage({
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

  const rawTab = sp.tab ?? "overview";
  const tab: Tab =
    rawTab === "transacciones" || rawTab === "analisis" ? rawTab : "overview";

  /* ------------------------------------------------------------------ */
  /* Datos siempre necesarios (overview + KPI bar)                       */
  /* ------------------------------------------------------------------ */
  const [kpis, cobradoPorCuenta, cuentas, servicios] = await Promise.all([
    getFinanzaKPIs(anio, mes),
    getIngresosPorCuenta(now),
    getCuentasBancarias(),
    getServiciosConDeuda(),
  ]);

  /* Últimas 10 transacciones — siempre visibles en overview */
  const { items: ultimasTransacciones } = await getFinanzas({
    page: 1,
    pageSize: 10,
  });

  /* ------------------------------------------------------------------ */
  /* Datos diferidos según tab                                           */
  /* ------------------------------------------------------------------ */
  let todasTransacciones = undefined as
    | Awaited<ReturnType<typeof getFinanzas>>["items"]
    | undefined;

  let analisisData = undefined as
    | {
        finanzasMensuales: Awaited<ReturnType<typeof getFinanzasMensuales>>;
        ingresosPorTipoServicio: Awaited<ReturnType<typeof getIngresosPorTipoServicio>>;
        ventasPorContador: Awaited<ReturnType<typeof getVentasPorContador>>;
        ventasPorServicio: Awaited<ReturnType<typeof getVentasPorServicio>>;
        montoPorCobrarPorContador: Awaited<ReturnType<typeof getMontoPorCobrarPorContador>>;
        egresosPorCategoria: Awaited<ReturnType<typeof getEgresosPorCategoria>>;
      }
    | undefined;

  if (tab === "transacciones") {
    const result = await getFinanzas({ page: 1, pageSize: 200 });
    todasTransacciones = result.items;
  }

  if (tab === "analisis") {
    const [
      finanzasMensuales,
      ingresosPorTipoServicio,
      ventasPorContador,
      ventasPorServicio,
      montoPorCobrarPorContador,
      egresosPorCategoria,
    ] = await Promise.all([
      getFinanzasMensuales(anio),
      getIngresosPorTipoServicio(anio),
      getVentasPorContador(anio),
      getVentasPorServicio(anio),
      getMontoPorCobrarPorContador(),
      getEgresosPorCategoria(anio, mes),
    ]);

    analisisData = {
      finanzasMensuales,
      ingresosPorTipoServicio,
      ventasPorContador: ventasPorContador as any,
      ventasPorServicio: ventasPorServicio as any,
      montoPorCobrarPorContador,
      egresosPorCategoria,
    };
  }

  /* ------------------------------------------------------------------ */
  /* Descripción del período                                             */
  /* ------------------------------------------------------------------ */
  const periodoLabel = new Date(anio, mes - 1).toLocaleDateString("es-PE", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="space-y-4">
      <PageHeader
        title="Finanzas"
        description={`Período: ${periodoLabel}`}
      />

      <FinanzasOverview
        kpis={kpis}
        cobradoPorCuenta={cobradoPorCuenta}
        ultimasTransacciones={ultimasTransacciones as any}
        finanzasMensuales={analisisData?.finanzasMensuales}
        ingresosPorTipoServicio={analisisData?.ingresosPorTipoServicio}
        ventasPorContador={analisisData?.ventasPorContador}
        ventasPorServicio={analisisData?.ventasPorServicio}
        montoPorCobrarPorContador={analisisData?.montoPorCobrarPorContador}
        egresosPorCategoria={analisisData?.egresosPorCategoria}
        todasTransacciones={todasTransacciones as any}
        cuentas={cuentas}
        servicios={servicios}
        canEdit={canEdit}
        anio={anio}
        mes={mes}
        tab={tab}
      />
    </div>
  );
}
