import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { computeHonorarios } from "@/features/servicios/lib/pricing";

export async function GET(req: NextRequest) {
  const servicioId = req.nextUrl.searchParams.get("id");
  if (!servicioId) return NextResponse.json({ error: "need ?id=" });

  const s = await prisma.servicio.findUnique({
    where: { id: servicioId },
    include: {
      persona: { select: { tipoPersona: true, regimen: true, razonSocial: true } },
      tipoServicio: { select: { categoria: true, nombre: true } },
    },
  });

  if (!s) return NextResponse.json({ error: "not found" });

  const autoHonorarios = computeHonorarios({
    categoriaServicio: s.tipoServicio.categoria,
    tipoPersona: s.persona.tipoPersona,
    regimen: s.persona.regimen,
    baseImponible: s.baseImponible,
    noGravado: s.noGravado,
    tieneContrato: false,
  });

  return NextResponse.json({
    empresa: s.persona.razonSocial,
    tipoPersona: s.persona.tipoPersona,
    regimen: s.persona.regimen,
    categoria: s.tipoServicio.categoria,
    baseImponible: s.baseImponible,
    noGravado: s.noGravado,
    facturacionCentavos: s.baseImponible + s.noGravado,
    facturacionSoles: (s.baseImponible + s.noGravado) / 100,
    honorariosActual: s.honorarios,
    autoHonorarios,
    autoHonorariosSoles: autoHonorarios / 100,
  });
}
