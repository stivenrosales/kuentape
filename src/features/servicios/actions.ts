"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { authorizeAction, scopedWhere } from "@/lib/auth-guard";
import { computeServicioPricing, computeHonorarios } from "./lib/pricing";
import {
  createServicioSchema,
  updateServicioSchema,
  registrarCobroSchema,
  createTipoServicioSchema,
  updateTipoServicioSchema,
} from "./schemas";
import type {
  CreateServicioInput,
  UpdateServicioInput,
  RegistrarCobroInput,
  CreateTipoServicioInput,
  UpdateTipoServicioInput,
} from "./schemas";

// Meses para Declaración Anual: 1-12 (meses del año) + 13 (DAOT) + 14 (AP)
const DA_MESES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14];

export async function createServicioAction(data: CreateServicioInput) {
  const session = await authorizeAction(["GERENCIA", "ADMINISTRADOR", "CONTADOR"]);
  const userId = (session.user as any).id as string;

  const parsed = createServicioSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  const {
    personaId,
    tipoServicioId,
    contadorId,
    periodo,
    baseImponible = 0,
    noGravado = 0,
    descuento = 0,
    notas,
  } = parsed.data;

  // Fetch persona + tipo for auto-pricing
  const [persona, tipoServicio] = await Promise.all([
    prisma.persona.findUnique({ where: { id: personaId }, select: { tipoPersona: true, regimen: true } }),
    prisma.tipoServicio.findUnique({ where: { id: tipoServicioId }, select: { categoria: true } }),
  ]);

  // Auto-calculate honorarios
  let honorarios = parsed.data.honorarios ?? 0;
  if (honorarios === 0 && persona && tipoServicio) {
    const auto = computeHonorarios({
      categoriaServicio: tipoServicio.categoria,
      tipoPersona: persona.tipoPersona,
      regimen: persona.regimen,
      baseImponible,
      noGravado,
      tieneContrato: false,
    });
    if (auto > 0) honorarios = auto;
  }

  const pricing = computeServicioPricing({
    baseImponible,
    noGravado,
    honorarios,
    descuento,
    montoCobrado: 0,
  });

  const servicio = await prisma.servicio.create({
    data: {
      personaId,
      tipoServicioId,
      contadorId,
      periodo: periodo || null,
      baseImponible,
      igv: pricing.igv,
      noGravado,
      totalImponible: pricing.totalImponible,
      honorarios,
      descuento,
      precioFinal: pricing.precioFinal,
      montoCobrado: 0,
      montoRestante: pricing.montoRestante,
      estadoCobranza: pricing.estadoCobranza,
      notas: notas || null,
    },
  });

  // Si es ANUAL, crear los 14 registros de DeclaracionAnualDetalle
  if (tipoServicio?.categoria === "ANUAL") {
    await prisma.declaracionAnualDetalle.createMany({
      data: DA_MESES.map((mes) => ({
        servicioId: servicio.id,
        mes,
        completado: false,
      })),
    });
  }

  await prisma.auditLog.create({
    data: {
      userId,
      accion: "SERVICIO_CREATED",
      entidad: "Servicio",
      entidadId: servicio.id,
      metadata: { personaId, tipoServicioId, honorarios, periodo },
    },
  });

  revalidatePath("/servicios");
  return { success: true, id: servicio.id };
}

