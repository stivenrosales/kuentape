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
import {
  getCajaChicaMovimientos,
  getCajaChicaSaldo,
  getCajaChicaBalanceDiario,
} from "@/features/caja-chica/queries";
import { getCobranzasPorContador } from "@/features/cobranzas/queries";
import { FinanzasOverview } from "@/features/finanzas/components/finanzas-overview";

type Tab = "transacciones" | "cobranzas" | "caja-chica" | "analisis";

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

  const rawTab = sp.tab ?? "transacciones";
  const tab: Tab =
    rawTab === "analisis" || rawTab === "caja-chica" || rawTab === "cobranzas" ? rawTab : "transacciones";

  /* ------------------------------------------------------------------ */
  /* Datos siempre necesarios (overview + KPI bar)                       */
  /* ------------------------------------------------------------------ */
  const [kpis, cobradoPorCuenta, cuentas, servicios] = await Promise.all([
    getFinanzaKPIs(anio, mes),
    getIngresosPorCuenta(now),
    getCuentasBancarias(),
    getServiciosConDeuda(),
  ]);

  /* ------------------------------------------------------------------ */
  /* Datos diferidos según tab                                           */
  /* ------------------------------------------------------------------ */
  // Transacciones siempre cargadas (necesarias para PDF + tab transacciones)
  const { items: todasTransacciones } = await getFinanzas({ page: 1, pageSize: 200 });

  let _unused = undefined as undefined; // placeholder

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

  let cajaChicaData = undefined as
    | { saldo: number; balanceDiario: Awaited<ReturnType<typeof getCajaChicaBalanceDiario>>; movimientos: Awaited<ReturnType<typeof getCajaChicaMovimientos>> }
    | undefined;

  let cobranzasData = undefined as
    | Awaited<ReturnType<typeof getCobranzasPorContador>>
    | undefined;

  if (tab === "cobranzas") {
    cobranzasData = await getCobranzasPorContador(anio, mes);
  }

  if (tab === "caja-chica") {
    const [saldo, balanceDiario, movimientos] = await Promise.all([
      getCajaChicaSaldo(),
      getCajaChicaBalanceDiario(anio, mes),
      getCajaChicaMovimientos({ anio, mes }),
    ]);
    cajaChicaData = { saldo, balanceDiario, movimientos };
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
      getFinanzasMensuales(anio, mes),
      getIngresosPorTipoServicio(anio, mes),
      getVentasPorContador(anio, mes),
      getVentasPorServicio(anio, mes),
      getMontoPorCobrarPorContador(),
      getEgresosPorCategoria(anio, mes),
    ]);

    analisisData = {
      finanzasMensuales,
      ingresosPorTipoServicio,
      ventasPorContador,
      ventasPorServicio,
      montoPorCobrarPorContador,
      egresosPorCategoria,
    };
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Finanzas" />

      <FinanzasOverview
        kpis={kpis}
        cobradoPorCuenta={cobradoPorCuenta}
        ultimasTransacciones={[]}
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
        cajaChicaSaldo={cajaChicaData?.saldo}
        cajaChicaBalanceDiario={cajaChicaData?.balanceDiario}
        cajaChicaMovimientos={cajaChicaData?.movimientos as any}
        cobranzasData={cobranzasData}
      />
    </div>
  );
}
