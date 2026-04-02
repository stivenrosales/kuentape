import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

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

  console.log("Seed completado.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
