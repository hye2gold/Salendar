import { NextRequest, NextResponse } from 'next/server';
import { Category, PromotionEvent, EventType } from '@/domain/event/event.types';
import { getSupabaseAdmin } from '@/lib/db/server';

const toDateString = (value: string | null | undefined) => {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return d.toISOString().slice(0, 10);
};

const getMonthBounds = (year: number, month: number) => {
  const start = new Date(Date.UTC(year, month - 1, 1));
  const end = new Date(Date.UTC(year, month, 0));
  return {
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10),
  };
};

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const year = Number(searchParams.get('year'));
  const month = Number(searchParams.get('month'));

  if (!year || !month) {
    return NextResponse.json({ error: 'Year and month are required' }, { status: 400 });
  }

  const supabaseAdmin = getSupabaseAdmin();
  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
  }

  const { start, end } = getMonthBounds(year, month);

  // Load brands once for name/category/logo lookup
  const { data: brandRows, error: brandError } = await supabaseAdmin
    .from('brands')
    .select('id,name,category,logo_url');

  if (brandError) {
    return NextResponse.json({ error: brandError.message }, { status: 500 });
  }

  const brandById = new Map<string, { name: string; category: string; logo_url?: string }>();
  const brandLogos: Record<string, string> = {};
  (brandRows || []).forEach((b) => {
    brandById.set(b.id, { name: b.name, category: b.category, logo_url: b.logo_url || undefined });
    if (b.logo_url) brandLogos[b.name] = b.logo_url;
  });

  // Fetch events overlapping the requested month
  const { data: eventRows, error: eventError } = await supabaseAdmin
    .from('events')
    .select('id,brand_id,title,description,start_date,end_date,category,event_type')
    .lte('start_date', end)
    .gte('end_date', start);

  if (eventError) {
    return NextResponse.json({ error: eventError.message }, { status: 500 });
  }

  const events: PromotionEvent[] = (eventRows || []).map((row, index) => {
    const brandInfo = row.brand_id ? brandById.get(row.brand_id) : undefined;
    const brandName = brandInfo?.name || '브랜드';

    // Choose category from event row if valid; fall back to brand category
    const rowCategory = row.category as Category | undefined;
    const category = (rowCategory && Object.values(Category).includes(rowCategory))
      ? rowCategory
      : (brandInfo?.category as Category) || Category.OTHER;

    const startDate = toDateString(row.start_date) || start;
    const endDate = toDateString(row.end_date) || end;

    const normalizeEventType = (raw: any): EventType => {
      const value = (raw || '').toString().trim();
      if (Object.values(EventType).includes(value as EventType)) return value as EventType;
      const lower = value.toLowerCase();
      if (lower.includes('행사')) return EventType.EVENT;
      if (lower.includes('팝업') || lower.includes('popup')) return EventType.POPUP;
      if (lower.includes('증정') || lower.includes('사은품') || lower.includes('gift')) return EventType.GIFT;
      if (lower.includes('리워드') || lower.includes('포인트')) return EventType.REWARD;
      if (lower.includes('타임딜') || lower.includes('타임 딜') || lower.includes('타임세일')) return EventType.TIMEDEAL;
      if (lower.includes('전용') || lower.includes('멤버십') || lower.includes('exclusive')) return EventType.EXCLUSIVE;
      return EventType.DISCOUNT;
    };

    const eventType = normalizeEventType(row.event_type);

    return {
      id: row.id || `evt-${index}-${Date.now()}`,
      brand: brandName,
      title: row.title || 'Event',
      description: row.description || '',
      startDate,
      endDate,
      category,
      type: eventType,
    };
  });

  return NextResponse.json({ events, brandLogos, sources: [] });
}
