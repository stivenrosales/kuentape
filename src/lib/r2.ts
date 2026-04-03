import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export const r2Client = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

export const R2_BUCKET = process.env.R2_BUCKET_NAME!;

/**
 * Upload a file buffer to R2
 * Returns the storage key (not URL — we generate signed URLs on read)
 */
export async function uploadToR2(
  key: string,
  body: Buffer,
  contentType: string
): Promise<string> {
  await r2Client.send(
    new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: key,
      Body: body,
      ContentType: contentType,
    })
  );

  // Return the key, not the URL — we'll generate signed URLs when needed
  return key;
}

/**
 * Get a signed URL for private access (if bucket is not public)
 */
export async function getSignedR2Url(key: string, expiresIn = 3600): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: R2_BUCKET,
    Key: key,
  });
  return getSignedUrl(r2Client, command, { expiresIn });
}
