import { prisma } from "@/lib/prisma";

const MESES_NOMBRES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

const TIPO_PERSONA_LABELS: Record<string, string> = {
  JURIDICA: "Persona Jurídica",
  NATURAL: "Persona Natural",
  IMMUNOTEC: "Immunotec",
  FOUR_LIFE: "Four Life",
  RXH: "RXH",
};

export interface MonthlyReportServicio {
  numero: number;
  empresa: string;
  baseImponible: number;
  igv: number;
  noGravado: number;
  numTrabajadores: number | null;
  totalImponible: number;
  honorarios: number;
}

export interface MonthlyReportGrupo {
  tipoPersona: string;
  servicios: MonthlyReportServicio[];
  totales: {
    baseImponible: number;
    igv: number;
    noGravado: number;
    numTrabajadores: number;
    totalImponible: number;
    honorarios: number;
  };
}

export interface MonthlyReportData {
  mes: string;
  anio: number;
  estudio: string;
  contador: string;
  grupos: MonthlyReportGrupo[];
  totalGeneral: {
    baseImponible: number;
    igv: number;
    noGravado: number;
    numTrabajadores: number;
    totalImponible: number;
    honorarios: number;
  };
}

export async function getMonthlyReportData(
  contadorId: string,
  anio: number,
  mes: number
): Promise<MonthlyReportData | null> {
  const mesStr = String(mes).padStart(2, "0");
  const periodo = `${anio}-${mesStr}`;

  const [contador, servicios] = await Promise.all([
    prisma.user.findUnique({
      where: { id: contadorId },
      select: { nombre: true, apellido: true },
    }),
    prisma.servicio.findMany({
      where: {
        contadorId,
        periodo,
        estado: { not: "ARCHIVADO" },
      },
      include: {
        persona: {
          select: {
            razonSocial: true,
            tipoPersona: true,
            numTrabajadores: true,
          },
        },
      },
      orderBy: { persona: { razonSocial: "asc" } },
    }),
  ]);

  if (!contador) return null;

  // Group by tipoPersona
  const gruposMap = new Map<
    string,
    { label: string; items: typeof servicios }
  >();

  for (const servicio of servicios) {
    const tp = servicio.persona.tipoPersona;
    const label = TIPO_PERSONA_LABELS[tp] ?? tp;
    if (!gruposMap.has(tp)) {
      gruposMap.set(tp, { label, items: [] });
    }
    gruposMap.get(tp)!.items.push(servicio);
  }

  const grupos: MonthlyReportGrupo[] = [];

  for (const [, { label, items }] of gruposMap) {
    let numero = 1;
    const serviciosGrupo: MonthlyReportServicio[] = items.map((s) => ({
      numero: numero++,
      empresa: s.persona.razonSocial,
      baseImponible: s.baseImponible,
      igv: s.igv,
      noGravado: s.noGravado,
      numTrabajadores: s.persona.numTrabajadores,
      totalImponible: s.totalImponible,
      honorarios: s.honorarios,
    }));

    const totales = serviciosGrupo.reduce(
      (acc, s) => ({
        baseImponible: acc.baseImponible + s.baseImponible,
        igv: acc.igv + s.igv,
        noGravado: acc.noGravado + s.noGravado,
        numTrabajadores:
          acc.numTrabajadores + (s.numTrabajadores ?? 0),
        totalImponible: acc.totalImponible + s.totalImponible,
        honorarios: acc.honorarios + s.honorarios,
      }),
      {
        baseImponible: 0,
        igv: 0,
        noGravado: 0,
        numTrabajadores: 0,
        totalImponible: 0,
        honorarios: 0,
      }
    );

    grupos.push({ tipoPersona: label, servicios: serviciosGrupo, totales });
  }

  const totalGeneral = grupos.reduce(
    (acc, g) => ({
      baseImponible: acc.baseImponible + g.totales.baseImponible,
      igv: acc.igv + g.totales.igv,
      noGravado: acc.noGravado + g.totales.noGravado,
      numTrabajadores: acc.numTrabajadores + g.totales.numTrabajadores,
      totalImponible: acc.totalImponible + g.totales.totalImponible,
      honorarios: acc.honorarios + g.totales.honorarios,
    }),
    {
      baseImponible: 0,
      igv: 0,
      noGravado: 0,
      numTrabajadores: 0,
      totalImponible: 0,
      honorarios: 0,
    }
  );

  return {
    mes: MESES_NOMBRES[mes - 1] ?? String(mes),
    anio,
    estudio: "Estudio Contable Contadores & Asociados",
    contador: `${contador.nombre} ${contador.apellido}`,
    grupos,
    totalGeneral,
  };
}

export interface CajaChicaMovimiento {
  numero: number;
  fecha: Date;
  concepto: string;
  tipo: "INGRESO" | "GASTO";
  monto: number;
  saldoAcumulado: number;
}

export interface CajaChicaReportData {
  mes: string;
  anio: number;
  estudio: string;
  saldoInicial: number;
  totalIngresos: number;
  totalGastos: number;
  saldoFinal: number;
  movimientos: CajaChicaMovimiento[];
}

export async function getCajaChicaReportData(
  anio: number,
  mes: number
): Promise<CajaChicaReportData> {
  const fechaInicio = new Date(anio, mes - 1, 1);
  const fechaFin = new Date(anio, mes, 0, 23, 59, 59, 999);

  // Get saldo just before this period
  const anteriorEntry = await prisma.cajaChica.findFirst({
    where: { fecha: { lt: fechaInicio } },
    orderBy: [{ fecha: "desc" }, { createdAt: "desc" }],
    select: { saldoAcumulado: true },
  });

  const saldoInicial = anteriorEntry?.saldoAcumulado ?? 0;

  const movimientosRaw = await prisma.cajaChica.findMany({
    where: { fecha: { gte: fechaInicio, lte: fechaFin } },
    orderBy: [{ fecha: "asc" }, { createdAt: "asc" }],
  });

  let totalIngresos = 0;
  let totalGastos = 0;

  const movimientos: CajaChicaMovimiento[] = movimientosRaw.map((m, i) => {
    if (m.tipo === "INGRESO") totalIngresos += m.monto;
    else totalGastos += m.monto;

    return {
      numero: i + 1,
      fecha: m.fecha,
      concepto: m.concepto,
      tipo: m.tipo as "INGRESO" | "GASTO",
      monto: m.monto,
      saldoAcumulado: m.saldoAcumulado,
    };
  });

  const saldoFinal =
    movimientos.length > 0
      ? movimientos[movimientos.length - 1]!.saldoAcumulado
      : saldoInicial;

  return {
    mes: MESES_NOMBRES[mes - 1] ?? String(mes),
    anio,
    estudio: "Estudio Contable Contadores & Asociados",
    saldoInicial,
    totalIngresos,
    totalGastos,
    saldoFinal,
    movimientos,
  };
}

export async function getContadoresParaReporte() {
  return prisma.user.findMany({
    where: {
      activo: true,
      role: { in: ["CONTADOR", "ADMINISTRADOR", "GERENCIA"] },
    },
    select: { id: true, nombre: true, apellido: true },
    orderBy: [{ apellido: "asc" }, { nombre: "asc" }],
  });
}
