import {
  computeIGV,
  computeTotalImponible,
  computePrecioFinal,
  computeMontoRestante,
} from "@/lib/pricing";
import type { EstadoCobranza } from "@prisma/client";

/**
 * Calcula honorarios automáticamente según reglas de Airtable:
 * - Tipo de servicio, tipo de persona, régimen, facturación
 */
export function computeHonorarios(params: {
  categoriaServicio: string;
  tipoPersona: string;
  regimen: string;
  baseImponible: number; // centavos
  noGravado: number;     // centavos
  tieneContrato: boolean;
  capitalSocial?: number; // centavos, for constitución
}): number {
  const { categoriaServicio, tipoPersona, regimen, baseImponible, noGravado, tieneContrato, capitalSocial } = params;
  const facturacion = baseImponible + noGravado; // centavos

  if (categoriaServicio === "MENSUAL") {
    // Con contrato → S/. 1,200
    if (tieneContrato) return 120000;

    // Immunotec / 4Life
    if (tipoPersona === "IMMUNOTEC" || tipoPersona === "FOUR_LIFE") {
      return facturacion === 0 ? 3000 : 10000;
    }

    // Sin facturación
    if (facturacion === 0) {
      if (tipoPersona === "NATURAL") return 3000;
      if (tipoPersona === "JURIDICA") return 5000;
      return 3000;
    }

    // Con facturación — depende del régimen
    // Convertir facturación a soles para los rangos
    const factSoles = facturacion / 100;

    if (regimen === "RER") {
      if (factSoles <= 5000) return 15000;
      if (factSoles <= 10000) return 20000;
      if (factSoles <= 20000) return 25000;
      if (factSoles <= 30000) return 30000;
      return 35000;
    }

    // MYPE o REG
    if (regimen === "MYPE" || regimen === "REG") {
      if (factSoles <= 5000) return 20000;
      if (factSoles <= 10000) return 25000;
      if (factSoles <= 20000) return 30000;
      if (factSoles <= 30000) return 40000;
      if (factSoles <= 50000) return 50000;
      return 70000;
    }

    return 0;
  }

  if (categoriaServicio === "CONSTITUCION") {
    if (capitalSocial && capitalSocial > 0) {
      const capSoles = capitalSocial / 100;
      if (capSoles <= 10000) return 80000;
      if (capSoles <= 20000) return 85000;
      if (capSoles <= 30000) return 88000;
      if (capSoles <= 50000) return 100000;
      if (capSoles <= 70000) return 120000;
      if (capSoles <= 100000) return 160000;
      return 160000;
    }
  }

  // Para otros tipos de servicio, no hay auto-cálculo
  return 0;
}

export function computeServicioPricing(data: {
  baseImponible: number;
  noGravado: number;
  honorarios: number;
  descuento: number;
  montoCobrado: number;
}) {
  const igv = computeIGV(data.baseImponible);
  const totalImponible = computeTotalImponible(
    data.baseImponible,
    igv,
    data.noGravado,
  );
  const precioFinal = computePrecioFinal(data.honorarios, data.descuento);
  const montoRestante = computeMontoRestante(precioFinal, data.montoCobrado);

  let estadoCobranza: EstadoCobranza = "PENDIENTE";
  if (precioFinal <= 0 || data.montoCobrado >= precioFinal) {
    estadoCobranza = "COBRADO";
  } else if (data.montoCobrado > 0) {
    estadoCobranza = "PARCIAL";
  }

  return { igv, totalImponible, precioFinal, montoRestante, estadoCobranza };
}