export async function updateServicioAction(
  id: string,
  data: UpdateServicioInput,
) {
  const session = await authorizeAction(["GERENCIA", "ADMINISTRADOR", "CONTADOR"]);
  const role = (session.user as any).role as string;
  const userId = (session.user as any).id as string;

  // For partial updates from the dialog, we accept any fields
  const inputData = data as Record<string, any>;

  const baseWhere = { id };
  const where = scopedWhere(baseWhere, role, userId);

  const servicio = await prisma.servicio.findFirst({
    where,
    include: {
      persona: { select: { tipoPersona: true, regimen: true } },
      tipoServicio: { select: { categoria: true } },
    },
  });
  if (!servicio) {
    return { error: "Servicio no encontrado o sin permiso" };
  }

  // Merge with existing values — only override what was sent
  const baseImponible = inputData.baseImponible ?? servicio.baseImponible;
  const noGravado = inputData.noGravado ?? servicio.noGravado;
  const descuento = inputData.descuento ?? servicio.descuento;

  // Auto-calculate honorarios from business rules
  let honorarios: number;
  if (inputData.honorarios !== undefined) {
    honorarios = inputData.honorarios;
  } else {
    const autoHonorarios = computeHonorarios({
      categoriaServicio: servicio.tipoServicio.categoria,
      tipoPersona: servicio.persona.tipoPersona,
      regimen: servicio.persona.regimen,
      baseImponible,
      noGravado,
      tieneContrato: false,
    });
    honorarios = autoHonorarios > 0 ? autoHonorarios : servicio.honorarios;
  }

  const pricing = computeServicioPricing({
    baseImponible,
    noGravado,
    honorarios,
    descuento,
    montoCobrado: servicio.montoCobrado,
  });

  const updateData: Record<string, any> = {
    baseImponible,
    igv: pricing.igv,
    noGravado,
    totalImponible: pricing.totalImponible,
    honorarios,
    descuento,
    precioFinal: pricing.precioFinal,
    montoRestante: pricing.montoRestante,
    estadoCobranza: pricing.estadoCobranza,
  };

  // Only update these if explicitly provided
  if (inputData.personaId !== undefined) updateData.personaId = inputData.personaId;
  if (inputData.tipoServicioId !== undefined) updateData.tipoServicioId = inputData.tipoServicioId;
  if (inputData.contadorId !== undefined) updateData.contadorId = inputData.contadorId;
  if (inputData.periodo !== undefined) updateData.periodo = inputData.periodo || null;
  if (inputData.notas !== undefined) updateData.notas = inputData.notas || null;

  await prisma.servicio.update({
    where: { id },
    data: updateData,
  });

  await prisma.auditLog.create({
    data: {
      userId,
      accion: "SERVICIO_UPDATED",
      entidad: "Servicio",
      entidadId: id,
      metadata: inputData,
    },
  });

  revalidatePath("/servicios");
  revalidatePath(`/servicios/${id}`);
  return { success: true };
}

export async function archivarServicioAction(id: string) {
  const session = await authorizeAction(["GERENCIA"]);
  const userId = (session.user as any).id as string;

  const servicio = await prisma.servicio.findUnique({ where: { id } });
  if (!servicio) return { error: "Servicio no encontrado" };

  await prisma.servicio.update({
    where: { id },
    data: {
      estado: "ARCHIVADO",
      estadoCobranza: "INCOBRABLE",
    },
  });

  await prisma.auditLog.create({
    data: {
      userId,
      accion: "SERVICIO_ARCHIVADO",
      entidad: "Servicio",
      entidadId: id,
      metadata: { estadoAnterior: servicio.estado },
    },
  });

  revalidatePath("/servicios");
  revalidatePath(`/servicios/${id}`);
  return { success: true };
}

export async function desarchivarServicioAction(id: string) {
  const session = await authorizeAction(["GERENCIA"]);
  const userId = (session.user as any).id as string;

  const servicio = await prisma.servicio.findUnique({ where: { id } });
  if (!servicio) return { error: "Servicio no encontrado" };

  const pricing = computeServicioPricing({
    baseImponible: servicio.baseImponible,
    noGravado: servicio.noGravado,
    honorarios: servicio.honorarios,
    descuento: servicio.descuento,
    montoCobrado: servicio.montoCobrado,
  });

  await prisma.servicio.update({
    where: { id },
    data: {
      estado: "ACTIVO",
      estadoCobranza: pricing.estadoCobranza,
    },
  });

  await prisma.auditLog.create({
    data: {
      userId,
      accion: "SERVICIO_DESARCHIVADO",
      entidad: "Servicio",
      entidadId: id,
      metadata: { nuevoEstadoCobranza: pricing.estadoCobranza },
    },
  });

  revalidatePath("/servicios");
  revalidatePath("/servicios/archivados");
  revalidatePath(`/servicios/${id}`);
  return { success: true };
}

export async function updateDeclaracionAnualAction(
  servicioId: string,
  mes: number,
  completado: boolean,
) {
  const session = await authorizeAction(["GERENCIA", "ADMINISTRADOR", "CONTADOR"]);
  const userId = (session.user as any).id as string;

  await prisma.declaracionAnualDetalle.update({
    where: { servicioId_mes: { servicioId, mes } },
    data: { completado },
  });

  revalidatePath(`/servicios/${servicioId}`);
  return { success: true };
}

