'use client';
import { memo } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';
import { bookProps } from '../page';

const DashboardChart = memo(function DashboardChart({ books }: { books: bookProps[] }) {
  if (!books || books.length === 0) return null;

  // 데이터 가공하기
  const availableCount = books.filter(b => b.isAvailable).length;
  const borrowedCount = books.length - availableCount;

  const data = [
    { name: '대출 가능', value: availableCount },
    { name: '대출 중', value: borrowedCount },
  ];
  const COLORS = ['#22c55e', '#ef4444']; // 초록, 빨강

  return (
    <div className="bg-white p-6 rounded-lg shadow mb-8 flex justify-center items-center">
      <div className="text-center mr-10">
        <h3 className="text-xl font-bold text-gray-700">도서관 현황</h3>
        <p className="text-sm text-gray-500 mt-2">총 {books.length}권의 도서</p>
      </div>
      <PieChart width={300} height={200}>
        <Pie data={data} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip />
        <Legend />
      </PieChart>
    </div>
  );
});

export default DashboardChart
