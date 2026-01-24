const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const BRAND_BUCKET = process.env.SUPABASE_BRAND_BUCKET || 'brand-logos';

export const normalizeBrandLogoUrl = (logoUrl?: string | null) => {
  if (!logoUrl) return null;
  const trimmed = logoUrl.trim();
  if (!trimmed) return null;

  if (/^https?:\/\//i.test(trimmed)) {
    if (SUPABASE_URL && trimmed.includes('/storage/v1/object/public/')) {
      const [, path] = trimmed.split('/storage/v1/object/public/');
      if (path && !trimmed.startsWith(SUPABASE_URL)) {
        return `${SUPABASE_URL}/storage/v1/object/public/${path}`;
      }
    }
    return trimmed;
  }

  const path = trimmed.startsWith(`${BRAND_BUCKET}/`)
    ? trimmed.slice(BRAND_BUCKET.length + 1)
    : trimmed;
  if (!SUPABASE_URL) return trimmed;
  return `${SUPABASE_URL}/storage/v1/object/public/${BRAND_BUCKET}/${path}`;
};
