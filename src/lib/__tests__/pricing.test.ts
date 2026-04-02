import { describe, it, expect } from "vitest";
import {
  planillaPrecio,
  computeIGV,
  computeTotalImponible,
  computePrecioFinal,
  computeMontoRestante,
} from "../pricing";

describe("planillaPrecio", () => {
  it("retorna 0 para 0 trabajadores", () => {
    expect(planillaPrecio(0)).toBe(0);
  });

  it("retorna 0 para valores negativos", () => {
    expect(planillaPrecio(-1)).toBe(0);
  });

  it("retorna 8000 para 1 trabajador", () => {
    expect(planillaPrecio(1)).toBe(8000);
  });

  it("retorna 10000 para 2 trabajadores", () => {
    expect(planillaPrecio(2)).toBe(10000);
  });

  it("retorna 60000 para 18 trabajadores", () => {
    expect(planillaPrecio(18)).toBe(60000);
  });

  it("calcula correctamente para más de 18 trabajadores", () => {
    // 19 trabajadores: 60000 + 5000*(19-18) = 65000
    expect(planillaPrecio(19)).toBe(65000);
  });

  it("calcula correctamente para 20 trabajadores", () => {
    // 20 trabajadores: 60000 + 5000*(20-18) = 70000
    expect(planillaPrecio(20)).toBe(70000);
  });
});

describe("computeIGV", () => {
  it("calcula el 18% correctamente redondeando", () => {
    expect(computeIGV(10000)).toBe(1800);
  });

  it("redondea correctamente con fracciones", () => {
    // 100 centavos * 0.18 = 18 centavos
    expect(computeIGV(100)).toBe(18);
  });

  it("maneja base cero", () => {
    expect(computeIGV(0)).toBe(0);
  });
});

describe("computeTotalImponible", () => {
  it("suma base, igv y no gravado correctamente", () => {
    expect(computeTotalImponible(10000, 1800, 500)).toBe(12300);
  });

  it("maneja no gravado en cero", () => {
    expect(computeTotalImponible(10000, 1800, 0)).toBe(11800);
  });
});

describe("computePrecioFinal", () => {
  it("resta el descuento a los honorarios", () => {
    expect(computePrecioFinal(10000, 1000)).toBe(9000);
  });

  it("maneja descuento cero", () => {
    expect(computePrecioFinal(10000, 0)).toBe(10000);
  });
});

describe("computeMontoRestante", () => {
  it("calcula el monto restante correctamente", () => {
    expect(computeMontoRestante(10000, 3000)).toBe(7000);
  });

  it("retorna 0 cuando el cobro supera el precio final", () => {
    expect(computeMontoRestante(10000, 12000)).toBe(0);
  });

  it("retorna 0 cuando está completamente cobrado", () => {
    expect(computeMontoRestante(10000, 10000)).toBe(0);
  });
});
