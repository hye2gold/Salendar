'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Category, EventType } from '@/domain/event/event.types';

type BrandRow = {
  id: string;
  name: string;
  category: Category;
};

const ADMIN_EVENT_TYPES: EventType[] = [EventType.DISCOUNT, EventType.EVENT, EventType.POPUP];

export default function AdminCalendarPage() {
  const [brands, setBrands] = useState<BrandRow[]>([]);
  const [brandsLoading, setBrandsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBrandId, setSelectedBrandId] = useState('');
  const [eventForm, setEventForm] = useState({
    event_type: EventType.DISCOUNT,
    start_date: '',
    end_date: '',
  });
  const [message, setMessage] = useState<string | null>(null);

  const filteredBrands = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();
    if (!keyword) return brands;
    return brands.filter((b) => b.name.toLowerCase().includes(keyword));
  }, [brands, searchTerm]);

  useEffect(() => {
    const loadBrands = async () => {
      setBrandsLoading(true);
      try {
        const res = await fetch('/api/admin/brands', { cache: 'no-store' });
        if (!res.ok) throw new Error('브랜드 목록 실패');
        const data = (await res.json()) as BrandRow[];
        setBrands(data);
        if (data.length && !selectedBrandId) setSelectedBrandId(data[0].id);
      } catch (err) {
        console.error(err);
      } finally {
        setBrandsLoading(false);
      }
    };
    loadBrands();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    const brand = brands.find((b) => b.id === selectedBrandId);
    if (!brand) {
      setMessage('브랜드를 선택해주세요.');
      return;
    }
    try {
      const res = await fetch('/api/admin/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brand_id: brand.id,
          title: `${brand.name} 행사`,
          start_date: eventForm.start_date,
          end_date: eventForm.end_date || eventForm.start_date,
          category: brand.category,
          event_type: eventForm.event_type,
        }),
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => null);
        throw new Error(payload?.error || '이벤트 저장 실패');
      }
      setMessage('캘린더 이벤트가 추가되었습니다.');
      setEventForm({ event_type: EventType.DISCOUNT, start_date: '', end_date: '' });
    } catch (err: any) {
      setMessage(err?.message || '이벤트 저장 실패');
    }
  };

  return (
    <div className="max-w-3xl">
      <header className="mb-6">
        <h2 className="text-xl font-extrabold text-gray-900">캘린더 편집</h2>
        <p className="text-sm text-gray-500 mt-1">브랜드 이벤트 날짜를 추가합니다.</p>
      </header>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-5">
        <label className="text-sm font-medium text-gray-700">
          브랜드 검색
          <input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="mt-2 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="브랜드명 검색"
          />
        </label>

        <label className="text-sm font-medium text-gray-700">
          브랜드 선택
          <select
            value={selectedBrandId}
            onChange={(e) => setSelectedBrandId(e.target.value)}
            className="mt-2 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            {brandsLoading && <option>불러오는 중...</option>}
            {!brandsLoading && filteredBrands.length === 0 && <option>브랜드 없음</option>}
            {filteredBrands.map((brand) => (
              <option key={brand.id} value={brand.id}>
                {brand.name}
              </option>
            ))}
          </select>
        </label>

        <label className="text-sm font-medium text-gray-700">
          행사 카테고리
          <select
            value={eventForm.event_type}
            onChange={(e) =>
              setEventForm((prev) => ({ ...prev, event_type: e.target.value as EventType }))
            }
            className="mt-2 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            {ADMIN_EVENT_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </label>

        <div className="grid md:grid-cols-2 gap-4">
          <label className="text-sm font-medium text-gray-700">
            시작날짜
            <input
              type="date"
              required
              value={eventForm.start_date}
              onChange={(e) => setEventForm((prev) => ({ ...prev, start_date: e.target.value }))}
              className="mt-2 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </label>
          <label className="text-sm font-medium text-gray-700">
            종료날짜
            <input
              type="date"
              value={eventForm.end_date}
              onChange={(e) => setEventForm((prev) => ({ ...prev, end_date: e.target.value }))}
              className="mt-2 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </label>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            className="px-5 py-2 rounded-lg bg-gray-900 text-white text-sm font-semibold hover:bg-gray-700"
          >
            이벤트 저장
          </button>
          {message && <span className="text-sm text-gray-500">{message}</span>}
        </div>
      </form>
    </div>
  );
}
