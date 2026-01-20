
'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Calendar from '@/components/ui/Calendar';
import CategoryFilter from '@/components/ui/CategoryFilter';
import EventCard from '@/components/ui/EventCard';
import { Category, PromotionEvent } from '@/domain/event/event.types';
import { Brand } from '@/domain/event/brand.types';
import { getBrandLogo } from '@/domain/event/event.constants';

// Helper: Get strictly local date string YYYY-MM-DD
const getLocalDateString = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Helper: Get absolute month index (Year * 12 + Month)
const getMonthIndex = (d: Date) => d.getFullYear() * 12 + d.getMonth();

export default function Home() {
  // 1. Stable "Today" anchor for the session to prevent drift
  // Initialized to Noon (12:00) to act as a safe anchor
  const [today] = useState(() => {
    const d = new Date();
    d.setHours(12, 0, 0, 0);
    return d;
  });

  // 2. Current View Date
  const [currentDate, setCurrentDate] = useState(() => {
    const d = new Date();
    d.setHours(12, 0, 0, 0);
    return d;
  });

  // 3. Selected Specific Date
  const [selectedDate, setSelectedDate] = useState(() => {
    const d = new Date();
    d.setHours(12, 0, 0, 0);
    return d;
  });
  
  const [selectedCategory, setSelectedCategory] = useState<Category>(Category.ALL);
  const [events, setEvents] = useState<PromotionEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [brandLogos, setBrandLogos] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState<'calendar' | 'brands'>('calendar');
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [brands, setBrands] = useState<Brand[]>([]);
  const [brandsLoading, setBrandsLoading] = useState(false);
  const contactLink = 'https://docs.google.com/forms/d/e/1FAIpQLSc5-uIyuQxK_vCHzl7zanVzHolkvAfQKtcr1tAwGj09o7tMiw/viewform?usp=publish-editor';

  // --- Strict 3-Month Logic ---
  // Calculates boundaries based on the stable 'today'
  const { minIndex, maxIndex, currentMonthIndex } = useMemo(() => {
    const todayIdx = getMonthIndex(today);
    
    return {
      currentMonthIndex: getMonthIndex(currentDate),
      minIndex: todayIdx - 1, // Previous month (e.g., Nov if today is Dec)
      maxIndex: todayIdx + 1, // Next month (e.g., Jan if today is Dec)
    };
  }, [currentDate, today]);

  // Disable logic: If current index is at or below min, disable Prev.
  const disablePrev = currentMonthIndex <= minIndex;
  const disableNext = currentMonthIndex >= maxIndex;

  const loadEvents = useCallback(async () => {
    setLoading(true);
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth() + 1;
    
    try {
      const res = await fetch(`/api/events?year=${year}&month=${month}`);
      if (res.ok) {
        const data = await res.json();
        setEvents(data.events || []);
        if (data.brandLogos) setBrandLogos(data.brandLogos);
      } else {
        console.error("Failed to fetch events");
      }
    } catch (e) {
      console.error("API call failed", e);
    } finally {
      setLoading(false);
    }
  }, [currentDate]);

  // Load events via Server API
  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  const loadBrands = useCallback(async () => {
    if (brandsLoading || activeTab !== 'brands') return;
    setBrandsLoading(true);
    try {
      const res = await fetch('/api/brands');
      if (res.ok) {
        const data = await res.json();
        setBrands(data || []);
      }
    } catch (e) {
      console.error('Failed to fetch brands', e);
    } finally {
      setBrandsLoading(false);
    }
  }, [activeTab, brandsLoading]);

  // Load brands when brand tab is opened
  useEffect(() => {
    if (activeTab === 'brands') loadBrands();
  }, [activeTab, loadBrands]);

  // Refetch on focus/visibility
  useEffect(() => {
    const handleFocus = () => {
      loadEvents();
      loadBrands();
    };

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        loadEvents();
        loadBrands();
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [loadEvents, loadBrands]);

  // Debounce search term
  useEffect(() => {
    const id = setTimeout(() => setDebouncedSearch(searchTerm.trim()), 250);
    return () => clearTimeout(id);
  }, [searchTerm]);

  const handleMonthChange = (increment: number) => {
    const targetIdx = currentMonthIndex + increment;

    // Strict Guard: Prevent any movement outside the allowed 3 months
    if (targetIdx < minIndex || targetIdx > maxIndex) return;

    const newDate = new Date(currentDate);
    // Set to 1st of month to avoid overflow (e.g. Jan 31 -> Feb 28/29)
    newDate.setDate(1); 
    newDate.setMonth(newDate.getMonth() + increment);
    newDate.setHours(12, 0, 0, 0); // Keep at noon
    setCurrentDate(newDate);
  };

  const handleDateClick = (date: Date) => {
    const d = new Date(date);
    d.setHours(12, 0, 0, 0);

    // Check strict bounds based on month index for the clicked date
    const clickedMonthIndex = getMonthIndex(d);
    
    // Do not allow selecting padding days that are outside the allowed 3-month window
    if (clickedMonthIndex < minIndex || clickedMonthIndex > maxIndex) {
      return; 
    }

    setSelectedDate(d);
    
    // Switch view if clicking a valid padding day (e.g. clicking Nov 30 while viewing Dec)
    if (clickedMonthIndex !== currentMonthIndex) {
      const newViewDate = new Date(d.getFullYear(), d.getMonth(), 1, 12, 0, 0);
      setCurrentDate(newViewDate);
    }
  };

  const filteredEvents = useMemo(() => {
    const dateStr = getLocalDateString(selectedDate);
    const keyword = debouncedSearch.toLowerCase();
    
    return events.filter(event => {
      const isDateMatch = dateStr >= event.startDate && dateStr <= event.endDate;
      const isCategoryMatch = selectedCategory === Category.ALL || event.category === selectedCategory;
      const isSearchMatch = !keyword
        || event.brand.toLowerCase().includes(keyword)
        || (event.title || '').toLowerCase().includes(keyword);
      return isDateMatch && isCategoryMatch && isSearchMatch;
    });
  }, [events, selectedDate, selectedCategory, debouncedSearch]);

  const filteredBrands = useMemo(() => {
    const keyword = debouncedSearch.toLowerCase();
    const list = [...brands];
    list.sort((a, b) => a.name.localeCompare(b.name, 'ko-KR'));
    if (!keyword) return list;
    return list.filter((b) => b.name.toLowerCase().includes(keyword));
  }, [brands, debouncedSearch]);

  return (
    <div className="min-h-screen bg-[#F1F2F6] pb-20 max-w-md mx-auto shadow-2xl overflow-hidden relative border-x border-gray-100 flex flex-col">
      {/* Header */}
      <header className="bg-white p-4 sticky top-0 z-30 shadow-sm flex items-center justify-between">
        <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">
          <span className="text-primary">S</span>alendar
        </h1>
        <a 
          href={contactLink}
          target="_blank"
          rel="noopener noreferrer"
          className="px-3 py-1.5 bg-gray-900 text-white text-xs font-bold rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-1"
        >
            <span>문의하기</span>
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
        </a>
      </header>

      {/* Tabs */}
      <div className="bg-white px-4 pt-3 pb-3 border-b border-gray-100">
        <div className="flex rounded-full bg-gray-100 p-1 border border-gray-200">
          {(['calendar', 'brands'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 rounded-full px-3 py-2 text-sm font-semibold transition ${
                activeTab === tab
                  ? 'bg-gray-900 text-white shadow-sm'
                  : 'bg-transparent text-gray-600'
              }`}
            >
              {tab === 'calendar' ? '캘린더' : '브랜드'}
            </button>
          ))}
        </div>
      </div>

      {/* Search (brands tab only) */}
      {activeTab === 'brands' && (
        <div className="bg-white px-4 pb-3 pt-3 border-b border-gray-100">
          <div className="relative">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z" />
            </svg>
            <input
              type="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="브랜드명 검색"
              className="w-full rounded-lg border border-gray-200 pl-10 pr-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-grow">
        {activeTab === 'calendar' ? (
          <>
            <Calendar 
              currentDate={currentDate} 
              selectedDate={selectedDate}
              events={events}
              onDateClick={handleDateClick}
              onMonthChange={handleMonthChange}
              disablePrev={disablePrev}
              disableNext={disableNext}
            />

            <div className="sticky top-[68px] z-20">
                 <CategoryFilter 
                  selectedCategory={selectedCategory} 
                  onSelectCategory={setSelectedCategory} 
                />
            </div>

            <div className="px-5 mt-4 mb-3">
                <h2 className="text-lg font-bold text-gray-800 flex items-center justify-between">
                    <div className="flex items-baseline">
                      <span className="mr-2">{selectedDate.getMonth() + 1}월 {selectedDate.getDate()}일</span>
                      <span className="text-sm font-normal text-gray-500">
                          ({['일','월','화','수','목','금','토'][selectedDate.getDay()]})
                      </span>
                    </div>
                    {loading && <span className="text-xs text-primary animate-pulse font-medium">검색 중...</span>}
                </h2>
            </div>

            <div className="px-4 space-y-3 min-h-[300px] pb-12">
              {loading && events.length === 0 ? (
                 Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="bg-white rounded-xl h-20 animate-pulse"></div>
                 ))
              ) : filteredEvents.length > 0 ? (
                filteredEvents.map(event => (
                  <EventCard key={event.id} event={event} brandLogos={brandLogos} />
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="w-16 h-16 bg-white rounded-full shadow-sm flex items-center justify-center mb-4">
                    <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" /></svg>
                  </div>
                  <p className="text-gray-500 font-medium">
                    행사 결과가 없습니다.
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    다른 날짜나 카테고리를 선택해보세요.
                  </p>
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            <div className="px-4 py-4 pb-12 space-y-3">
              {brandsLoading && !brands.length ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="bg-white rounded-xl h-16 animate-pulse"></div>
                ))
              ) : filteredBrands.length > 0 ? (
                filteredBrands.map((brand) => {
                  return (
                    <div key={brand.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-center gap-3">
                      <img
                        src={brand.logo_url || getBrandLogo(brand.name)}
                        alt={`${brand.name} logo`}
                        className="w-12 h-12 rounded-full object-cover border border-gray-100 shadow-sm"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                      <div className="flex flex-col min-w-0">
                        <span className="text-sm font-bold text-gray-900 truncate">{brand.name}</span>
                        <span className="text-xs text-gray-500">{brand.category}</span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="w-16 h-16 bg-white rounded-full shadow-sm flex items-center justify-center mb-4">
                    <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" /></svg>
                  </div>
                  <p className="text-gray-500 font-medium">
                    {debouncedSearch ? '검색 결과가 없습니다.' : '등록된 브랜드가 없습니다.'}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    원하는 브랜드가 없다면 아래 브랜드 신청하기로 알려주세요.
                  </p>
                  <a
                    href={contactLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-900 text-white text-sm font-semibold shadow-sm hover:bg-gray-700 transition-colors"
                  >
                    브랜드 신청하기
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                  </a>
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
