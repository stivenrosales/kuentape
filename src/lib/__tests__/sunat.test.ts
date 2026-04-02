import { describe, it, expect } from "vitest";
import { sunatDeadlineDay, getUltimoDigitoRUC } from "../sunat";

describe("sunatDeadlineDay", () => {
  it("retorna día 7 para RUC terminado en 0", () => {
    expect(sunatDeadlineDay("20123456780")).toBe(7);
  });

  it("retorna día 8 para RUC terminado en 1", () => {
    expect(sunatDeadlineDay("20123456781")).toBe(8);
  });

  it("retorna día 9 para RUC terminado en 2", () => {
    expect(sunatDeadlineDay("20123456782")).toBe(9);
  });

  it("retorna día 10 para RUC terminado en 3", () => {
    expect(sunatDeadlineDay("20123456783")).toBe(10);
  });

  it("retorna día 11 para RUC terminado en 4", () => {
    expect(sunatDeadlineDay("20123456784")).toBe(11);
  });

  it("retorna día 12 para RUC terminado en 5", () => {
    expect(sunatDeadlineDay("20123456785")).toBe(12);
  });

  it("retorna día 13 para RUC terminado en 6", () => {
    expect(sunatDeadlineDay("20123456786")).toBe(13);
  });

  it("retorna día 14 para RUC terminado en 7", () => {
    expect(sunatDeadlineDay("20123456787")).toBe(14);
  });

  it("retorna día 15 para RUC terminado en 8", () => {
    expect(sunatDeadlineDay("20123456788")).toBe(15);
  });

  it("retorna día 16 para RUC terminado en 9", () => {
    expect(sunatDeadlineDay("20123456789")).toBe(16);
  });

  it("retorna 16 como fallback para dígito desconocido", () => {
    expect(sunatDeadlineDay("")).toBe(16);
  });
});

describe("getUltimoDigitoRUC", () => {
  it("extrae el último dígito correctamente", () => {
    expect(getUltimoDigitoRUC("20123456789")).toBe("9");
  });

  it("extrae el último dígito para RUC terminado en 0", () => {
    expect(getUltimoDigitoRUC("20123456780")).toBe("0");
  });
});
