import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { createElement } from "react";
import { authorizeAction } from "@/lib/auth-guard";
import { getCajaChicaReportData } from "@/features/reportes/queries";
import { CajaChicaReportDocument } from "@/features/reportes/templates/caja-chica-report";

export async function POST(req: NextRequest) {
  try {
    await authorizeAction(["GERENCIA", "ADMINISTRADOR"]);
  } catch {
    return new NextResponse("No autorizado", { status: 401 });
  }

  let body: { anio: number; mes: number };
  try {
    body = await req.json();
  } catch {
    return new NextResponse("Body inválido", { status: 400 });
  }

  const { anio, mes } = body;

  if (!anio || !mes) {
    return new NextResponse("Parámetros requeridos: anio, mes", {
      status: 400,
    });
  }

  const data = await getCajaChicaReportData(anio, mes);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const buffer = await renderToBuffer(createElement(CajaChicaReportDocument, { data }) as any);

  const filename = `Caja Chica (${data.mes} - ${anio}).pdf`;

  return new NextResponse(Buffer.from(buffer) as unknown as BodyInit, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${encodeURIComponent(filename)}"`,
    },
  });
}
