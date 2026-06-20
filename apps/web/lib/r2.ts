import { S3Client, GetObjectCommand, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const R2_BUCKET = process.env.R2_BUCKET_NAME ?? 'moreofless-media';
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL ?? '';

function getR2Client() {
  return new S3Client({
    region: 'auto',
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
  });
}

export function buildR2Key(userId: string, projectId: string, filename: string): string {
  const safe = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
  return `${userId}/${projectId}/${Date.now()}_${safe}`;
}

/** Generate a presigned URL for uploading directly from the browser */
export async function getUploadUrl(r2Key: string, mimeType: string, expiresIn = 300): Promise<string> {
  const client = getR2Client();
  return getSignedUrl(
    client,
    new PutObjectCommand({ Bucket: R2_BUCKET, Key: r2Key, ContentType: mimeType }),
    { expiresIn }
  );
}

/** Generate a presigned URL for downloading */
export async function getDownloadUrl(r2Key: string, expiresIn = 3600): Promise<string> {
  if (R2_PUBLIC_URL) {
    return `${R2_PUBLIC_URL}/${r2Key}`;
  }
  const client = getR2Client();
  return getSignedUrl(
    client,
    new GetObjectCommand({ Bucket: R2_BUCKET, Key: r2Key }),
    { expiresIn }
  );
}

export async function deleteObject(r2Key: string): Promise<void> {
  const client = getR2Client();
  await client.send(new DeleteObjectCommand({ Bucket: R2_BUCKET, Key: r2Key }));
}
