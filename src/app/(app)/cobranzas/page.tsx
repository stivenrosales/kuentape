import { requireAuth } from "@/lib/auth-guard";
import { PageHeader } from "@/components/layout/page-header";
import {
  getCobranzasPorContador,
  getCobranzasDiarias,
  getMontosPorCobrarMes,
  getDeudaDelMes,
  getMontoRestantePorContador,
} from "@/features/cobranzas/queries";
import { getTiposServicio } from "@/features/servicios/queries";
import { CobranzasClient } from "@/features/cobranzas/components/cobranzas-client";
import type { TipoPersona } from "@prisma/client";

interface SearchParams {
  anio?: string;
  mes?: string;
  tipoServicioId?: string;
  tipoPersona?: string;
  filterMes?: string;
}

export default async function CobranzasPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const session = await requireAuth();
  const role = (session.user as { role: string }).role;
  const userId = (session.user as { id: string }).id;

  const sp = await searchParams;
  const now = new Date();
  const anio = sp.anio ? Number(sp.anio) : now.getFullYear();
  const mes = sp.mes ? Number(sp.mes) : now.getMonth() + 1;

  // For CONTADOR role: only show their own data
  const contadorFilter =
    role === "CONTADOR" ? userId : undefined;

  const filterMes = sp.filterMes ? Number(sp.filterMes) : undefined;

  const [
    cobranzasPorContador,
    cobranzasDiarias,
    montosPorCobrar,
    deudaMes,
    montoRestante,
    tiposServicio,
  ] = await Promise.all([
    getCobranzasPorContador(anio, mes, contadorFilter),
    getCobranzasDiarias(anio, mes, contadorFilter),
    getMontosPorCobrarMes(anio, mes, contadorFilter),
    getDeudaDelMes(anio, mes, contadorFilter),
    getMontoRestantePorContador({
      tipoServicioId: sp.tipoServicioId,
      tipoPersona: sp.tipoPersona as TipoPersona | undefined,
      mes: filterMes,
      anio: filterMes ? anio : undefined,
      contadorId: contadorFilter,
    }),
    getTiposServicio(),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Cobranzas"
        description="Seguimiento de cobros por contador y período"
      />

      <CobranzasClient
        cobranzasPorContador={cobranzasPorContador}
        cobranzasDiarias={cobranzasDiarias}
        montosPorCobrar={montosPorCobrar}
        deudaMes={deudaMes}
        montoRestante={montoRestante}
        tiposServicio={tiposServicio}
        anio={anio}
        mes={mes}
      />
    </div>
  );
}