export async function registrarCobroAction(
  servicioId: string,
  data: RegistrarCobroInput,
) {
  const session = await authorizeAction(["GERENCIA", "ADMINISTRADOR", "CONTADOR"]);
  const userId = (session.user as any).id as string;

  const parsed = registrarCobroSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  const servicio = await prisma.servicio.findUnique({
    where: { id: servicioId },
  });
  if (!servicio) return { error: "Servicio no encontrado" };

  const { monto, cuentaId, fecha, concepto, numeroOperacion, comprobanteUrl } =
    parsed.data;

  // Validate: cobro cannot exceed saldo pendiente
  const saldoPendiente = servicio.precioFinal - servicio.montoCobrado;
  if (monto > saldoPendiente) {
    return {
      error: `El monto excede el saldo pendiente (S/. ${saldoPendiente.toFixed(2)} restante)`,
    };
  }

  // Atomic increment to prevent race conditions
  const updated = await prisma.$transaction(async (tx) => {
    await tx.finanza.create({
      data: {
        tipo: "INGRESO",
        monto,
        fecha,
        concepto,
        numeroOperacion: numeroOperacion || null,
        cuentaId,
        servicioId,
        comprobanteUrl: comprobanteUrl || null,
        creadoPorId: userId,
      },
    });

    const updatedServicio = await tx.servicio.update({
      where: { id: servicioId },
      data: { montoCobrado: { increment: monto } },
    });

    const pricing = computeServicioPricing({
      baseImponible: updatedServicio.baseImponible,
      noGravado: updatedServicio.noGravado,
      honorarios: updatedServicio.honorarios,
      descuento: updatedServicio.descuento,
      montoCobrado: updatedServicio.montoCobrado,
    });

    return tx.servicio.update({
      where: { id: servicioId },
      data: {
        montoRestante: pricing.montoRestante,
        estadoCobranza: pricing.estadoCobranza,
      },
    });
  });

  await prisma.auditLog.create({
    data: {
      userId,
      accion: "COBRO_REGISTRADO",
      entidad: "Servicio",
      entidadId: servicioId,
      metadata: {
        monto,
        nuevoMontoCobrado: updated.montoCobrado,
        estadoCobranza: updated.estadoCobranza,
      },
    },
  });

  revalidatePath("/servicios");
  revalidatePath(`/servicios/${servicioId}`);
  return { success: true };
}

// --- TipoServicio CRUD ---

export async function createTipoServicioAction(data: CreateTipoServicioInput) {
  await authorizeAction(["GERENCIA"]);

  const parsed = createTipoServicioSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  const existing = await prisma.tipoServicio.findUnique({
    where: { nombre: parsed.data.nombre },
  });
  if (existing) {
    return { error: { nombre: ["Ya existe un tipo de servicio con ese nombre"] } };
  }

  const tipo = await prisma.tipoServicio.create({ data: parsed.data });

  revalidatePath("/configuracion/tipos-servicio");
  return { success: true, id: tipo.id };
}

export async function updateTipoServicioAction(
  id: string,
  data: UpdateTipoServicioInput,
) {
  await authorizeAction(["GERENCIA"]);

  const parsed = updateTipoServicioSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  const tipo = await prisma.tipoServicio.findUnique({ where: { id } });
  if (!tipo) return { error: "Tipo de servicio no encontrado" };

  if (parsed.data.nombre && parsed.data.nombre !== tipo.nombre) {
    const existing = await prisma.tipoServicio.findUnique({
      where: { nombre: parsed.data.nombre },
    });
    if (existing) {
      return { error: { nombre: ["Ya existe un tipo de servicio con ese nombre"] } };
    }
  }

  await prisma.tipoServicio.update({ where: { id }, data: parsed.data });

  revalidatePath("/configuracion/tipos-servicio");
  return { success: true };
}

export async function toggleTipoServicioActivoAction(
  id: string,
  activo: boolean,
) {
  await authorizeAction(["GERENCIA"]);

  await prisma.tipoServicio.update({ where: { id }, data: { activo } });

  revalidatePath("/configuracion/tipos-servicio");
  return { success: true };
}
