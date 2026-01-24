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

type BrandEvent = {
  id: string;
  title: string;
  start_date: string | null;
  end_date: string | null;
  category: Category | null;
  event_type: EventType | null;
};

type FavoriteRow = {
  user_id: string;
  display_name?: string | null;
  created_at: string;
};

const CATEGORY_OPTIONS = Object.values(Category).filter((c) => c !== Category.ALL);
const ADMIN_EVENT_TYPES: EventType[] = [EventType.DISCOUNT, EventType.EVENT, EventType.POPUP];

export default function AdminManagePage() {
  const [brands, setBrands] = useState<BrandRow[]>([]);
  const [brandsLoading, setBrandsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBrandId, setSelectedBrandId] = useState<string | null>(null);
  const [brandDetail, setBrandDetail] = useState<BrandRow | null>(null);
  const [brandEvents, setBrandEvents] = useState<BrandEvent[]>([]);
  const [brandFavorites, setBrandFavorites] = useState<FavoriteRow[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoBg, setLogoBg] = useState<'white' | 'black'>('white');

  const [newEvent, setNewEvent] = useState({
    title: '',
    start_date: '',
    end_date: '',
    event_type: EventType.DISCOUNT,
  });

  const filteredBrands = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();
    if (!keyword) return brands;
    return brands.filter((b) => b.name.toLowerCase().includes(keyword));
  }, [brands, searchTerm]);

  const loadBrands = async () => {
    setBrandsLoading(true);
    try {
      const res = await fetch('/api/admin/brands', { cache: 'no-store' });
      if (!res.ok) throw new Error('브랜드 목록 실패');
      const data = (await res.json()) as BrandRow[];
      setBrands(data);
    } catch (err) {
      console.error(err);
    } finally {
      setBrandsLoading(false);
    }
  };

  const loadBrandDetail = async (brandId: string) => {
    setDetailLoading(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/brands/${brandId}`, { cache: 'no-store' });
      if (!res.ok) throw new Error('브랜드 상세 실패');
      const data = await res.json();
      setBrandDetail(data.brand);
      setBrandEvents(data.events || []);
      setBrandFavorites(data.favorites || []);
      setLogoFile(null);
      setLogoPreview(null);
    } catch (err) {
      console.error(err);
      setMessage('브랜드 상세를 불러오지 못했습니다.');
    } finally {
      setDetailLoading(false);
    }
  };

  useEffect(() => {
    loadBrands();
  }, []);

  useEffect(() => {
    if (selectedBrandId) {
      loadBrandDetail(selectedBrandId);
    }
  }, [selectedBrandId]);

  const handleBrandUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!brandDetail) return;
    setMessage(null);

    const formData = new FormData();
    formData.append('name', brandDetail.name);
    formData.append('category', brandDetail.category);
    formData.append('official_url', brandDetail.official_url || '');
    formData.append('is_active', String(brandDetail.is_active ?? true));
    if (logoFile) formData.append('logo_file', logoFile);

    try {
      const res = await fetch(`/api/admin/brands/${brandDetail.id}`, {
        method: 'PATCH',
        body: formData,
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => null);
        throw new Error(payload?.error || '브랜드 수정 실패');
      }
      const updated = (await res.json()) as BrandRow;
      setBrandDetail(updated);
      setMessage('브랜드 정보가 저장되었습니다.');
      await loadBrands();
    } catch (err: any) {
      setMessage(err?.message || '브랜드 수정 실패');
    }
  };

  const handleEventSave = async (event: BrandEvent) => {
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/events/${event.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: event.title,
          start_date: event.start_date,
          end_date: event.end_date,
          event_type: event.event_type,
        }),
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => null);
        throw new Error(payload?.error || '이벤트 수정 실패');
      }
      setMessage('이벤트가 수정되었습니다.');
    } catch (err: any) {
      setMessage(err?.message || '이벤트 수정 실패');
    }
  };

  const handleEventDelete = async (eventId: string) => {
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/events/${eventId}`, { method: 'DELETE' });
      if (!res.ok) {
        const payload = await res.json().catch(() => null);
        throw new Error(payload?.error || '이벤트 삭제 실패');
      }
      setBrandEvents((prev) => prev.filter((event) => event.id !== eventId));
      setMessage('이벤트가 삭제되었습니다.');
    } catch (err: any) {
      setMessage(err?.message || '이벤트 삭제 실패');
    }
  };

  const handleBrandDelete = async () => {
    if (!brandDetail) return;
    const confirmed = window.confirm(`"${brandDetail.name}" 브랜드를 삭제할까요? 관련 이벤트도 함께 삭제됩니다.`);
    if (!confirmed) return;
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/brands/${brandDetail.id}`, { method: 'DELETE' });
      if (!res.ok) {
        const payload = await res.json().catch(() => null);
        throw new Error(payload?.error || '브랜드 삭제 실패');
      }
      setMessage('브랜드가 삭제되었습니다.');
      setSelectedBrandId(null);
      setBrandDetail(null);
      setBrandEvents([]);
      setBrandFavorites([]);
      await loadBrands();
    } catch (err: any) {
      setMessage(err?.message || '브랜드 삭제 실패');
    }
  };

  const handleNewEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!brandDetail) return;
    setMessage(null);
    try {
      const title = newEvent.title.trim() || `${brandDetail.name} 행사`;
      const res = await fetch('/api/admin/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brand_id: brandDetail.id,
          title,
          start_date: newEvent.start_date,
          end_date: newEvent.end_date || newEvent.start_date,
          category: brandDetail.category,
          event_type: newEvent.event_type,
        }),
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => null);
        throw new Error(payload?.error || '이벤트 추가 실패');
      }
      const created = await res.json();
      setBrandEvents((prev) => [
        ...prev,
        {
          id: created.id,
          title,
          start_date: created.start_date,
          end_date: created.end_date,
          category: brandDetail.category,
          event_type: newEvent.event_type,
        },
      ]);
      setNewEvent({ title: '', start_date: '', end_date: '', event_type: EventType.DISCOUNT });
      setMessage('이벤트가 추가되었습니다.');
    } catch (err: any) {
      setMessage(err?.message || '이벤트 추가 실패');
    }
  };

  return (
    <div className="grid lg:grid-cols-[360px_1fr] gap-6">
      <section className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 h-fit">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">전체 관리</h2>
          <span className="text-xs text-gray-400">{brands.length}개</span>
        </div>
        <div className="mt-3">
          <input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="브랜드 검색"
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div className="mt-4 max-h-[70vh] overflow-y-auto pr-1 space-y-2">
          {brandsLoading && <p className="text-sm text-gray-500">불러오는 중...</p>}
          {!brandsLoading && filteredBrands.length === 0 && (
            <p className="text-sm text-gray-500">브랜드가 없습니다.</p>
          )}
          {filteredBrands.map((brand) => (
            <button
              key={brand.id}
              onClick={() => setSelectedBrandId(brand.id)}
              className={`w-full text-left p-3 rounded-lg border transition ${
                selectedBrandId === brand.id
                  ? 'border-gray-900 bg-gray-900 text-white'
                  : 'border-gray-100 hover:border-gray-200'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gray-100 overflow-hidden flex items-center justify-center">
                  {brand.logo_url ? (
                    <img src={brand.logo_url} alt={brand.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-xs text-gray-400">No Logo</span>
                  )}
                </div>
                <div className="min-w-0">
                  <p
                    className={`text-sm font-semibold truncate ${
                      selectedBrandId === brand.id ? 'text-white' : 'text-gray-900'
                    }`}
                  >
                    {brand.name}
                  </p>
                  <p
                    className={`text-xs ${
                      selectedBrandId === brand.id ? 'text-gray-200' : 'text-gray-500'
                    }`}
                  >
                    {brand.category}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </section>

      <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 min-h-[300px]">
        {!selectedBrandId && <p className="text-sm text-gray-500">브랜드를 선택해주세요.</p>}
        {selectedBrandId && detailLoading && <p className="text-sm text-gray-500">불러오는 중...</p>}
        {selectedBrandId && brandDetail && (
          <div className="space-y-8">
            <div>
              <h3 className="text-lg font-bold text-gray-900">브랜드 편집</h3>
              <p className="text-xs text-gray-500 mt-1">선택된 브랜드 정보를 수정합니다.</p>
            </div>

            <form onSubmit={handleBrandUpdate} className="grid gap-4">
              <div className="grid md:grid-cols-2 gap-4">
                <label className="text-sm font-medium text-gray-700">
                  브랜드명
                  <input
                    required
                    value={brandDetail.name}
                    onChange={(e) =>
                      setBrandDetail((prev) => (prev ? { ...prev, name: e.target.value } : prev))
                    }
                    className="mt-2 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </label>
                <label className="text-sm font-medium text-gray-700">
                  카테고리
                  <select
                    value={brandDetail.category}
                    onChange={(e) =>
                      setBrandDetail((prev) =>
                        prev ? { ...prev, category: e.target.value as Category } : prev
                      )
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
                공식 URL
                <input
                  value={brandDetail.official_url || ''}
                  onChange={(e) =>
                    setBrandDetail((prev) =>
                      prev ? { ...prev, official_url: e.target.value } : prev
                    )
                  }
                  className="mt-2 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="https://..."
                />
              </label>
              <label className="text-sm font-medium text-gray-700">
                브랜드 이미지
                <div className="mt-2 flex flex-col md:flex-row md:items-center gap-4">
                  <div
                    className={`w-20 h-20 rounded-xl border border-gray-200 overflow-hidden flex items-center justify-center ${
                      logoBg === 'white' ? 'bg-white' : 'bg-gray-900'
                    }`}
                  >
                    {logoPreview ? (
                      <img src={logoPreview} alt="preview" className="w-full h-full object-cover" />
                    ) : brandDetail.logo_url ? (
                      <img
                        src={brandDetail.logo_url}
                        alt={brandDetail.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span
                        className={`text-xs ${
                          logoBg === 'white' ? 'text-gray-400' : 'text-gray-200'
                        }`}
                      >
                        No Logo
                      </span>
                    )}
                  </div>
                  <div className="space-y-2">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0] || null;
                        setLogoFile(file);
                        setLogoPreview(file ? URL.createObjectURL(file) : null);
                      }}
                      className="text-sm"
                    />
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <span>배경:</span>
                      <button
                        type="button"
                        onClick={() => setLogoBg('white')}
                        className={`px-2 py-1 rounded-full border ${
                          logoBg === 'white'
                            ? 'bg-gray-900 text-white border-gray-900'
                            : 'border-gray-200'
                        }`}
                      >
                        White
                      </button>
                      <button
                        type="button"
                        onClick={() => setLogoBg('black')}
                        className={`px-2 py-1 rounded-full border ${
                          logoBg === 'black'
                            ? 'bg-gray-900 text-white border-gray-900'
                            : 'border-gray-200'
                        }`}
                      >
                        Black
                      </button>
                    </div>
                  </div>
                </div>
              </label>
              <label className="inline-flex items-center gap-2 text-sm text-gray-600">
                <input
                  type="checkbox"
                  checked={brandDetail.is_active ?? true}
                  onChange={(e) =>
                    setBrandDetail((prev) =>
                      prev ? { ...prev, is_active: e.target.checked } : prev
                    )
                  }
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
                <button
                  type="button"
                  onClick={handleBrandDelete}
                  className="px-4 py-2 rounded-lg border border-red-200 text-red-600 text-sm font-semibold hover:bg-red-50"
                >
                  브랜드 삭제
                </button>
                {message && <span className="text-sm text-gray-500">{message}</span>}
              </div>
            </form>

            <div className="border-t border-gray-100 pt-6 space-y-4">
              <h4 className="text-base font-bold text-gray-900">이벤트 날짜 관리</h4>
              {brandEvents.length === 0 && (
                <p className="text-sm text-gray-500">등록된 이벤트가 없습니다.</p>
              )}
              <div className="space-y-3">
                {brandEvents.map((event) => (
                  <div key={event.id} className="rounded-xl border border-gray-100 p-4">
                    <div className="grid md:grid-cols-3 gap-3">
                      <input
                        value={event.title || ''}
                        onChange={(e) =>
                          setBrandEvents((prev) =>
                            prev.map((item) =>
                              item.id === event.id ? { ...item, title: e.target.value } : item
                            )
                          )
                        }
                        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                        placeholder="행사명"
                      />
                      <select
                        value={event.event_type || EventType.DISCOUNT}
                        onChange={(e) =>
                          setBrandEvents((prev) =>
                            prev.map((item) =>
                              item.id === event.id
                                ? { ...item, event_type: e.target.value as EventType }
                                : item
                            )
                          )
                        }
                        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                      >
                        {ADMIN_EVENT_TYPES.map((type) => (
                          <option key={type} value={type}>
                            {type}
                          </option>
                        ))}
                      </select>
                      <div className="flex gap-2">
                        <input
                          type="date"
                          value={event.start_date || ''}
                          onChange={(e) =>
                            setBrandEvents((prev) =>
                              prev.map((item) =>
                                item.id === event.id ? { ...item, start_date: e.target.value } : item
                              )
                            )
                          }
                          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                        />
                        <input
                          type="date"
                          value={event.end_date || ''}
                          onChange={(e) =>
                            setBrandEvents((prev) =>
                              prev.map((item) =>
                                item.id === event.id ? { ...item, end_date: e.target.value } : item
                              )
                            )
                          }
                          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-3">
                      <button
                        type="button"
                        onClick={() => handleEventSave(event)}
                        className="px-3 py-1.5 rounded-lg bg-gray-900 text-white text-xs font-semibold"
                      >
                        저장
                      </button>
                      <button
                        type="button"
                        onClick={() => handleEventDelete(event.id)}
                        className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-semibold text-gray-600"
                      >
                        삭제
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <form
                onSubmit={handleNewEvent}
                className="rounded-xl border border-dashed border-gray-200 p-4 space-y-3"
              >
                <h5 className="text-sm font-semibold text-gray-700">새 이벤트 추가</h5>
                <input
                  value={newEvent.title}
                  onChange={(e) => setNewEvent((prev) => ({ ...prev, title: e.target.value }))}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                  placeholder="행사명 (미입력 시 자동)"
                />
                <div className="grid md:grid-cols-3 gap-3">
                  <select
                    value={newEvent.event_type}
                    onChange={(e) =>
                      setNewEvent((prev) => ({ ...prev, event_type: e.target.value as EventType }))
                    }
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                  >
                    {ADMIN_EVENT_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                  <input
                    type="date"
                    value={newEvent.start_date}
                    onChange={(e) => setNewEvent((prev) => ({ ...prev, start_date: e.target.value }))}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                    required
                  />
                  <input
                    type="date"
                    value={newEvent.end_date}
                    onChange={(e) => setNewEvent((prev) => ({ ...prev, end_date: e.target.value }))}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                  />
                </div>
                <button
                  type="submit"
                  className="px-3 py-2 rounded-lg bg-gray-900 text-white text-xs font-semibold"
                >
                  이벤트 추가
                </button>
              </form>
            </div>

            <div className="border-t border-gray-100 pt-6 space-y-2">
              <h4 className="text-base font-bold text-gray-900">찜한 유저</h4>
              {brandFavorites.length === 0 && (
                <p className="text-sm text-gray-500">찜한 유저가 없습니다.</p>
              )}
              {brandFavorites.length > 0 && (
                <div className="grid md:grid-cols-2 gap-2">
                  {brandFavorites.map((fav) => (
                    <div key={fav.user_id} className="rounded-lg border border-gray-100 p-3">
                      <p className="text-sm font-semibold text-gray-800">
                        {fav.display_name || fav.user_id}
                      </p>
                      <p className="text-xs text-gray-400">
                        찜한 날짜: {fav.created_at.slice(0, 10)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
