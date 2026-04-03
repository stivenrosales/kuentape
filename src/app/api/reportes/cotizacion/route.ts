import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { createElement } from "react";
import { authorizeAction } from "@/lib/auth-guard";
import { getLeadCotizacionData } from "@/features/leads/queries";
import {
  CotizacionReportDocument,
  type CotizacionReportData,
} from "@/features/reportes/templates/cotizacion-report";

export async function POST(req: NextRequest) {
  try {
    await authorizeAction(["GERENCIA", "ADMINISTRADOR", "VENTAS"]);
  } catch {
    return new NextResponse("No autorizado", { status: 401 });
  }

  let body: { leadId: string };
  try {
    body = await req.json();
  } catch {
    return new NextResponse("Body inválido", { status: 400 });
  }

  const { leadId } = body;

  if (!leadId) {
    return new NextResponse("Parámetro requerido: leadId", { status: 400 });
  }

  const lead = await getLeadCotizacionData(leadId);

  if (!lead) {
    return new NextResponse("Prospecto no encontrado", { status: 404 });
  }

  const data: CotizacionReportData = {
    nombre: lead.nombre,
    apellido: lead.apellido,
    celular: lead.celular,
    email: lead.email,
    regimen: lead.regimen,
    rubro: lead.rubro,
    numTrabajadores: lead.numTrabajadores,
    planillaPrecioCalculado: lead.planillaPrecioCalculado,
    fechaEmision: new Date().toLocaleDateString("es-PE", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      timeZone: "America/Lima",
    }),
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const buffer = await renderToBuffer(createElement(CotizacionReportDocument, { data }) as any);

  const fullName = `${lead.nombre} ${lead.apellido}`;
  const filename = `Cotizacion - ${fullName}.pdf`;

  return new NextResponse(Buffer.from(buffer) as unknown as BodyInit, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${encodeURIComponent(filename)}"`,
    },
  });
}
