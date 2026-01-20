'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setLoading(true);
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      if (!res.ok) {
        throw new Error('로그인 실패');
      }
      router.replace('/admin');
    } catch (err: any) {
      setMessage(err?.message || '로그인 실패');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F1F2F6] flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h1 className="text-xl font-extrabold text-gray-900">Admin Login</h1>
        <p className="text-sm text-gray-500 mt-1">관리자 계정으로 로그인하세요.</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <label className="text-sm font-medium text-gray-700 block">
            아이디
            <input
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="mt-2 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="아이디"
            />
          </label>
          <label className="text-sm font-medium text-gray-700 block">
            비밀번호
            <input
              required
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-2 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="비밀번호"
            />
          </label>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-gray-900 text-white text-sm font-semibold py-2.5 hover:bg-gray-700 disabled:opacity-60"
          >
            {loading ? '로그인 중...' : '로그인'}
          </button>
          {message && <p className="text-sm text-gray-500">{message}</p>}
        </form>
      </div>
    </div>
  );
}
