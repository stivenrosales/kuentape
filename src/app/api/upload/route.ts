import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { uploadToR2, getSignedR2Url } from "@/lib/r2";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const folder = (formData.get("folder") as string) || "comprobantes";

  if (!file) {
    return NextResponse.json({ error: "No se envió archivo" }, { status: 400 });
  }

  // Validate
  const maxSize = 5 * 1024 * 1024; // 5MB
  if (file.size > maxSize) {
    return NextResponse.json({ error: "El archivo es demasiado grande (máx 5MB)" }, { status: 400 });
  }

  const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif", "application/pdf"];
  if (!allowedTypes.includes(file.type)) {
    return NextResponse.json({ error: "Tipo de archivo no permitido" }, { status: 400 });
  }

  // Generate unique key
  const ext = file.name.split(".").pop() || "jpg";
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const key = `${folder}/${timestamp}-${random}.${ext}`;

  // Upload to R2
  const buffer = Buffer.from(await file.arrayBuffer());
  const storageKey = await uploadToR2(key, buffer, file.type);

  // Generate a signed URL for immediate display
  const signedUrl = await getSignedR2Url(storageKey, 86400); // 24h

  return NextResponse.json({ url: signedUrl, key: storageKey });
}
