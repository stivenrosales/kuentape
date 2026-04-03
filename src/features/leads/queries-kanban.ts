import { prisma } from "@/lib/prisma";
import type { EstadoLead } from "@prisma/client";

export interface LeadKanbanCard {
  id: string;
  nombre: string;
  apellido: string;
  dni: string | null;
  celular: string;
  email: string | null;
  regimen: string | null;
  rubro: string | null;
  numTrabajadores: number | null;
  estado: string;
  notas: string | null;
  createdAt: Date;
  asignadoA: { id: string; nombre: string; apellido: string } | null;
  convertidoA: { id: string; razonSocial: string } | null;
}

export type LeadsByEstado = Record<string, LeadKanbanCard[]>;

const ESTADOS_ORDER: EstadoLead[] = [
  "NUEVO",
  "CONTACTADO",
  "COTIZADO",
  "CONVERTIDO",
  "PERDIDO",
];

const CAPPED_ESTADOS: EstadoLead[] = ["CONVERTIDO", "PERDIDO"];
const CAP_LIMIT = 10;

export async function getLeadsKanban(): Promise<LeadsByEstado> {
  const result: LeadsByEstado = {
    NUEVO: [],
    CONTACTADO: [],
    COTIZADO: [],
    CONVERTIDO: [],
    PERDIDO: [],
  };

  // Fetch active states without cap
  const activeLeads = await prisma.lead.findMany({
    where: { estado: { in: ["NUEVO", "CONTACTADO", "COTIZADO"] } },
    select: {
      id: true,
      nombre: true,
      apellido: true,
      dni: true,
      celular: true,
      email: true,
      regimen: true,
      rubro: true,
      numTrabajadores: true,
      estado: true,
      notas: true,
      createdAt: true,
      asignadoA: { select: { id: true, nombre: true, apellido: true } },
      convertidoA: { select: { id: true, razonSocial: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  for (const lead of activeLeads) {
    result[lead.estado].push(lead as LeadKanbanCard);
  }

  // Fetch capped states (only last N)
  for (const estado of CAPPED_ESTADOS) {
    const leads = await prisma.lead.findMany({
      where: { estado },
      select: {
        id: true,
        nombre: true,
        apellido: true,
        dni: true,
        celular: true,
        email: true,
        regimen: true,
        rubro: true,
        numTrabajadores: true,
        estado: true,
        notas: true,
        createdAt: true,
        asignadoA: { select: { id: true, nombre: true, apellido: true } },
        convertidoA: { select: { id: true, razonSocial: true } },
      },
      orderBy: { createdAt: "desc" },
      take: CAP_LIMIT,
    });
    result[estado] = leads as LeadKanbanCard[];
  }

  return result;
}

export async function getLeadKanbanStats(): Promise<Record<string, number>> {
  const counts = await prisma.lead.groupBy({
    by: ["estado"],
    _count: { _all: true },
  });

  const result: Record<string, number> = {
    NUEVO: 0,
    CONTACTADO: 0,
    COTIZADO: 0,
    CONVERTIDO: 0,
    PERDIDO: 0,
  };

  for (const row of counts) {
    result[row.estado] = row._count._all;
  }

  return result;
}
