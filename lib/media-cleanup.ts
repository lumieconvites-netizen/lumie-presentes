import { DeleteObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export type AssetDeleteResult = {
  attempted: number;
  deleted: number;
  failed: number;
  errors: string[];
};

function getR2Client() {
  const accountId = process.env.CLOUDFLARE_R2_ACCOUNT_ID;
  const accessKeyId = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY;
  if (!accountId || !accessKeyId || !secretAccessKey) return null;

  return new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
  });
}

export async function deleteAssetByUrl(url: string, r2Client: S3Client | null) {
  const r2Base = process.env.CLOUDFLARE_R2_PUBLIC_BASE_URL?.replace(/\/+$/, "");
  const r2Bucket = process.env.CLOUDFLARE_R2_BUCKET;

  if (r2Client && r2Base && r2Bucket && url.startsWith(`${r2Base}/`)) {
    const key = url.slice(r2Base.length + 1);
    if (!key) return;
    await r2Client.send(new DeleteObjectCommand({ Bucket: r2Bucket, Key: key }));
    return;
  }

  const supabaseBase = process.env.SUPABASE_URL?.replace(/\/+$/, "");
  const prefix = supabaseBase ? `${supabaseBase}/storage/v1/object/public/` : null;
  if (prefix && url.startsWith(prefix)) {
    if (!supabaseAdmin) return;
    const rest = url.slice(prefix.length);
    const slashIndex = rest.indexOf("/");
    if (slashIndex <= 0) return;
    const bucket = rest.slice(0, slashIndex);
    const path = rest.slice(slashIndex + 1);
    if (!bucket || !path) return;
    const { error } = await supabaseAdmin.storage.from(bucket).remove([path]);
    if (error && !`${error.message}`.toLowerCase().includes("not found")) {
      throw error;
    }
  }
}

export async function deleteAssets(urls: string[]): Promise<AssetDeleteResult> {
  const r2Client = getR2Client();
  const result: AssetDeleteResult = { attempted: 0, deleted: 0, failed: 0, errors: [] };

  for (const url of urls) {
    result.attempted += 1;
    try {
      await deleteAssetByUrl(url, r2Client);
      result.deleted += 1;
    } catch (error) {
      result.failed += 1;
      result.errors.push(`${url} => ${error instanceof Error ? error.message : "unknown error"}`);
    }
  }

  return result;
}
