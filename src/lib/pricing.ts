const PLANILLA_TABLE: Record<number, number> = {
  1: 8000,
  2: 10000,
  3: 15000,
  4: 15000,
  5: 20000,
  6: 20000,
  7: 25000,
  8: 30000,
  9: 30000,
  10: 35000,
  11: 40000,
  12: 40000,
  13: 45000,
  14: 50000,
  15: 50000,
  16: 55000,
  17: 60000,
  18: 60000,
};

export function planillaPrecio(numTrabajadores: number): number {
  if (numTrabajadores <= 0) return 0;
  if (numTrabajadores <= 18) return PLANILLA_TABLE[numTrabajadores]!;
  return Math.round((60000 + 5000 * (numTrabajadores - 18)) / 5000) * 5000;
}

export function computeIGV(baseImponible: number): number {
  return Math.round(baseImponible * 0.18);
}

export function computeTotalImponible(
  baseImponible: number,
  igv: number,
  noGravado: number,
): number {
  return baseImponible + igv + noGravado;
}

export function computePrecioFinal(
  honorarios: number,
  descuento: number,
): number {
  return honorarios - descuento;
}

export function computeMontoRestante(
  precioFinal: number,
  montoCobrado: number,
): number {
  return Math.max(0, precioFinal - montoCobrado);
}
