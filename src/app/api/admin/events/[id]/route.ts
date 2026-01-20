import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/db/server';

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const supabaseAdmin = getSupabaseAdmin();
  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
  }

  const payload = await request.json().catch(() => null);
  if (!payload?.title || !payload?.start_date) {
    return NextResponse.json({ error: 'title and start_date are required' }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from('events')
    .update({
      title: payload.title,
      start_date: payload.start_date,
      end_date: payload.end_date || payload.start_date,
      event_type: payload.event_type || null,
    })
    .eq('id', params.id)
    .select('id,title,start_date,end_date,category,event_type')
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

  const { error } = await supabaseAdmin.from('events').delete().eq('id', params.id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
