'use client';

import { useQuery } from '@tanstack/react-query';
import { pb } from '../lib/pocketbase';
import { Heart, Trophy } from 'lucide-react';

interface BookProps {
  id: string;
  title?: string;
  like_count?: number;
}

export default function PopularBooksSidebar() {
  const { data: popularBooks, isPending } = useQuery<BookProps[]>({
    queryKey: ['books', 'topLiked'],
    queryFn: async () => {
      // getList(page, perPage, options)를 사용해 상위 5개의 인기 도서 조회
      const result = await pb.collection('books').getList(1, 5, {
        sort: '-like_count',
      });
      return result.items as BookProps[];
    },
  });

  return (
    <aside className="hidden xl:block fixed top-32 right-8 w-64 bg-white/90 backdrop-blur-md border border-slate-100 rounded-2xl shadow-lg p-5 transition-all duration-300 hover:shadow-xl hover:border-slate-200/60 z-30">
      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
        <Trophy size={18} className="text-amber-500" />
        <h3 className="font-extrabold text-slate-800 text-sm tracking-tight">인기 도서 TOP 5</h3>
      </div>

      {isPending ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-6 bg-slate-100 rounded animate-pulse w-full" />
          ))}
        </div>
      ) : (
        <ul className="space-y-3.5">
          {popularBooks?.map((book, index) => {
            // 순위별 스타일 설정
            const rankStyles =
              index === 0
                ? 'bg-amber-500 text-white shadow-sm shadow-amber-200'
                : index === 1
                ? 'bg-slate-400 text-white shadow-sm shadow-slate-100'
                : index === 2
                ? 'bg-amber-700 text-white shadow-sm shadow-amber-800/10'
                : 'bg-slate-100 text-slate-500';

            return (
              <li key={book.id} className="flex items-center gap-3 group">
                <span className={`w-5 h-5 flex items-center justify-center rounded-md text-[11px] font-bold shrink-0 ${rankStyles}`}>
                  {index + 1}
                </span>
                
                <a
                  href="#" // 이 부분 추후에 상세보기 만들고 실제 링크로 바꿀거임
                  onClick={(e) => {
                    e.preventDefault();
                    // 이후에 구현될 책 상세보기 모달 연동 영역
                  }}
                  className="flex-1 text-xs font-semibold text-slate-600 hover:text-indigo-600 transition-colors truncate"
                  title={book.title}
                >
                  {book.title}
                </a>

                <span className="flex items-center gap-0.5 text-[10px] text-pink-500 bg-pink-50 px-2 py-0.5 rounded-full font-bold">
                  <Heart size={8} fill="currentColor" />
                  {book.like_count || 0}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </aside>
  );
}
