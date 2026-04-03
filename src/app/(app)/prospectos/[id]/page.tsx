import { notFound } from "next/navigation";
import Link from "next/link";
import { Mail, Phone, IdCard, Users, ArrowRight, Pencil } from "lucide-react";

import { requireRole } from "@/lib/auth-guard";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { prisma } from "@/lib/prisma";
import { getLeadDetail, getLeadCotizacionData } from "@/features/leads/queries";
import { EstadoBadge } from "@/features/leads/components/lead-pipeline";
import { LeadCotizacion } from "@/features/leads/components/lead-cotizacion";
import { LeadEstadoSelector } from "@/features/leads/components/lead-estado-selector";
import { LeadConversionDialogTrigger } from "@/features/leads/components/lead-conversion-dialog-trigger";
import { formatDate } from "@/lib/format";

const REGIMEN_LABEL: Record<string, string> = {
  MYPE: "MYPE",
  RER: "RER",
  REG: "Régimen General",
};

export default async function ProspectoDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireRole(["GERENCIA", "ADMINISTRADOR", "VENTAS"]);
  const { id } = await params;

  const [lead, cotizacionData] = await Promise.all([
    getLeadDetail(id),
    getLeadCotizacionData(id),
  ]);

  if (!lead || !cotizacionData) notFound();

  const staff = await prisma.user.findMany({
    where: { activo: true },
    select: { id: true, nombre: true, apellido: true },
    orderBy: { nombre: "asc" },
  });

  const canConvert =
    lead.estado === "COTIZADO" &&
    lead.estado !== "CONVERTIDO" &&
    ["GERENCIA", "ADMINISTRADOR"].includes((session.user as any).role);

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${lead.nombre} ${lead.apellido}`}
        description={`Prospecto · Creado ${formatDate(lead.createdAt)}`}
      >
        <EstadoBadge estado={lead.estado} />
        <Button variant="outline" render={<Link href={`/prospectos/${id}/editar`} />}>
          <Pencil className="h-4 w-4" />
          Editar
        </Button>
        {canConvert && (
          <LeadConversionDialogTrigger
            lead={{
              id: lead.id,
              nombre: lead.nombre,
              apellido: lead.apellido,
              dni: lead.dni,
              celular: lead.celular,
              email: lead.email,
              regimen: lead.regimen,
              numTrabajadores: lead.numTrabajadores,
            }}
            staff={staff}
          />
        )}
      </PageHeader>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left: info cards */}
        <div className="space-y-4 lg:col-span-2">
          {/* Contacto */}
          <div className="rounded-xl border bg-card p-5 space-y-3">
            <h2 className="text-sm font-semibold text-foreground">
              Información de contacto
            </h2>
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <span>{lead.celular}</span>
              </div>
              {lead.email && (
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <span>{lead.email}</span>
                </div>
              )}
              {lead.dni && (
                <div className="flex items-center gap-2 text-sm">
                  <IdCard className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <span>DNI: {lead.dni}</span>
                </div>
              )}
            </div>
          </div>

          {/* Negocio */}
          <div className="rounded-xl border bg-card p-5 space-y-3">
            <h2 className="text-sm font-semibold text-foreground">
              Información del negocio
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {lead.regimen && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Régimen</p>
                  <Badge variant="outline">
                    {REGIMEN_LABEL[lead.regimen] ?? lead.regimen}
                  </Badge>
                </div>
              )}
              {lead.rubro && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Rubro</p>
                  <p className="text-sm font-medium">{lead.rubro}</p>
                </div>
              )}
              {lead.numTrabajadores != null && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">
                    N° trabajadores
                  </p>
                  <div className="flex items-center gap-1.5 text-sm">
                    <Users className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="font-medium">{lead.numTrabajadores}</span>
                  </div>
                </div>
              )}
              {lead.asignadoA && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Asignado a</p>
                  <p className="text-sm font-medium">
                    {lead.asignadoA.nombre} {lead.asignadoA.apellido}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Notas */}
          {lead.notas && (
            <div className="rounded-xl border bg-card p-5 space-y-2">
              <h2 className="text-sm font-semibold text-foreground">Notas</h2>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {lead.notas}
              </p>
            </div>
          )}

          {/* Convertido */}
          {lead.convertidoA && (
            <div className="rounded-xl border border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-950/20 p-5 space-y-3">
              <h2 className="text-sm font-semibold text-green-700 dark:text-green-400">
                Cliente vinculado
              </h2>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">
                    {lead.convertidoA.razonSocial}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    RUC: {lead.convertidoA.ruc}
                  </p>
                </div>
                <Button variant="outline" size="sm" render={<Link href={`/clientes/${lead.convertidoA.id}`} />}>
                  Ver cliente
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Right: estado + cotizacion */}
        <div className="space-y-4">
          <LeadEstadoSelector leadId={id} currentEstado={lead.estado} />
          <LeadCotizacion
            nombre={cotizacionData.nombre}
            apellido={cotizacionData.apellido}
            celular={cotizacionData.celular}
            email={cotizacionData.email}
            regimen={cotizacionData.regimen}
            rubro={cotizacionData.rubro}
            numTrabajadores={cotizacionData.numTrabajadores}
            planillaPrecioCalculado={cotizacionData.planillaPrecioCalculado}
          />
        </div>
      </div>
    </div>
  );
}
