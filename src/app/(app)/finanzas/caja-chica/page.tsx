import { requireRole } from "@/lib/auth-guard";
import { PageHeader } from "@/components/layout/page-header";
import {
  getCajaChicaMovimientos,
  getCajaChicaSaldo,
  getCajaChicaBalanceHistory,
} from "@/features/caja-chica/queries";
import { CajaChicaClient } from "@/features/caja-chica/components/caja-chica-client";

interface SearchParams {
  anio?: string;
  mes?: string;
}

export default async function CajaChicaPage({
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

  const [saldoActual, balanceHistory, movimientos] = await Promise.all([
    getCajaChicaSaldo(),
    getCajaChicaBalanceHistory(anio),
    getCajaChicaMovimientos({ anio, mes }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Caja Chica"
        description="El saldo muestra el acumulado actual. Registrá ingresos (reposiciones) y gastos para mantenerlo actualizado."
      />

      <CajaChicaClient
        saldoActual={saldoActual}
        balanceHistory={balanceHistory}
        movimientos={movimientos as any}
        canEdit={canEdit}
        anio={anio}
        mes={mes}
      />
    </div>
  );
}
