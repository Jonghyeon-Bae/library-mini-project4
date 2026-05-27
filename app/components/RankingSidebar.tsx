'use client';

import { memo, useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { bookProps } from '../page';
import { Heart, Trophy, X, Award, Loader2 } from 'lucide-react';
import { pb } from '../lib/pocketbase';

// 수정_종현_1 props에서 books 배열을 받던 방식을 제거하고,
// 내부에서 getFullList로 전체 도서를 직접 조회하여 페이지네이션과 무관한 전체 기준 랭킹을 표시

interface RankingSidebarProps {
  onBookSelect?: (book: bookProps) => void;
}

const RankingSidebar = memo(function RankingSidebar({ onBookSelect }: RankingSidebarProps) {
  const [isOpen, setIsOpen] = useState(false);

  // 추가_종현_1 전체 도서를 like_count 내림차순으로 최대 10개 가져옴
  // query key: ['books-ranking'] — 페이지/정렬 옵션과 독립적
  const { data: ranked , isLoading } = useQuery<bookProps[]>({
    queryKey: ['books-ranking'],
    queryFn: async () => {
      const records = await pb.collection('books').getFullList<bookProps>({
        sort: '-like_count',
      });
      return records.slice(0, 10);
    },
    staleTime: 0, // 1분 캐시
  });

  // 실시간 반영: PocketBase realtime으로 변경 발생 시 쿼리 무효화하여 최신 데이터 재조회
  const queryClient = useQueryClient();
  useEffect(() => {
    let unsubscribe: any;
    const initSubscription = async () => {
      try {
        unsubscribe = await pb.collection('books').subscribe('*', () => {
          queryClient.invalidateQueries({ queryKey: ['books-ranking'] });
        });
      } catch (e) {
        console.error(e);
        // 구독 실패 시 무시
      }
    };
    initSubscription();
    return () => {
      if (unsubscribe && typeof unsubscribe.unsubscribe === 'function') {
        unsubscribe.unsubscribe();
      }
    };
  }, [queryClient]);
  
  // ranked는 useQuery로부터 받아온 전체 도서 기준의 랭킹 목록입니다.
  if (!ranked || ranked.length === 0) return null;
  const handleBookClick = (book: bookProps) => {
    if (onBookSelect) {
      onBookSelect(book);
    }
    setIsOpen(false); // 모바일 모달 열려있으면 닫기
  };

  const renderRankingList = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center py-8 text-slate-400">
          <Loader2 size={20} className="animate-spin mr-2" />
          <span className="text-xs">불러오는 중...</span>
        </div>
      );
    }

    if (ranked.length === 0) {
      return (
        <p className="text-xs text-slate-400 text-center py-6">등록된 도서가 없습니다.</p>
      );
    }

    return (
      <ul className="space-y-3">
        {ranked.map((book, idx) => {
          // 1, 2, 3위 트로피 색상 지정
          const isTop3 = idx < 3;
          const trophyColor =
            idx === 0
              ? 'text-amber-500 hover:scale-110'
              : idx === 1
              ? 'text-slate-400'
              : 'text-amber-700';

          return (
            <li
              key={book.id}
              onClick={() => handleBookClick(book)}
              className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-all duration-200 cursor-pointer group"
            >
              {/* 순위 표시: 1-3위는 트로피, 그 외는 숫자 */}
              <div className="shrink-0 w-6 h-6 flex items-center justify-center">
                {isTop3 ? (
                  <Trophy size={18} className={`${trophyColor} transition-transform duration-300`} />
                ) : (
                  <span className="text-xs font-bold text-slate-400 group-hover:text-slate-600">
                    {idx + 1}
                  </span>
                )}
              </div>

              {/* 책 정보 */}
              <div className="flex-1 min-w-0">
                <p
                  className="text-xs font-bold text-slate-700 group-hover:text-indigo-600 transition-colors truncate"
                  title={book.title}
                >
                  {book.title}
                </p>
                <p className="text-[10px] text-slate-400 truncate">
                  {book.author}
                </p>
              </div>

              {/* 좋아요 개수 */}
              <div className="shrink-0">
                <span className="flex items-center gap-0.5 text-[10px] text-pink-500 bg-pink-50 px-2 py-0.5 rounded-full font-bold transition-transform group-hover:scale-105">
                  <Heart size={8} fill="currentColor" />
                  {book.like_count ?? 0}
                </span>
              </div>
            </li>
          );
        })}
      </ul>
    );
  };

  return (
    <>
      {/* 1. 데스크톱 뷰 (화면 좌측 고정 플로팅 사이드바) */}
      <aside className="hidden xl:block fixed top-32 left-8 w-64 bg-white/90 backdrop-blur-md border border-slate-100 rounded-2xl shadow-lg p-5 transition-all duration-300 hover:shadow-xl hover:border-slate-200/60 z-30">
        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
          <Award size={18} className="text-indigo-500" />
          <h3 className="font-extrabold text-slate-800 text-sm tracking-tight">인기 도서 TOP 10</h3>
        </div>
        {renderRankingList()}
      </aside>

      {/* 2. 모바일/태블릿용 플로팅 토글 버튼 */}
      <button
        onClick={() => setIsOpen(true)}
        className="xl:hidden fixed bottom-6 left-6 z-40 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold px-4 py-3 rounded-full shadow-xl flex items-center gap-2 transition-all duration-200 hover:scale-105 active:scale-95"
      >
        <Trophy size={16} fill="currentColor" className="text-amber-300 animate-pulse" />
        <span className="text-xs tracking-wide">도서 랭킹</span>
      </button>

      {/* 3. 모바일/태블릿용 모달 오버레이 */}
      {isOpen && (
        <div className="xl:hidden fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 transition-all duration-300">
          <div className="bg-white rounded-2xl w-full max-w-sm max-h-[80vh] flex flex-col p-5 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            {/* 닫기 버튼 */}
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <X size={18} />
            </button>

            {/* 헤더 */}
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100 pr-8">
              <Trophy size={18} className="text-amber-500" />
              <h3 className="font-extrabold text-slate-800 text-sm tracking-tight">인기 도서 TOP 10</h3>
            </div>

            {/* 스크롤 가능한 랭킹 리스트 */}
            <div className="flex-1 overflow-y-auto pr-1">
              {renderRankingList()}
            </div>
          </div>
        </div>
      )}
    </>
  );
}); export default RankingSidebar;