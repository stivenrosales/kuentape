import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Iniciando seed...");

  // Seed TipoServicio
  const tiposServicio = [
    { nombre: "Declaración mensual", categoria: "MENSUAL" as const, requierePeriodo: true, orden: 1 },
    { nombre: "Declaración anual", categoria: "ANUAL" as const, requierePeriodo: true, orden: 2 },
    { nombre: "Constitución", categoria: "CONSTITUCION" as const, requierePeriodo: false, orden: 3 },
    { nombre: "Regularización", categoria: "REGULARIZACION" as const, requierePeriodo: false, orden: 4 },
    { nombre: "Trámites", categoria: "TRAMITE" as const, requierePeriodo: false, orden: 5 },
    { nombre: "Asesoría", categoria: "ASESORIA" as const, requierePeriodo: false, orden: 6 },
    { nombre: "Modificación de estatuto", categoria: "MODIF_ESTATUTO" as const, requierePeriodo: false, orden: 7 },
    { nombre: "RXH", categoria: "OTROS" as const, requierePeriodo: true, orden: 8 },
    { nombre: "Otros", categoria: "OTROS" as const, requierePeriodo: false, orden: 9 },
  ];

  for (const tipo of tiposServicio) {
    await prisma.tipoServicio.upsert({
      where: { nombre: tipo.nombre },
      update: {},
      create: tipo,
    });
  }
  console.log(`✓ ${tiposServicio.length} tipos de servicio creados`);

  // Seed CuentaBancaria
  const cuentas = [
    { nombre: "Efectivo", banco: "Efectivo", tipo: "EFECTIVO" as const, orden: 1 },
    { nombre: "BCP Corriente", banco: "BCP", tipo: "CORRIENTE" as const, orden: 2 },
    { nombre: "BCP Ahorros", banco: "BCP", tipo: "AHORROS" as const, orden: 3 },
    { nombre: "Interbank Ahorros", banco: "Interbank", tipo: "AHORROS" as const, orden: 4 },
    { nombre: "BBVA Ahorros", banco: "BBVA", tipo: "AHORROS" as const, orden: 5 },
    { nombre: "BN Ahorros", banco: "Banco de la Nación", tipo: "AHORROS" as const, orden: 6 },
    { nombre: "CajaHuancayo Corriente", banco: "Caja Huancayo", tipo: "CORRIENTE" as const, orden: 7 },
    { nombre: "Scotiabank Corriente", banco: "Scotiabank", tipo: "CORRIENTE" as const, orden: 8 },
  ];

  for (const cuenta of cuentas) {
    await prisma.cuentaBancaria.upsert({
      where: { nombre: cuenta.nombre },
      update: {},
      create: cuenta,
    });
  }
  console.log(`✓ ${cuentas.length} cuentas bancarias creadas`);

  // Seed admin user
  const password = process.env.ADMIN_PASSWORD ?? "admin123";
  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.user.upsert({
    where: { email: "admin@sheila.pe" },
    update: {},
    create: {
      nombre: "Administrador",
      apellido: "Sistema",
      email: "admin@sheila.pe",
      passwordHash,
      role: "GERENCIA",
      activo: true,
    },
  });
  console.log("✓ Usuario GERENCIA creado: admin@sheila.pe");

  // === DEMO DATA ===
  console.log("Creando datos de demostración...");

  // Contadores
  const contadores = [
    { nombre: "Gabriela", apellido: "López", email: "gabriela@sheila.pe" },
    { nombre: "Leo", apellido: "Martínez", email: "leo@sheila.pe" },
    { nombre: "Zulma", apellido: "Rodríguez", email: "zulma@sheila.pe" },
    { nombre: "Milagros", apellido: "Fernández", email: "milagros@sheila.pe" },
    { nombre: "Emely", apellido: "Torres", email: "emely@sheila.pe" },
  ];

  const contadorIds: string[] = [];
  for (const c of contadores) {
    const user = await prisma.user.upsert({
      where: { email: c.email },
      update: {},
      create: {
        ...c,
        passwordHash: await bcrypt.hash("contador123", 12),
        role: "CONTADOR",
        activo: true,
      },
    });
    contadorIds.push(user.id);
  }
  console.log(`✓ ${contadores.length} contadores creados`);

  // Ventas user
  await prisma.user.upsert({
    where: { email: "ventas@sheila.pe" },
    update: {},
    create: {
      nombre: "Sandy",
      apellido: "Pérez",
      email: "ventas@sheila.pe",
      passwordHash: await bcrypt.hash("ventas123", 12),
      role: "VENTAS",
      activo: true,
    },
  });
  console.log("✓ Usuario VENTAS creado: ventas@sheila.pe");

  // Clientes (Personas)
  const empresas = [
    { razonSocial: "CORPORACION BEL CARS S.A.C.", ruc: "20615196411", tipoPersona: "JURIDICA" as const, regimen: "MYPE" as const },
    { razonSocial: "INVERSIONES HADARA H & N S.A.C.", ruc: "20612345678", tipoPersona: "JURIDICA" as const, regimen: "MYPE" as const },
    { razonSocial: "ALQUIMIA AGRUM E.I.R.L.", ruc: "20698765432", tipoPersona: "JURIDICA" as const, regimen: "RER" as const },
    { razonSocial: "ALDABA AGUILAR GRESLY FIORELLA", ruc: "10456789012", tipoPersona: "NATURAL" as const, regimen: "MYPE" as const },
    { razonSocial: "TRANSPORTE LEDESMA GROUP S.A.C.", ruc: "20634567890", tipoPersona: "JURIDICA" as const, regimen: "MYPE" as const },
    { razonSocial: "LORENTE CORPORACION FERRETERA M S.A.C.", ruc: "20623456789", tipoPersona: "JURIDICA" as const, regimen: "MYPE" as const },
    { razonSocial: "CONSTRUCTORA VERSALLES E.I.R.L.", ruc: "20687654321", tipoPersona: "JURIDICA" as const, regimen: "RER" as const },
    { razonSocial: "MANGALICA EIRL", ruc: "20654321098", tipoPersona: "JURIDICA" as const, regimen: "MYPE" as const },
    { razonSocial: "GRUPO ROMA CONSTRUCCIONES S.A.C.", ruc: "20643210987", tipoPersona: "JURIDICA" as const, regimen: "MYPE" as const },
    { razonSocial: "MACHA AQUINO AMANDA", ruc: "10432109876", tipoPersona: "NATURAL" as const, regimen: "MYPE" as const },
    { razonSocial: "HUARINGA ALIAGA KAREN", ruc: "10421098765", tipoPersona: "NATURAL" as const, regimen: "MYPE" as const },
    { razonSocial: "SECCE PEDRAZA NIRIAN S.", ruc: "10410987654", tipoPersona: "NATURAL" as const, regimen: "MYPE" as const },
    { razonSocial: "PEARSON INVESTIGACION S.A.C.", ruc: "20676543210", tipoPersona: "JURIDICA" as const, regimen: "MYPE" as const },
    { razonSocial: "A & D INMOBILIARIA DEL CENTRO S.A.C.", ruc: "20665432109", tipoPersona: "JURIDICA" as const, regimen: "REG" as const },
    { razonSocial: "MARINA DE MIRANDA JUAN", ruc: "10498765432", tipoPersona: "NATURAL" as const, regimen: "MYPE" as const },
  ];

  const personaIds: string[] = [];
  for (let i = 0; i < empresas.length; i++) {
    const contadorId = contadorIds[i % contadorIds.length]!;
    const persona = await prisma.persona.upsert({
      where: { ruc: empresas[i]!.ruc },
      update: {},
      create: {
        ...empresas[i]!,
        contadorAsignadoId: contadorId,
        estado: "ACTIVO",
        tipoContabilidad: "COMPUTARIZADA",
      },
    });
    personaIds.push(persona.id);
  }
  console.log(`✓ ${empresas.length} clientes creados`);

  // Get tipo servicio "Declaración mensual"
  const tipoMensual = await prisma.tipoServicio.findUnique({ where: { nombre: "Declaración mensual" } });
  const tipoAnual = await prisma.tipoServicio.findUnique({ where: { nombre: "Declaración anual" } });
  if (!tipoMensual || !tipoAnual) throw new Error("TipoServicio not found");

  // Servicios for Marzo 2026 — spread across Kanban columns
  const estadosTrabajo = ["POR_DECLARAR", "POR_DECLARAR", "POR_DECLARAR", "DECLARADO", "DECLARADO", "DECLARADO", "POR_COBRAR", "POR_COBRAR", "POR_COBRAR", "COBRADO", "COBRADO", "COBRADO", "POR_COBRAR", "DECLARADO", "POR_DECLARAR"] as const;
  const honorariosBase = [10000, 30000, 50000, 80000, 100000, 15000, 25000, 40000, 60000, 10000, 20000, 35000, 45000, 55000, 12000];
  const cobradoBase =    [0,     0,     0,     0,     0,      0,     0,     15000, 0,     10000, 20000, 35000, 20000, 0,     0];

  for (let i = 0; i < personaIds.length; i++) {
    const contadorId = contadorIds[i % contadorIds.length]!;
    const honorarios = honorariosBase[i]!;
    const montoCobrado = cobradoBase[i]!;
    const baseImp = Math.round(honorarios * 5.5);
    const igv = Math.round(baseImp * 0.18);
    const precioFinal = honorarios;
    const montoRestante = Math.max(0, precioFinal - montoCobrado);
    const estadoCobranza = montoCobrado >= precioFinal ? "COBRADO" : montoCobrado > 0 ? "PARCIAL" : "PENDIENTE";

    await prisma.servicio.create({
      data: {
        personaId: personaIds[i]!,
        tipoServicioId: tipoMensual.id,
        contadorId,
        periodo: "2026-03",
        baseImponible: baseImp,
        igv,
        noGravado: 0,
        totalImponible: baseImp + igv,
        honorarios,
        descuento: 0,
        precioFinal,
        montoCobrado,
        montoRestante,
        estadoCobranza: estadoCobranza as any,
        estadoTrabajo: estadosTrabajo[i]! as any,
        estado: "ACTIVO",
      },
    });
  }
  console.log(`✓ ${personaIds.length} servicios de Marzo 2026 creados`);

  // Some servicios for Febrero 2026 (all COBRADO)
  for (let i = 0; i < 8; i++) {
    const contadorId = contadorIds[i % contadorIds.length]!;
    const honorarios = honorariosBase[i]!;
    await prisma.servicio.create({
      data: {
        personaId: personaIds[i]!,
        tipoServicioId: tipoMensual.id,
        contadorId,
        periodo: "2026-02",
        baseImponible: Math.round(honorarios * 5.5),
        igv: Math.round(Math.round(honorarios * 5.5) * 0.18),
        noGravado: 0,
        totalImponible: Math.round(honorarios * 5.5) + Math.round(Math.round(honorarios * 5.5) * 0.18),
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
  }
  console.log("✓ 8 servicios de Febrero 2026 (cobrados)");

  // Leads
  const leads = [
    { nombre: "Carlos", apellido: "Mendoza Quispe", celular: "987654321", regimen: "MYPE" as const, rubro: "Servicios y Constructoras Pequeñas", estado: "NUEVO" as const },
    { nombre: "María", apellido: "Sánchez Torres", celular: "976543210", regimen: "RER" as const, rubro: "Transportes A: Propia Mercadería", estado: "CONTACTADO" as const },
    { nombre: "José", apellido: "Huamán López", celular: "965432109", regimen: "MYPE" as const, rubro: "Inmuebles Lotes", estado: "COTIZADO" as const },
  ];

  for (const lead of leads) {
    await prisma.lead.create({ data: lead });
  }
  console.log(`✓ ${leads.length} leads creados`);

  // Incidencias
  const incidencias = [
    { titulo: "Pendiente pago AFP Enero", descripcion: "El cliente debe AFP de Enero por S/. 434.63", prioridad: "ALTA" as const, periodo: "2026-03" },
    { titulo: "Facturas pendientes de entrega", descripcion: "Faltan facturas físicas de Febrero para la declaración", prioridad: "MEDIA" as const, periodo: "2026-03" },
    { titulo: "Domicilio fiscal incorrecto", descripcion: "La dirección registrada en SUNAT no coincide con la actual", prioridad: "BAJA" as const, periodo: "2026-03" },
  ];

  for (let i = 0; i < incidencias.length; i++) {
    await prisma.incidencia.create({
      data: {
        ...incidencias[i]!,
        personaId: personaIds[i]!,
        contadorId: contadorIds[i % contadorIds.length]!,
        estado: "ABIERTA",
      },
    });
  }
  console.log(`✓ ${incidencias.length} incidencias creadas`);

  // Finanzas (some payments for Marzo)
  const bcpCuenta = await prisma.cuentaBancaria.findFirst({ where: { nombre: "BCP Corriente" } });
  const efectivo = await prisma.cuentaBancaria.findFirst({ where: { nombre: "Efectivo" } });
  const admin = await prisma.user.findUnique({ where: { email: "admin@sheila.pe" } });

  if (bcpCuenta && efectivo && admin) {
    await prisma.finanza.createMany({
      data: [
        { tipo: "INGRESO", monto: 10000, fecha: new Date("2026-03-15"), concepto: "Cobro MACHA AQUINO", cuentaId: bcpCuenta.id, creadoPorId: admin.id },
        { tipo: "INGRESO", monto: 20000, fecha: new Date("2026-03-20"), concepto: "Cobro HUARINGA ALIAGA", cuentaId: efectivo.id, creadoPorId: admin.id },
        { tipo: "INGRESO", monto: 35000, fecha: new Date("2026-03-25"), concepto: "Cobro SECCE PEDRAZA", cuentaId: bcpCuenta.id, creadoPorId: admin.id },
        { tipo: "EGRESO", monto: 15000, fecha: new Date("2026-03-10"), concepto: "Pago luz oficina", categoriaGasto: "Servicios Públicos", cuentaId: efectivo.id, creadoPorId: admin.id },
        { tipo: "EGRESO", monto: 8000, fecha: new Date("2026-03-12"), concepto: "Pasaje Zulma trámites", categoriaGasto: "Transporte", cuentaId: efectivo.id, creadoPorId: admin.id },
      ],
    });
    console.log("✓ 5 transacciones financieras creadas");
  }

  console.log("\n🎉 Seed completado con datos de demostración.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
