'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Category, EventType } from '@/domain/event/event.types';

type BrandRow = {
  id: string;
  name: string;
  category: Category;
  logo_url?: string | null;
  official_url?: string | null;
  is_active?: boolean | null;
};

const CATEGORY_OPTIONS = Object.values(Category).filter((c) => c !== Category.ALL);
const EVENT_TYPE_OPTIONS = Object.values(EventType);

export default function AdminPage() {
  const [brands, setBrands] = useState<BrandRow[]>([]);
  const [brandsLoading, setBrandsLoading] = useState(false);
  const [brandForm, setBrandForm] = useState<{
    name: string;
    category: Category;
    logo_url: string;
    official_url: string;
    is_active: boolean;
  }>({
    name: '',
    category: (CATEGORY_OPTIONS[0] as Category) || Category.OTHER,
    logo_url: '',
    official_url: '',
    is_active: true,
  });
  const [brandMessage, setBrandMessage] = useState<string | null>(null);

  const [eventForm, setEventForm] = useState<{
    brand_id: string;
    title: string;
    description: string;
    start_date: string;
    end_date: string;
    category: Category;
    event_type: EventType;
    source: string;
  }>({
    brand_id: '',
    title: '',
    description: '',
    start_date: '',
    end_date: '',
    category: (CATEGORY_OPTIONS[0] as Category) || Category.OTHER,
    event_type: (EVENT_TYPE_OPTIONS[0] as EventType) || EventType.DISCOUNT,
    source: '',
  });
  const [eventMessage, setEventMessage] = useState<string | null>(null);

  const brandById = useMemo(() => {
    const map = new Map<string, BrandRow>();
    brands.forEach((b) => map.set(b.id, b));
    return map;
  }, [brands]);

  const loadBrands = async () => {
    setBrandsLoading(true);
    try {
      const res = await fetch('/api/admin/brands', { cache: 'no-store' });
      if (!res.ok) {
        throw new Error('Failed to load brands');
      }
      const data = (await res.json()) as BrandRow[];
      setBrands(data);
      if (!eventForm.brand_id && data.length) {
        setEventForm((prev) => ({
          ...prev,
          brand_id: data[0].id,
          category: data[0].category,
        }));
      }
    } catch (err) {
      console.error(err);
      setBrandMessage('브랜드 목록을 불러오지 못했습니다.');
    } finally {
      setBrandsLoading(false);
    }
  };

  useEffect(() => {
    loadBrands();
  }, []);

  const handleBrandSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBrandMessage(null);
    try {
      const res = await fetch('/api/admin/brands', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: brandForm.name.trim(),
          category: brandForm.category,
          logo_url: brandForm.logo_url.trim() || null,
          official_url: brandForm.official_url.trim() || null,
          is_active: brandForm.is_active,
        }),
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => null);
        throw new Error(payload?.error || '브랜드 저장 실패');
      }
      setBrandMessage('브랜드가 추가되었습니다.');
      setBrandForm({
        name: '',
        category: (CATEGORY_OPTIONS[0] as Category) || Category.OTHER,
        logo_url: '',
        official_url: '',
        is_active: true,
      });
      await loadBrands();
    } catch (err: any) {
      setBrandMessage(err?.message || '브랜드 저장 실패');
    }
  };

  const handleEventSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEventMessage(null);
    try {
      const res = await fetch('/api/admin/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brand_id: eventForm.brand_id,
          title: eventForm.title.trim(),
          description: eventForm.description.trim() || null,
          start_date: eventForm.start_date,
          end_date: eventForm.end_date || eventForm.start_date,
          category: eventForm.category,
          event_type: eventForm.event_type,
          source: eventForm.source.trim() || null,
        }),
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => null);
        throw new Error(payload?.error || '이벤트 저장 실패');
      }
      setEventMessage('이벤트가 추가되었습니다.');
      setEventForm((prev) => ({
        ...prev,
        title: '',
        description: '',
        start_date: '',
        end_date: '',
        source: '',
      }));
    } catch (err: any) {
      setEventMessage(err?.message || '이벤트 저장 실패');
    }
  };

  return (
    <div className="min-h-screen bg-[#F1F2F6] pb-16">
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">
        <header className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h1 className="text-2xl font-extrabold text-gray-900">Salendar Admin</h1>
              <p className="text-sm text-gray-500 mt-1">브랜드와 이벤트를 직접 등록합니다.</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={async () => {
                  await fetch('/api/admin/logout', { method: 'POST' });
                  window.location.href = '/admin/login';
                }}
                className="px-3 py-1.5 text-sm font-semibold rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50"
              >
                로그아웃
              </button>
              <a
                href="/dashboard"
                className="px-3 py-1.5 text-sm font-semibold rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50"
              >
                대시보드로 이동
              </a>
            </div>
          </div>
        </header>

        <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-lg font-bold text-gray-900 mb-4">브랜드 추가</h2>
          <form onSubmit={handleBrandSubmit} className="grid gap-4">
            <div className="grid md:grid-cols-2 gap-4">
              <label className="text-sm font-medium text-gray-700">
                브랜드명
                <input
                  required
                  value={brandForm.name}
                  onChange={(e) => setBrandForm((prev) => ({ ...prev, name: e.target.value }))}
                  className="mt-2 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="예: 무신사"
                />
              </label>
              <label className="text-sm font-medium text-gray-700">
                카테고리
                <select
                  value={brandForm.category}
                  onChange={(e) =>
                    setBrandForm((prev) => ({ ...prev, category: e.target.value as Category }))
                  }
                  className="mt-2 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  {CATEGORY_OPTIONS.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <label className="text-sm font-medium text-gray-700">
                로고 URL
                <input
                  value={brandForm.logo_url}
                  onChange={(e) => setBrandForm((prev) => ({ ...prev, logo_url: e.target.value }))}
                  className="mt-2 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="https://..."
                />
              </label>
              <label className="text-sm font-medium text-gray-700">
                공식 URL
                <input
                  value={brandForm.official_url}
                  onChange={(e) => setBrandForm((prev) => ({ ...prev, official_url: e.target.value }))}
                  className="mt-2 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="https://..."
                />
              </label>
            </div>
            <label className="inline-flex items-center gap-2 text-sm text-gray-600">
              <input
                type="checkbox"
                checked={brandForm.is_active}
                onChange={(e) => setBrandForm((prev) => ({ ...prev, is_active: e.target.checked }))}
                className="rounded border-gray-300 text-primary focus:ring-primary"
              />
              활성화 상태
            </label>
            <div className="flex items-center gap-3">
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-gray-900 text-white text-sm font-semibold hover:bg-gray-700"
              >
                브랜드 저장
              </button>
              {brandMessage && <span className="text-sm text-gray-500">{brandMessage}</span>}
            </div>
          </form>
        </section>

        <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-lg font-bold text-gray-900 mb-4">이벤트 추가</h2>
          <form onSubmit={handleEventSubmit} className="grid gap-4">
            <div className="grid md:grid-cols-2 gap-4">
              <label className="text-sm font-medium text-gray-700">
                브랜드
                <select
                  required
                  value={eventForm.brand_id}
                  onChange={(e) => {
                    const selected = brandById.get(e.target.value);
                    setEventForm((prev) => ({
                      ...prev,
                      brand_id: e.target.value,
                      category: selected?.category ?? prev.category,
                    }));
                  }}
                  className="mt-2 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  {brandsLoading && <option>불러오는 중...</option>}
                  {!brandsLoading && brands.length === 0 && <option>브랜드 없음</option>}
                  {brands.map((brand) => (
                    <option key={brand.id} value={brand.id}>
                      {brand.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-sm font-medium text-gray-700">
                이벤트 타입
                <select
                  value={eventForm.event_type}
                  onChange={(e) =>
                    setEventForm((prev) => ({ ...prev, event_type: e.target.value as EventType }))
                  }
                  className="mt-2 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  {EVENT_TYPE_OPTIONS.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <label className="text-sm font-medium text-gray-700">
              이벤트 제목
              <input
                required
                value={eventForm.title}
                onChange={(e) => setEventForm((prev) => ({ ...prev, title: e.target.value }))}
                className="mt-2 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="예: 여름 정기 세일"
              />
            </label>
            <label className="text-sm font-medium text-gray-700">
              설명
              <textarea
                value={eventForm.description}
                onChange={(e) => setEventForm((prev) => ({ ...prev, description: e.target.value }))}
                className="mt-2 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm min-h-[90px] focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="행사 상세를 적어주세요."
              />
            </label>
            <div className="grid md:grid-cols-3 gap-4">
              <label className="text-sm font-medium text-gray-700">
                시작일
                <input
                  required
                  type="date"
                  value={eventForm.start_date}
                  onChange={(e) => setEventForm((prev) => ({ ...prev, start_date: e.target.value }))}
                  className="mt-2 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </label>
              <label className="text-sm font-medium text-gray-700">
                종료일
                <input
                  type="date"
                  value={eventForm.end_date}
                  onChange={(e) => setEventForm((prev) => ({ ...prev, end_date: e.target.value }))}
                  className="mt-2 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </label>
              <label className="text-sm font-medium text-gray-700">
                카테고리
                <select
                  value={eventForm.category}
                  onChange={(e) =>
                    setEventForm((prev) => ({ ...prev, category: e.target.value as Category }))
                  }
                  className="mt-2 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  {CATEGORY_OPTIONS.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <label className="text-sm font-medium text-gray-700">
              출처
              <input
                value={eventForm.source}
                onChange={(e) => setEventForm((prev) => ({ ...prev, source: e.target.value }))}
                className="mt-2 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="예: 인스타그램 링크"
              />
            </label>
            <div className="flex items-center gap-3">
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-gray-900 text-white text-sm font-semibold hover:bg-gray-700"
              >
                이벤트 저장
              </button>
              {eventMessage && <span className="text-sm text-gray-500">{eventMessage}</span>}
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}
