import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Tipos de libro que se generan automáticamente cada mes
const TIPOS_LIBRO_ACTIVOS = [
  "Libro Diario Formato Simplificado",
  "Libro Mayor",
  "Libro Diario",
  "Libro de Inventarios y Balances",
  "Libro Caja y Bancos",
];

/**
 * POST /api/cron/generar-libros
 *
 * Genera libros contables para todas las personas activas.
 * Se puede llamar:
 * - Via Vercel Cron (1ro de cada mes)
 * - Manualmente desde /configuracion o un botón admin
 *
 * Query params:
 * - mes: number (1-12, default: mes actual)
 * - anio: number (default: año actual)
 * - secret: string (para proteger el endpoint del cron)
 */
export async function POST(req: NextRequest) {
  // Auth: accept either session or cron secret
  const cronSecret = req.nextUrl.searchParams.get("secret");
  const expectedSecret = process.env.CRON_SECRET;

  if (expectedSecret && cronSecret !== expectedSecret) {
    // Try session auth
    const { auth } = await import("@/auth");
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    const role = (session.user as any).role;
    if (role !== "GERENCIA" && role !== "ADMINISTRADOR") {
      return NextResponse.json({ error: "Solo admin puede generar libros" }, { status: 403 });
    }
  }

  // Determine mes/año
  const now = new Date();
  const mesParam = req.nextUrl.searchParams.get("mes");
  const anioParam = req.nextUrl.searchParams.get("anio");
  const mes = mesParam ? parseInt(mesParam) : now.getMonth() + 1; // 1-based
  const anio = anioParam ? parseInt(anioParam) : now.getFullYear();

  if (mes < 1 || mes > 12) {
    return NextResponse.json({ error: "Mes inválido" }, { status: 400 });
  }

  // Get all active personas
  const personas = await prisma.persona.findMany({
    where: { estado: "ACTIVO" },
    select: { id: true, razonSocial: true },
  });

  if (personas.length === 0) {
    return NextResponse.json({ message: "No hay personas activas", created: 0 });
  }

  // Get existing libros for this month to avoid duplicates
  const existingLibros = await prisma.libro.findMany({
    where: { anio, mes },
    select: { personaId: true, tipoLibro: true },
  });

  const existingSet = new Set(
    existingLibros.map((l) => `${l.personaId}|${l.tipoLibro}`)
  );

  // Build batch of new libros
  const nuevosLibros: {
    personaId: string;
    tipoLibro: string;
    anio: number;
    mes: number;
    completado: boolean;
  }[] = [];

  for (const persona of personas) {
    for (const tipo of TIPOS_LIBRO_ACTIVOS) {
      const key = `${persona.id}|${tipo}`;
      if (!existingSet.has(key)) {
        nuevosLibros.push({
          personaId: persona.id,
          tipoLibro: tipo,
          anio,
          mes,
          completado: false,
        });
      }
    }
  }

  if (nuevosLibros.length === 0) {
    return NextResponse.json({
      message: `Todos los libros de ${mes}/${anio} ya existen`,
      created: 0,
      personas: personas.length,
      tipos: TIPOS_LIBRO_ACTIVOS.length,
    });
  }

  // Create in batch
  const result = await prisma.libro.createMany({
    data: nuevosLibros,
    skipDuplicates: true,
  });

  return NextResponse.json({
    message: `Libros generados para ${mes}/${anio}`,
    created: result.count,
    personas: personas.length,
    tipos: TIPOS_LIBRO_ACTIVOS.length,
    skipped: nuevosLibros.length - result.count,
  });
}

// Also support GET for Vercel Cron (which sends GET by default)
export async function GET(req: NextRequest) {
  return POST(req);
}
