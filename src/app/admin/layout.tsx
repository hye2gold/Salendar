'use client';

import React from 'react';
import { usePathname } from 'next/navigation';

const NAV_ITEMS = [
  { href: '/admin', label: '전체 관리' },
  { href: '/admin/brands/new', label: '브랜드 추가' },
  { href: '/admin/calendar', label: '캘린더 편집' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLogin = pathname.startsWith('/admin/login');

  if (isLogin) return <>{children}</>;

  return (
    <div className="min-h-screen bg-[#F1F2F6] md:flex">
      <aside className="hidden md:flex md:flex-col md:w-64 bg-white border-r border-gray-100">
        <div className="p-6 border-b border-gray-100">
          <h1 className="text-xl font-extrabold text-gray-900">Salendar Admin</h1>
          <p className="text-xs text-gray-500 mt-1">관리자 도구</p>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            return (
              <a
                key={item.href}
                href={item.href}
                className={`block px-4 py-2 rounded-lg text-sm font-semibold transition ${
                  isActive ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                {item.label}
              </a>
            );
          })}
        </nav>
        <div className="p-4 border-t border-gray-100 space-y-2">
          <button
            type="button"
            onClick={async () => {
              await fetch('/api/admin/logout', { method: 'POST' });
              window.location.href = '/admin/login';
            }}
            className="w-full px-4 py-2 rounded-lg border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            로그아웃
          </button>
          <a
            href="/dashboard"
            className="block w-full text-center px-4 py-2 rounded-lg border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            대시보드로 이동
          </a>
        </div>
      </aside>

      <div className="flex-1">
        <div className="md:hidden bg-white border-b border-gray-100 px-4 py-3">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-extrabold text-gray-900">Salendar Admin</h1>
            <button
              type="button"
              onClick={async () => {
                await fetch('/api/admin/logout', { method: 'POST' });
                window.location.href = '/admin/login';
              }}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-gray-200 text-gray-700"
            >
              로그아웃
            </button>
          </div>
          <div className="mt-3 flex gap-2">
            {NAV_ITEMS.map((item) => {
              const isActive = pathname === item.href;
              return (
                <a
                  key={item.href}
                  href={item.href}
                  className={`flex-1 text-center px-2 py-2 rounded-lg text-xs font-semibold ${
                    isActive ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {item.label}
                </a>
              );
            })}
          </div>
        </div>
        <main className="p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}
