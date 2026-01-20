import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/db/server';

const BUCKET = process.env.SUPABASE_BRAND_BUCKET || 'brand-logos';

const ensureBucket = async (supabaseAdmin: ReturnType<typeof getSupabaseAdmin>) => {
  if (!supabaseAdmin) return;
  const { error } = await supabaseAdmin.storage.createBucket(BUCKET, { public: true });
  if (error && !error.message.toLowerCase().includes('already exists')) {
    throw new Error(error.message);
  }
};

const uploadLogo = async (supabaseAdmin: ReturnType<typeof getSupabaseAdmin>, file: File) => {
  if (!supabaseAdmin) return null;
  await ensureBucket(supabaseAdmin);

  const arrayBuffer = await file.arrayBuffer();
  const ext = file.name?.split('.').pop() || 'png';
  const fileName = `brand-${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const filePath = `logos/${fileName}`;

  const { error } = await supabaseAdmin.storage
    .from(BUCKET)
    .upload(filePath, Buffer.from(arrayBuffer), {
      contentType: file.type || 'image/png',
      upsert: true,
    });

  if (error) {
    throw new Error(error.message);
  }

  const { data } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(filePath);
  return data.publicUrl;
};

export async function GET() {
  const supabaseAdmin = getSupabaseAdmin();
  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
  }

  const { data, error } = await supabaseAdmin
    .from('brands')
    .select('id,name,category,logo_url,official_url,is_active')
    .order('name', { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data || []);
}

export async function POST(request: Request) {
  const supabaseAdmin = getSupabaseAdmin();
  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
  }

  const contentType = request.headers.get('content-type') || '';
  let payload: any = null;
  let logoUrl: string | null = null;

  if (contentType.includes('multipart/form-data')) {
    const form = await request.formData();
    payload = {
      name: form.get('name')?.toString() || '',
      category: form.get('category')?.toString() || '',
      official_url: form.get('official_url')?.toString() || '',
      is_active: form.get('is_active')?.toString() || '',
    };
    const file = form.get('logo_file');
    if (file instanceof File) {
      logoUrl = await uploadLogo(supabaseAdmin, file);
    }
  } else {
    payload = await request.json().catch(() => null);
    logoUrl = payload?.logo_url || null;
  }

  if (!payload?.name || !payload?.category) {
    return NextResponse.json({ error: 'name and category are required' }, { status: 400 });
  }

  const parseActive = (value: any) => {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') return value !== 'false';
    return true;
  };

  const { data, error } = await supabaseAdmin
    .from('brands')
    .insert({
      name: payload.name,
      category: payload.category,
      logo_url: logoUrl,
      official_url: payload.official_url || null,
      is_active: parseActive(payload.is_active),
    })
    .select('id,name,category,logo_url,official_url,is_active')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
