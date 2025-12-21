'use client';

export default function DashboardError({ error }: { error: Error }) {
  return (
    <div className="p-6 text-red-600">
      대시보드를 불러오는 중 오류가 발생했습니다: {error.message}
    </div>
  );
}
