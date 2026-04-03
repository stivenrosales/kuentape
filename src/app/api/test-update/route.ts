import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { computeHonorarios, computeServicioPricing } from "@/features/servicios/lib/pricing";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { servicioId, baseImponible } = body;

  const servicio = await prisma.servicio.findUnique({
    where: { id: servicioId },
    include: {
      persona: { select: { tipoPersona: true, regimen: true } },
      tipoServicio: { select: { categoria: true } },
    },
  });

  if (!servicio) return NextResponse.json({ error: "not found" });

  const newBase = baseImponible ?? servicio.baseImponible;
  const noGravado = servicio.noGravado;
  const descuento = servicio.descuento;

  const autoHonorarios = computeHonorarios({
    categoriaServicio: servicio.tipoServicio.categoria,
    tipoPersona: servicio.persona.tipoPersona,
    regimen: servicio.persona.regimen,
    baseImponible: newBase,
    noGravado,
    tieneContrato: false,
  });

  const honorarios = autoHonorarios > 0 ? autoHonorarios : servicio.honorarios;

  const pricing = computeServicioPricing({
    baseImponible: newBase,
    noGravado,
    honorarios,
    descuento,
    montoCobrado: servicio.montoCobrado,
  });

  // Actually update the DB
  await prisma.servicio.update({
    where: { id: servicioId },
    data: {
      baseImponible: newBase,
      igv: pricing.igv,
      noGravado,
      totalImponible: pricing.totalImponible,
      honorarios,
      descuento,
      precioFinal: pricing.precioFinal,
      montoRestante: pricing.montoRestante,
      estadoCobranza: pricing.estadoCobranza,
    },
  });

  return NextResponse.json({
    autoHonorarios,
    honorarios,
    pricing,
    updated: true,
  });
}
