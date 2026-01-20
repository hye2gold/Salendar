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

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const supabaseAdmin = getSupabaseAdmin();
  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
  }

  const brandId = params.id;

  const { data: brand, error: brandError } = await supabaseAdmin
    .from('brands')
    .select('id,name,category,logo_url,official_url,is_active')
    .eq('id', brandId)
    .single();

  if (brandError) {
    return NextResponse.json({ error: brandError.message }, { status: 500 });
  }

  const { data: events, error: eventError } = await supabaseAdmin
    .from('events')
    .select('id,title,start_date,end_date,category,event_type')
    .eq('brand_id', brandId)
    .order('start_date', { ascending: true });

  if (eventError) {
    return NextResponse.json({ error: eventError.message }, { status: 500 });
  }

  const { data: favorites, error: favoritesError } = await supabaseAdmin
    .from('user_favorites')
    .select('user_id,created_at')
    .eq('brand_id', brandId);

  if (favoritesError) {
    return NextResponse.json({ error: favoritesError.message }, { status: 500 });
  }

  const userIds = (favorites || []).map((fav) => fav.user_id);
  let profiles: Array<{ user_id: string; display_name: string | null }> = [];
  if (userIds.length) {
    const { data: profileRows } = await supabaseAdmin
      .from('user_profiles')
      .select('user_id,display_name')
      .in('user_id', userIds);
    profiles = profileRows || [];
  }

  const displayNameById = new Map(profiles.map((p) => [p.user_id, p.display_name]));
  const favoritesWithNames = (favorites || []).map((fav) => ({
    ...fav,
    display_name: displayNameById.get(fav.user_id) || null,
  }));

  return NextResponse.json({ brand, events: events || [], favorites: favoritesWithNames });
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const supabaseAdmin = getSupabaseAdmin();
  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
  }

  const contentType = request.headers.get('content-type') || '';
  if (!contentType.includes('multipart/form-data')) {
    return NextResponse.json({ error: 'multipart/form-data required' }, { status: 400 });
  }

  const form = await request.formData();
  const payload = {
    name: form.get('name')?.toString() || '',
    category: form.get('category')?.toString() || '',
    official_url: form.get('official_url')?.toString() || null,
    is_active: form.get('is_active')?.toString() !== 'false',
  };

  if (!payload.name || !payload.category) {
    return NextResponse.json({ error: 'name and category are required' }, { status: 400 });
  }

  let logoUrl: string | null = null;
  const file = form.get('logo_file');
  if (file instanceof File) {
    logoUrl = await uploadLogo(supabaseAdmin, file);
  }

  const updatePayload: Record<string, any> = {
    name: payload.name,
    category: payload.category,
    official_url: payload.official_url,
    is_active: payload.is_active,
  };
  if (logoUrl) updatePayload.logo_url = logoUrl;

  const { data, error } = await supabaseAdmin
    .from('brands')
    .update(updatePayload)
    .eq('id', params.id)
    .select('id,name,category,logo_url,official_url,is_active')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const supabaseAdmin = getSupabaseAdmin();
  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
  }

  const { error } = await supabaseAdmin.from('brands').delete().eq('id', params.id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
