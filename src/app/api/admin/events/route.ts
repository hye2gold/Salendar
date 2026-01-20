import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/db/server';

export async function POST(request: Request) {
  const supabaseAdmin = getSupabaseAdmin();
  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
  }

  const payload = await request.json().catch(() => null);
  if (!payload?.brand_id || !payload?.title || !payload?.start_date) {
    return NextResponse.json(
      { error: 'brand_id, title, start_date are required' },
      { status: 400 }
    );
  }

  const { data, error } = await supabaseAdmin
    .from('events')
    .insert({
      brand_id: payload.brand_id,
      title: payload.title,
      description: payload.description || null,
      start_date: payload.start_date,
      end_date: payload.end_date || payload.start_date,
      category: payload.category || null,
      event_type: payload.event_type || null,
      source: payload.source || null,
    })
    .select('id,brand_id,title,start_date,end_date')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
