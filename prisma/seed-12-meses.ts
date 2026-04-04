import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const rand = (min: number, max: number) => Math.round(min + Math.random() * (max - min));
const pick = <T>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)]!;

const categoriasGasto = [
  "Alquiler", "Servicios Públicos", "Internet y Telefonía",
  "Útiles de Oficina", "Transporte", "Capacitación",
  "Software y Licencias", "Limpieza", "Mantenimiento", "Marketing",
];

// Meses a generar: May 2025 → Dic 2025 (los que faltan para completar 12 meses)
const MESES_GENERAR = [
  { anio: 2025, mes: 5 },
  { anio: 2025, mes: 6 },
  { anio: 2025, mes: 7 },
  { anio: 2025, mes: 8 },
  { anio: 2025, mes: 9 },
  { anio: 2025, mes: 10 },
  { anio: 2025, mes: 11 },
  { anio: 2025, mes: 12 },
];

async function main() {
  console.log("Generando datos May 2025 → Dic 2025...\n");

  const admin = await prisma.user.findFirst({ where: { role: "GERENCIA" } });
  if (!admin) throw new Error("Admin no encontrado");

  const cuentas = await prisma.cuentaBancaria.findMany({ where: { activo: true } });
  const contadores = await prisma.user.findMany({ where: { role: "CONTADOR" } });
  const personas = await prisma.persona.findMany({ take: 15 });
  const tipoMensual = await prisma.tipoServicio.findUnique({ where: { nombre: "Declaración mensual" } });
  const tipoAnual = await prisma.tipoServicio.findUnique({ where: { nombre: "Declaración anual" } });
  const tipoConstitucion = await prisma.tipoServicio.findUnique({ where: { nombre: "Constitución" } });
  const tipoAsesoria = await prisma.tipoServicio.findUnique({ where: { nombre: "Asesoría" } });
  const tipoTramite = await prisma.tipoServicio.findUnique({ where: { nombre: "Trámites" } });

  if (!tipoMensual) throw new Error("TipoServicio 'Declaración mensual' no encontrado");

  const tiposEspeciales = [tipoAnual, tipoConstitucion, tipoAsesoria, tipoTramite].filter(Boolean);

  let totalServicios = 0;
  let totalFinanzas = 0;

  for (const { anio, mes } of MESES_GENERAR) {
    const periodo = `${anio}-${String(mes).padStart(2, "0")}`;
    const mesLabel = `${["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Set","Oct","Nov","Dic"][mes-1]} ${anio}`;

    // Check if already has servicios for this periodo
    const existing = await prisma.servicio.count({ where: { periodo } });
    if (existing > 0) {
      console.log(`  ⏭ ${mesLabel} ya tiene ${existing} servicios, saltando`);
      continue;
    }

    console.log(`📅 ${mesLabel}`);

    // Crear servicios mensuales (8-13 por mes, variando)
    const numServicios = rand(8, Math.min(13, personas.length));
    const personasShuffled = [...personas].sort(() => Math.random() - 0.5);

    for (let i = 0; i < numServicios; i++) {
      const persona = personasShuffled[i]!;
      const contador = contadores[i % contadores.length]!;
      const honorarios = rand(8000, 120000);

      await prisma.servicio.create({
        data: {
          personaId: persona.id,
          tipoServicioId: tipoMensual.id,
          contadorId: contador.id,
          periodo,
          baseImponible: Math.round(honorarios * 5.5),
          igv: Math.round(honorarios * 5.5 * 0.18),
          noGravado: 0,
          totalImponible: Math.round(honorarios * 5.5 * 1.18),
          honorarios,
          descuento: 0,
          precioFinal: honorarios,
          montoCobrado: honorarios,
          montoRestante: 0,
          estadoCobranza: "COBRADO",
          estadoTrabajo: "COBRADO",
          estado: "ACTIVO",
        },
      });
      totalServicios++;
    }

    // 1-2 servicios especiales random por mes
    const numEspeciales = rand(0, 2);
    for (let j = 0; j < numEspeciales; j++) {
      const tipo = pick(tiposEspeciales)!;
      const honorarios = rand(25000, 200000);
      await prisma.servicio.create({
        data: {
          personaId: pick(personas).id,
          tipoServicioId: tipo.id,
          contadorId: pick(contadores).id,
          periodo,
          baseImponible: 0,
          igv: 0,
          noGravado: 0,
          totalImponible: 0,
          honorarios,
          descuento: 0,
          precioFinal: honorarios,
          montoCobrado: honorarios,
          montoRestante: 0,
          estadoCobranza: "COBRADO",
          estadoTrabajo: "COBRADO",
          estado: "ACTIVO",
        },
      });
      totalServicios++;
    }

    // Finanzas: ingresos (cobros vinculados a servicios del mes)
    const serviciosMes = await prisma.servicio.findMany({
      where: { periodo },
      include: { persona: { select: { razonSocial: true } } },
    });

    for (const svc of serviciosMes) {
      const dia = rand(5, 28);
      const fecha = new Date(anio, mes - 1, dia);
      await prisma.finanza.create({
        data: {
          tipo: "INGRESO",
          monto: rand(8000, 120000),
          fecha,
          concepto: `Cobro ${svc.persona.razonSocial.split(" ").slice(0, 2).join(" ")}`,
          cuentaId: pick(cuentas).id,
          servicioId: svc.id,
          creadoPorId: admin.id,
        },
      });
      totalFinanzas++;
    }

    // Finanzas: egresos (5-8 por mes)
    const numEgresos = rand(5, 8);
    for (let k = 0; k < numEgresos; k++) {
      const cat = pick(categoriasGasto);
      const dia = rand(2, 28);
      await prisma.finanza.create({
        data: {
          tipo: "EGRESO",
          monto: rand(3000, 55000),
          fecha: new Date(anio, mes - 1, dia),
          concepto: `${cat} — ${mesLabel}`,
          categoriaGasto: cat,
          cuentaId: pick(cuentas).id,
          creadoPorId: admin.id,
        },
      });
      totalFinanzas++;
    }

    console.log(`   ✓ ${numServicios}+${numEspeciales} servicios, ${serviciosMes.length} ingresos, ${numEgresos} egresos`);
  }

  console.log(`\n🎉 Totales: ${totalServicios} servicios, ${totalFinanzas} transacciones`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
