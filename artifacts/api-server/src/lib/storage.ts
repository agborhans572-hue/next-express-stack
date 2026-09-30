import { randomUUID } from "node:crypto";
import {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
  HeadObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const allowedTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
]);
export const MAX_POD_FILE_SIZE = 10 * 1024 * 1024;

export function validateVercelR2Environment(env: NodeJS.ProcessEnv): void {
  if (!env.VERCEL) return;
  let endpoint: URL;
  try {
    endpoint = new URL(env.S3_ENDPOINT ?? "");
  } catch {
    throw new Error("S3_ENDPOINT must be a valid HTTPS URL.");
  }
  if (
    endpoint.protocol !== "https:" ||
    !endpoint.hostname.endsWith(".r2.cloudflarestorage.com")
  )
    throw new Error(
      "Vercel S3_ENDPOINT must use the Cloudflare R2 HTTPS endpoint.",
    );
  if (env.S3_REGION !== "auto")
    throw new Error("Cloudflare R2 requires S3_REGION=auto.");
  if (env.S3_FORCE_PATH_STYLE !== "false")
    throw new Error("Cloudflare R2 requires S3_FORCE_PATH_STYLE=false.");
}

function bucket(): string {
  if (!process.env.S3_BUCKET) throw new Error("S3_BUCKET is not configured");
  return process.env.S3_BUCKET;
}
function client(): S3Client {
  return new S3Client({
    region: process.env.S3_REGION ?? "auto",
    endpoint: process.env.S3_ENDPOINT,
    forcePathStyle: process.env.S3_FORCE_PATH_STYLE === "true",
    credentials:
      process.env.S3_ACCESS_KEY_ID && process.env.S3_SECRET_ACCESS_KEY
        ? {
            accessKeyId: process.env.S3_ACCESS_KEY_ID,
            secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
          }
        : undefined,
  });
}

export function validatePodFile(contentType: string, size: number): void {
  if (!allowedTypes.has(contentType))
    throw new Error("Only PDF, JPEG, PNG, and WebP proof files are supported.");
  if (!Number.isInteger(size) || size < 1 || size > MAX_POD_FILE_SIZE)
    throw new Error("Proof files must be between 1 byte and 10 MB.");
}

export async function createPodUpload(
  shipmentId: number,
  fileName: string,
  contentType: string,
  size: number,
) {
  validatePodFile(contentType, size);
  const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-120);
  const objectKey = `pod/${shipmentId}/${randomUUID()}-${safeName}`;
  const command = new PutObjectCommand({
    Bucket: bucket(),
    Key: objectKey,
    ContentType: contentType,
    ContentLength: size,
    Metadata: { shipmentId: String(shipmentId) },
  });
  return {
    objectKey,
    uploadUrl: await getSignedUrl(client(), command, { expiresIn: 300 }),
    expiresIn: 300,
  };
}

export async function assertStoredObject(objectKey: string): Promise<void> {
  await client().send(
    new HeadObjectCommand({ Bucket: bucket(), Key: objectKey }),
  );
}
export async function createPodDownload(objectKey: string): Promise<string> {
  return getSignedUrl(
    client(),
    new GetObjectCommand({ Bucket: bucket(), Key: objectKey }),
    { expiresIn: 300 },
  );
}
