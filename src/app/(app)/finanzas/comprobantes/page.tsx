import { requireRole } from "@/lib/auth-guard";
import { PageHeader } from "@/components/layout/page-header";
import { prisma } from "@/lib/prisma";
import { getCuentasBancarias } from "@/features/finanzas/queries";
import { ComprobanteGallery } from "@/features/finanzas/components/comprobante-gallery";

export default async function ComprobantesPage() {
  await requireRole(["GERENCIA", "ADMINISTRADOR"]);

  const [finanzas, cuentas] = await Promise.all([
    prisma.finanza.findMany({
      where: { comprobanteUrl: { not: null } },
      select: {
        id: true,
        comprobanteUrl: true,
        monto: true,
        fecha: true,
        concepto: true,
        tipo: true,
        cuenta: { select: { id: true, nombre: true } },
      },
      orderBy: { fecha: "desc" },
    }),
    getCuentasBancarias(),
  ]);

  const items = finanzas.map((f) => ({
    id: f.id,
    comprobanteUrl: f.comprobanteUrl!,
    monto: f.monto,
    fecha: f.fecha,
    concepto: f.concepto,
    tipo: f.tipo as "INGRESO" | "EGRESO",
    cuenta: f.cuenta,
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Comprobantes"
        description="Galería de comprobantes de pago adjuntos a transacciones"
      />

      <ComprobanteGallery items={items} cuentas={cuentas} />
    </div>
  );
}
