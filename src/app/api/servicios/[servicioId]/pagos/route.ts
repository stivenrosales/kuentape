import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getSignedR2Url } from "@/lib/r2";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ servicioId: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json([], { status: 401 });
  }

  const { servicioId } = await params;

  const pagos = await prisma.finanza.findMany({
    where: {
      servicioId,
      tipo: "INGRESO",
    },
    include: {
      cuenta: {
        select: { id: true, nombre: true },
      },
    },
    orderBy: { fecha: "desc" },
  });

  // Generate signed URLs for comprobantes stored in R2
  const pagosConUrls = await Promise.all(
    pagos.map(async (pago) => {
      if (pago.comprobanteUrl && !pago.comprobanteUrl.startsWith("http") && !pago.comprobanteUrl.startsWith("data:")) {
        // It's an R2 key — generate signed URL
        try {
          const signedUrl = await getSignedR2Url(pago.comprobanteUrl, 3600);
          return { ...pago, comprobanteUrl: signedUrl };
        } catch {
          return pago;
        }
      }
      return pago;
    })
  );

  return NextResponse.json(pagosConUrls);
}
