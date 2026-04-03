import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { createElement } from "react";
import { authorizeAction } from "@/lib/auth-guard";
import { getMonthlyReportData } from "@/features/reportes/queries";
import { MonthlyReportDocument } from "@/features/reportes/templates/monthly-report";

const MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

export async function POST(req: NextRequest) {
  try {
    await authorizeAction(["GERENCIA", "ADMINISTRADOR"]);
  } catch {
    return new NextResponse("No autorizado", { status: 401 });
  }

  let body: { contadorIds: string[]; anio: number; mes: number };
  try {
    body = await req.json();
  } catch {
    return new NextResponse("Body inválido", { status: 400 });
  }

  const { contadorIds, anio, mes } = body;

  if (
    !contadorIds ||
    !Array.isArray(contadorIds) ||
    contadorIds.length === 0 ||
    !anio ||
    !mes
  ) {
    return new NextResponse("Parámetros requeridos: contadorIds, anio, mes", {
      status: 400,
    });
  }

  // For now, generate PDF for the first contadorId
  const contadorId = contadorIds[0]!;

  const data = await getMonthlyReportData(contadorId, anio, mes);

  if (!data) {
    return new NextResponse("Contador no encontrado", { status: 404 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const buffer = await renderToBuffer(createElement(MonthlyReportDocument, { data }) as any);

  const mesNombre = MESES[mes - 1] ?? String(mes);
  const filename = `Reporte (${mesNombre} - ${anio}) [${data.contador}].pdf`;

  return new NextResponse(Buffer.from(buffer) as unknown as BodyInit, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${encodeURIComponent(filename)}"`,
    },
  });
}
