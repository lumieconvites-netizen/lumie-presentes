function normalize(value: string | null | undefined) {
  return (value || "").trim();
}

export function isLegacySupabaseStorageUrl(value: string | null | undefined) {
  const url = normalize(value);
  if (!url) return false;

  const supabaseBase = process.env.SUPABASE_URL?.replace(/\/+$/, "");
  const currentProjectPrefix = supabaseBase ? `${supabaseBase}/storage/v1/object/public/` : null;
  if (currentProjectPrefix && url.startsWith(currentProjectPrefix)) return true;

  return /^https:\/\/[^/]*supabase\.co\/storage\/v1\/object\/public\//i.test(url);
}

export function getLegacyStorageRejectMessage(fieldLabel: string) {
  return `${fieldLabel} com URL legado do Supabase Storage nao e aceito. Reenvie o arquivo pelo upload atual (R2).`;
}
