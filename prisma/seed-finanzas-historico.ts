import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Agregando datos financieros históricos...\n");

  const admin = await prisma.user.findFirst({ where: { role: "GERENCIA" } });
  if (!admin) throw new Error("Admin no encontrado. Ejecuta el seed principal primero.");

  const cuentas = await prisma.cuentaBancaria.findMany({ where: { activo: true } });
  const efectivo = cuentas.find((c) => c.nombre === "Efectivo")!;
  const bcp = cuentas.find((c) => c.nombre === "BCP Corriente")!;
  const interbank = cuentas.find((c) => c.nombre === "Interbank Ahorros")!;
  const bbva = cuentas.find((c) => c.nombre === "BBVA Ahorros");

  const contadores = await prisma.user.findMany({ where: { role: "CONTADOR" } });
  const personas = await prisma.persona.findMany({ take: 15 });
  const tipoMensual = await prisma.tipoServicio.findUnique({ where: { nombre: "Declaración mensual" } });
  const tipoAnual = await prisma.tipoServicio.findUnique({ where: { nombre: "Declaración anual" } });
  const tipoConstitucion = await prisma.tipoServicio.findUnique({ where: { nombre: "Constitución" } });
  const tipoAsesoria = await prisma.tipoServicio.findUnique({ where: { nombre: "Asesoría" } });
  const tipoTramite = await prisma.tipoServicio.findUnique({ where: { nombre: "Trámites" } });

  if (!tipoMensual || !tipoAnual) throw new Error("Tipos de servicio no encontrados");

  // Helper: random between min and max (centavos)
  const rand = (min: number, max: number) => Math.round(min + Math.random() * (max - min));
  const pick = <T>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)]!;
  const cuentasArr = [efectivo, bcp, interbank, bbva].filter(Boolean) as typeof cuentas;

  const categoriasGasto = [
    "Alquiler", "Servicios Públicos", "Internet y Telefonía",
    "Útiles de Oficina", "Transporte", "Capacitación",
    "Software y Licencias", "Limpieza", "Mantenimiento", "Marketing",
  ];

  // ===================================================================
  // SERVICIOS adicionales para Enero y Abril (ya existen Feb y Mar)
  // ===================================================================
  const mesesServicios = [
    { periodo: "2026-01", count: 12 },
    { periodo: "2026-04", count: 15 },
  ];

  for (const { periodo, count } of mesesServicios) {
    const existing = await prisma.servicio.count({ where: { periodo } });
    if (existing > 0) {
      console.log(`  → Servicios de ${periodo} ya existen (${existing}), saltando`);
      continue;
    }

    for (let i = 0; i < count && i < personas.length; i++) {
      const honorarios = rand(8000, 120000);
      const cobrado = periodo === "2026-01" ? honorarios : rand(0, honorarios);
      const restante = Math.max(0, honorarios - cobrado);

      await prisma.servicio.create({
        data: {
          personaId: personas[i]!.id,
          tipoServicioId: tipoMensual.id,
          contadorId: contadores[i % contadores.length]!.id,
          periodo,
          baseImponible: Math.round(honorarios * 5.5),
          igv: Math.round(honorarios * 5.5 * 0.18),
          noGravado: 0,
          totalImponible: Math.round(honorarios * 5.5 * 1.18),
          honorarios,
          descuento: 0,
          precioFinal: honorarios,
          montoCobrado: cobrado,
          montoRestante: restante,
          estadoCobranza: cobrado >= honorarios ? "COBRADO" : cobrado > 0 ? "PARCIAL" : "PENDIENTE",
          estadoTrabajo: periodo === "2026-01" ? "COBRADO" : "POR_DECLARAR",
          estado: "ACTIVO",
        },
      });
    }
    console.log(`✓ ${count} servicios creados para ${periodo}`);
  }

  // Servicios especiales (Constitución, Asesoría, Trámites) distribuidos en meses
  const serviciosEspeciales = [
    { tipo: tipoConstitucion, periodo: "2026-01", honorarios: 150000, concepto: "Constitución" },
    { tipo: tipoConstitucion, periodo: "2026-03", honorarios: 180000, concepto: "Constitución" },
    { tipo: tipoAsesoria, periodo: "2026-02", honorarios: 50000, concepto: "Asesoría" },
    { tipo: tipoAsesoria, periodo: "2026-04", honorarios: 80000, concepto: "Asesoría" },
    { tipo: tipoTramite, periodo: "2026-01", honorarios: 35000, concepto: "Trámites" },
    { tipo: tipoTramite, periodo: "2026-03", honorarios: 25000, concepto: "Trámites" },
    { tipo: tipoTramite, periodo: "2026-04", honorarios: 40000, concepto: "Trámites" },
    { tipo: tipoAnual, periodo: "2026-04", honorarios: 250000, concepto: "Declaración anual" },
    { tipo: tipoAnual, periodo: "2026-04", honorarios: 200000, concepto: "Declaración anual" },
  ];

  for (const svc of serviciosEspeciales) {
    if (!svc.tipo) continue;
    const persona = pick(personas);
    const contador = pick(contadores);
    const cobrado = rand(0, svc.honorarios);

    await prisma.servicio.create({
      data: {
        personaId: persona.id,
        tipoServicioId: svc.tipo.id,
        contadorId: contador.id,
        periodo: svc.periodo,
        baseImponible: 0,
        igv: 0,
        noGravado: 0,
        totalImponible: 0,
        honorarios: svc.honorarios,
        descuento: 0,
        precioFinal: svc.honorarios,
        montoCobrado: cobrado,
        montoRestante: Math.max(0, svc.honorarios - cobrado),
        estadoCobranza: cobrado >= svc.honorarios ? "COBRADO" : cobrado > 0 ? "PARCIAL" : "PENDIENTE",
        estadoTrabajo: "COBRADO",
        estado: "ACTIVO",
      },
    });
  }
  console.log(`✓ ${serviciosEspeciales.length} servicios especiales creados`);

  // ===================================================================
  // FINANZAS — Ingresos y Egresos para Ene-Abr 2026
  // ===================================================================
  const finanzasData: {
    tipo: "INGRESO" | "EGRESO";
    monto: number;
    fecha: Date;
    concepto: string;
    categoriaGasto?: string;
    cuentaId: string;
    servicioId?: string;
  }[] = [];

  // Buscar servicios por período para vincular ingresos
  const serviciosPorPeriodo: Record<string, Awaited<ReturnType<typeof prisma.servicio.findMany>>> = {};
  for (const p of ["2026-01", "2026-02", "2026-03", "2026-04"]) {
    serviciosPorPeriodo[p] = await prisma.servicio.findMany({
      where: { periodo: p },
      include: { persona: { select: { razonSocial: true } } },
    });
  }

  // ENERO 2026
  for (const svc of (serviciosPorPeriodo["2026-01"] ?? []).slice(0, 10)) {
    const monto = rand(8000, 100000);
    finanzasData.push({
      tipo: "INGRESO",
      monto,
      fecha: new Date(`2026-01-${String(rand(5, 28)).padStart(2, "0")}`),
      concepto: `Cobro ${(svc as any).persona.razonSocial.split(" ").slice(0, 2).join(" ")}`,
      cuentaId: pick(cuentasArr).id,
      servicioId: svc.id,
    });
  }
  // Egresos Enero
  for (let i = 0; i < 6; i++) {
    const cat = pick(categoriasGasto);
    finanzasData.push({
      tipo: "EGRESO",
      monto: rand(3000, 45000),
      fecha: new Date(`2026-01-${String(rand(3, 28)).padStart(2, "0")}`),
      concepto: `${cat} - Enero`,
      categoriaGasto: cat,
      cuentaId: pick(cuentasArr).id,
    });
  }

  // FEBRERO 2026
  for (const svc of (serviciosPorPeriodo["2026-02"] ?? []).slice(0, 8)) {
    finanzasData.push({
      tipo: "INGRESO",
      monto: rand(10000, 80000),
      fecha: new Date(`2026-02-${String(rand(3, 26)).padStart(2, "0")}`),
      concepto: `Cobro ${(svc as any).persona.razonSocial.split(" ").slice(0, 2).join(" ")}`,
      cuentaId: pick(cuentasArr).id,
      servicioId: svc.id,
    });
  }
  for (let i = 0; i < 7; i++) {
    const cat = pick(categoriasGasto);
    finanzasData.push({
      tipo: "EGRESO",
      monto: rand(2000, 50000),
      fecha: new Date(`2026-02-${String(rand(2, 26)).padStart(2, "0")}`),
      concepto: `${cat} - Febrero`,
      categoriaGasto: cat,
      cuentaId: pick(cuentasArr).id,
    });
  }

  // MARZO 2026 (ya tiene 5, agregar más)
  for (const svc of (serviciosPorPeriodo["2026-03"] ?? []).slice(0, 12)) {
    finanzasData.push({
      tipo: "INGRESO",
      monto: rand(8000, 120000),
      fecha: new Date(`2026-03-${String(rand(3, 30)).padStart(2, "0")}`),
      concepto: `Cobro ${(svc as any).persona.razonSocial.split(" ").slice(0, 2).join(" ")}`,
      cuentaId: pick(cuentasArr).id,
      servicioId: svc.id,
    });
  }
  for (let i = 0; i < 8; i++) {
    const cat = pick(categoriasGasto);
    finanzasData.push({
      tipo: "EGRESO",
      monto: rand(3000, 60000),
      fecha: new Date(`2026-03-${String(rand(2, 30)).padStart(2, "0")}`),
      concepto: `${cat} - Marzo`,
      categoriaGasto: cat,
      cuentaId: pick(cuentasArr).id,
    });
  }

  // ABRIL 2026
  for (const svc of (serviciosPorPeriodo["2026-04"] ?? []).slice(0, 15)) {
    finanzasData.push({
      tipo: "INGRESO",
      monto: rand(10000, 150000),
      fecha: new Date(`2026-04-${String(rand(1, 2)).padStart(2, "0")}`),
      concepto: `Cobro de servicio`,
      cuentaId: pick(cuentasArr).id,
      servicioId: svc.id,
    });
  }
  for (let i = 0; i < 5; i++) {
    const cat = pick(categoriasGasto);
    finanzasData.push({
      tipo: "EGRESO",
      monto: rand(5000, 40000),
      fecha: new Date(`2026-04-0${rand(1, 2)}`),
      concepto: `${cat} - Abril`,
      categoriaGasto: cat,
      cuentaId: pick(cuentasArr).id,
    });
  }

  // Insert all finanzas
  for (const f of finanzasData) {
    await prisma.finanza.create({
      data: {
        tipo: f.tipo,
        monto: f.monto,
        fecha: f.fecha,
        concepto: f.concepto,
        categoriaGasto: f.categoriaGasto ?? null,
        cuentaId: f.cuentaId,
        servicioId: f.servicioId ?? null,
        creadoPorId: admin.id,
      },
    });
  }
  console.log(`✓ ${finanzasData.length} transacciones financieras creadas (Ene-Abr 2026)`);

  // ===================================================================
  // CAJA CHICA — movimientos varios meses
  // ===================================================================
  let saldo = 0;
  const cajaData = [
    { tipo: "INGRESO" as const, monto: 50000, fecha: new Date("2026-01-05"), concepto: "Fondo inicial caja chica" },
    { tipo: "GASTO" as const, monto: 1500, fecha: new Date("2026-01-10"), concepto: "Copias y anillados" },
    { tipo: "GASTO" as const, monto: 3000, fecha: new Date("2026-01-18"), concepto: "Taxi trámites SUNAT" },
    { tipo: "GASTO" as const, monto: 2500, fecha: new Date("2026-02-03"), concepto: "Útiles de escritorio" },
    { tipo: "GASTO" as const, monto: 4000, fecha: new Date("2026-02-15"), concepto: "Envío de documentos courier" },
    { tipo: "INGRESO" as const, monto: 30000, fecha: new Date("2026-02-20"), concepto: "Reposición caja chica" },
    { tipo: "GASTO" as const, monto: 1800, fecha: new Date("2026-03-05"), concepto: "Folder y sobres manila" },
    { tipo: "GASTO" as const, monto: 5000, fecha: new Date("2026-03-12"), concepto: "Pasaje gestión notaría" },
    { tipo: "GASTO" as const, monto: 2200, fecha: new Date("2026-03-25"), concepto: "Agua y café oficina" },
    { tipo: "INGRESO" as const, monto: 20000, fecha: new Date("2026-04-01"), concepto: "Reposición caja chica Abril" },
    { tipo: "GASTO" as const, monto: 3500, fecha: new Date("2026-04-02"), concepto: "Taxi trámites municipalidad" },
  ];

  const existingCaja = await prisma.cajaChica.count();
  if (existingCaja === 0) {
    for (const c of cajaData) {
      saldo += c.tipo === "INGRESO" ? c.monto : -c.monto;
      await prisma.cajaChica.create({
        data: {
          tipo: c.tipo,
          monto: c.monto,
          fecha: c.fecha,
          concepto: c.concepto,
          saldoAcumulado: saldo,
          creadoPorId: admin.id,
        },
      });
    }
    console.log(`✓ ${cajaData.length} movimientos de caja chica creados`);
  } else {
    console.log(`  → Caja chica ya tiene ${existingCaja} registros, saltando`);
  }

  console.log("\n🎉 Datos históricos creados exitosamente.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
