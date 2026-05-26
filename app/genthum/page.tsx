'use client';

// 추가_최승헌_6-2 AI 표지 이미지 생성기 테스트용 페이지 추가
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { pb } from '../lib/pocketbase';
import { bookProps } from '../page';
import AiThumbnailGenerator from './AiThumbnailGenerator';
import Link from 'next/link';
import { ArrowLeft, Sparkles, AlertCircle, RefreshCw } from 'lucide-react';

import type { RecordModel } from 'pocketbase';

export default function GenthumPage() {
  const [selectedBook, setSelectedBook] = useState<bookProps | null>(null);
  const [isGeneratorOpen, setIsGeneratorOpen] = useState(false);
  const [user, setUser] = useState<RecordModel | null>(() => {
    if (typeof window !== 'undefined') {
      return pb.authStore.model;
    }
    return null;
  });
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setTimeout(() => {
      setIsHydrated(true);
    }, 0);

    const unsubscribe = pb.authStore.onChange((token, model) => {
      setUser(model);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // 전체 도서 목록 가져오기 (테스트용)
  const { data: books, isPending, refetch } = useQuery<bookProps[]>({
    queryKey: ['books-dashboard'], // 대시보드 전체 도서 리스트 캐시 활용
    queryFn: () => pb.collection('books').getFullList({ sort: '-created' }),
    enabled: isHydrated // 하이드레이션 완료 후에 쿼리 활성화
  });

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-950 to-indigo-950 text-slate-100 p-8">
      <div className="max-w-5xl mx-auto">
        
        {/* 네비게이션 */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-400 hover:text-indigo-400 transition-colors mb-8 group"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          홈으로 돌아가기
        </Link>

        {/* 상단 소개 */}
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-8 backdrop-blur-md mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="text-indigo-400 animate-pulse" size={24} />
              <h1 className="text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">
                AI 표지 생성 테스트 베드
              </h1>
            </div>
            <p className="text-slate-400 text-sm max-w-xl">
              이 페이지는 도서 상세 보기 연동 전에 AI 표지 생성 컴포넌트(`AiThumbnailGenerator`)를 독립적으로 테스트하고 시연할 수 있는 공간입니다. 아래 도서를 선택해 표지 생성 과정을 확인해보세요.
            </p>
          </div>
          
          {isHydrated && !user && (
            <div className="flex items-center gap-2 text-amber-400 bg-amber-950/40 border border-amber-900/60 px-4.5 py-2.5 rounded-xl text-xs font-semibold">
              <AlertCircle size={15} />
              <span>표지 저장을 위해서는 로그인이 필요합니다.</span>
            </div>
          )}
        </div>

        {/* 도서 목록 영역 */}
        {isPending ? (
          <div className="text-center py-20">
            <RefreshCw className="animate-spin text-indigo-500 mx-auto mb-4" size={32} />
            <p className="text-slate-400">책장의 도서 목록을 불러오는 중...</p>
          </div>
        ) : books && books.length === 0 ? (
          <div className="text-center py-20 bg-slate-900/20 border border-dashed border-slate-800 rounded-xl">
            <p className="text-slate-500">등록된 도서가 없습니다. 홈 화면에서 책을 추가해 주세요!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {books?.map((book) => (
              <div
                key={book.id}
                onClick={() => {
                  setSelectedBook(book);
                  setIsGeneratorOpen(true);
                }}
                className="cursor-pointer bg-slate-900/50 hover:bg-slate-900 border border-slate-800/80 hover:border-indigo-500/60 rounded-xl overflow-hidden shadow-md transition-all duration-300 transform hover:-translate-y-1 flex flex-col justify-between group"
              >
                <div>
                  <div className="relative aspect-[2/3] bg-slate-950/60 overflow-hidden">
                    <img
                      src={book.thumbnail || 'https://via.placeholder.com/150'}
                      alt={book.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-slate-950/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow transition-colors flex items-center gap-1.5">
                        <Sparkles size={13} /> 표지 생성
                      </span>
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold text-sm text-slate-200 line-clamp-1 group-hover:text-indigo-400 transition-colors">
                      {book.title}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-1">{book.author}</p>
                  </div>
                </div>
                <div className="px-4 pb-4 pt-1 border-t border-slate-800/50 flex justify-between items-center text-[10px] text-slate-500 font-semibold">
                  <span>좋아요 {book.like_count || 0}</span>
                  <span className={book.isAvailable ? 'text-green-400' : 'text-red-400'}>
                    {book.isAvailable ? '대출 가능' : '대출 중'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* AI 생성 모달 컴포넌트 */}
        {selectedBook && (
          <AiThumbnailGenerator
            isOpen={isGeneratorOpen}
            onClose={() => {
              setIsGeneratorOpen(false);
              setSelectedBook(null);
            }}
            book={selectedBook}
            onUpdateSuccess={() => {
              refetch(); // 변경사항 적용 후 리스트 다시 불러오기
            }}
          />
        )}

      </div>
    </main>
  );
}
