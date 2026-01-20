'use client';

import React, { useState } from 'react';
import { Category, EventType } from '@/domain/event/event.types';

type EventEntry = {
  id: string;
  title: string;
  start_date: string;
  end_date: string;
  event_type: EventType;
};

const CATEGORY_OPTIONS = Object.values(Category).filter((c) => c !== Category.ALL);
const ADMIN_EVENT_TYPES: EventType[] = [EventType.DISCOUNT, EventType.EVENT, EventType.POPUP];

export default function AdminBrandAddPage() {
  const [brandForm, setBrandForm] = useState({
    name: '',
    category: (CATEGORY_OPTIONS[0] as Category) || Category.OTHER,
    official_url: '',
    is_active: true,
  });
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoBg, setLogoBg] = useState<'white' | 'black'>('white');
  const [events, setEvents] = useState<EventEntry[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const addEvent = () => {
    setEvents((prev) => [
      ...prev,
      {
        id: `evt-${Date.now()}-${prev.length}`,
        title: '',
        start_date: '',
        end_date: '',
        event_type: EventType.DISCOUNT,
      },
    ]);
  };

  const removeEvent = (id: string) => {
    setEvents((prev) => prev.filter((event) => event.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (!logoFile) {
      setMessage('브랜드 사진은 필수입니다.');
      return;
    }

    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('name', brandForm.name.trim());
      formData.append('category', brandForm.category);
      formData.append('official_url', brandForm.official_url.trim());
      formData.append('is_active', String(brandForm.is_active));
      formData.append('logo_file', logoFile);

      const res = await fetch('/api/admin/brands', {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => null);
        throw new Error(payload?.error || '브랜드 저장 실패');
      }
      const brand = await res.json();

      if (events.length) {
        for (const event of events) {
          if (!event.start_date) continue;
          const title = event.title.trim() || `${brandForm.name} 행사`;
          await fetch('/api/admin/events', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              brand_id: brand.id,
              title,
              start_date: event.start_date,
              end_date: event.end_date || event.start_date,
              category: brandForm.category,
              event_type: event.event_type,
            }),
          });
        }
      }

      setMessage('브랜드가 등록되었습니다.');
      setBrandForm({
        name: '',
        category: (CATEGORY_OPTIONS[0] as Category) || Category.OTHER,
        official_url: '',
        is_active: true,
      });
      setLogoFile(null);
      setLogoPreview(null);
      setEvents([]);
    } catch (err: any) {
      setMessage(err?.message || '브랜드 저장 실패');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl">
      <header className="mb-6">
        <h2 className="text-xl font-extrabold text-gray-900">브랜드 추가</h2>
        <p className="text-sm text-gray-500 mt-1">필수 정보를 입력해 브랜드를 등록하세요.</p>
      </header>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-6">
        <div className="grid md:grid-cols-2 gap-4">
          <label className="text-sm font-medium text-gray-700">
            브랜드명 (필수)
            <input
              required
              value={brandForm.name}
              onChange={(e) => setBrandForm((prev) => ({ ...prev, name: e.target.value }))}
              className="mt-2 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="예: 무신사"
            />
          </label>
          <label className="text-sm font-medium text-gray-700">
            카테고리 (필수)
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

        <label className="text-sm font-medium text-gray-700">
          브랜드 사진 (필수)
          <div className="mt-3 flex flex-col md:flex-row md:items-center gap-4">
            <div
              className={`w-32 h-32 rounded-2xl border border-gray-200 flex items-center justify-center overflow-hidden ${
                logoBg === 'white' ? 'bg-white' : 'bg-gray-900'
              }`}
            >
              {logoPreview ? (
                <img src={logoPreview} alt="preview" className="w-full h-full object-cover" />
              ) : (
                <span className={`text-xs ${logoBg === 'white' ? 'text-gray-400' : 'text-gray-200'}`}>
                  미리보기
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
                  className={`px-2 py-1 rounded-full border ${logoBg === 'white' ? 'bg-gray-900 text-white border-gray-900' : 'border-gray-200'}`}
                >
                  White
                </button>
                <button
                  type="button"
                  onClick={() => setLogoBg('black')}
                  className={`px-2 py-1 rounded-full border ${logoBg === 'black' ? 'bg-gray-900 text-white border-gray-900' : 'border-gray-200'}`}
                >
                  Black
                </button>
              </div>
            </div>
          </div>
        </label>

        <label className="text-sm font-medium text-gray-700">
          공식 URL (선택)
          <input
            value={brandForm.official_url}
            onChange={(e) => setBrandForm((prev) => ({ ...prev, official_url: e.target.value }))}
            className="mt-2 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="https://..."
          />
        </label>

        <label className="inline-flex items-center gap-2 text-sm text-gray-600">
          <input
            type="checkbox"
            checked={brandForm.is_active}
            onChange={(e) => setBrandForm((prev) => ({ ...prev, is_active: e.target.checked }))}
            className="rounded border-gray-300 text-primary focus:ring-primary"
          />
          활성화 상태
        </label>

        <div className="border-t border-gray-100 pt-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-gray-900">행사 날짜 추가 (선택)</h3>
            <button
              type="button"
              onClick={addEvent}
              className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-semibold text-gray-600"
            >
              행사 날짜 추가
            </button>
          </div>
          {events.length === 0 && (
            <p className="text-sm text-gray-500">행사 날짜를 추가하지 않으면 브랜드만 등록됩니다.</p>
          )}
          {events.map((event) => (
            <div key={event.id} className="rounded-xl border border-gray-100 p-4 space-y-3">
              <div className="grid md:grid-cols-3 gap-3">
                <label className="text-sm font-medium text-gray-700">
                  행사 카테고리
                  <select
                    value={event.event_type}
                    onChange={(e) =>
                      setEvents((prev) =>
                        prev.map((item) =>
                          item.id === event.id
                            ? { ...item, event_type: e.target.value as EventType }
                            : item
                        )
                      )
                    }
                    className="mt-2 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                  >
                    {ADMIN_EVENT_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-sm font-medium text-gray-700">
                  시작날짜
                  <input
                    type="date"
                    required
                    value={event.start_date}
                    onChange={(e) =>
                      setEvents((prev) =>
                        prev.map((item) =>
                          item.id === event.id ? { ...item, start_date: e.target.value } : item
                        )
                      )
                    }
                    className="mt-2 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                  />
                </label>
                <label className="text-sm font-medium text-gray-700">
                  종료날짜
                  <input
                    type="date"
                    value={event.end_date}
                    onChange={(e) =>
                      setEvents((prev) =>
                        prev.map((item) =>
                          item.id === event.id ? { ...item, end_date: e.target.value } : item
                        )
                      )
                    }
                    className="mt-2 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                  />
                </label>
              </div>
              <label className="text-sm font-medium text-gray-700">
                행사명 (선택)
                <input
                  value={event.title}
                  onChange={(e) =>
                    setEvents((prev) =>
                      prev.map((item) =>
                        item.id === event.id ? { ...item, title: e.target.value } : item
                      )
                    )
                  }
                  className="mt-2 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                  placeholder="미입력 시 자동 설정"
                />
              </label>
              <button
                type="button"
                onClick={() => removeEvent(event.id)}
                className="text-xs text-gray-500 underline"
              >
                행사 삭제
              </button>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2 rounded-lg bg-gray-900 text-white text-sm font-semibold hover:bg-gray-700 disabled:opacity-60"
          >
            {saving ? '저장 중...' : '브랜드 저장'}
          </button>
          {message && <span className="text-sm text-gray-500">{message}</span>}
        </div>
      </form>
    </div>
  );
}
