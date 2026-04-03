import { requireRole } from "@/lib/auth-guard";
import { PageHeader } from "@/components/layout/page-header";
import { getAllCuentasBancarias } from "@/features/finanzas/queries";
import { CuentasBancariasClient } from "@/features/configuracion/cuentas-bancarias/cuentas-bancarias-client";

export default async function CuentasBancariasPage() {
  await requireRole(["GERENCIA"]);

  const cuentas = await getAllCuentasBancarias();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Cuentas Bancarias"
        description="Administrá las cuentas disponibles para registrar transacciones"
      />

      <CuentasBancariasClient data={cuentas as any} />
    </div>
  );
}
