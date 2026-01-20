import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/db/server';

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

  const payload = await request.json().catch(() => null);
  if (!payload?.name || !payload?.category) {
    return NextResponse.json({ error: 'name and category are required' }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from('brands')
    .insert({
      name: payload.name,
      category: payload.category,
      logo_url: payload.logo_url || null,
      official_url: payload.official_url || null,
      is_active: payload.is_active ?? true,
    })
    .select('id,name,category,logo_url,official_url,is_active')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
