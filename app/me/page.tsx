'use client';

import { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { pb } from '../lib/pocketbase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, BookOpen, Mail, Calendar } from 'lucide-react';
import BookDetailView from '../components/BookDetailView';
import BookListView from '../components/BookListView';
import { bookProps } from '../page';

export default function MyPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [user, setUser] = useState<any>(null);
  const [isHydrated, setIsHydrated] = useState(false);
  const [selectedBook, setSelectedBook] = useState<bookProps | null>(null);
  const [page, setPage] = useState(1);
  const [sortOption, setSortOption] = useState<string>('-created');
  const perPage = 8;

  useEffect(() => {
    const currentUser = pb.authStore.model;
    setUser(currentUser);
    setIsHydrated(true);

    if (!currentUser) {
      alert('로그인이 필요합니다.');
      router.push('/');
    }

    const unsubscribe = pb.authStore.onChange((_token, model) => {
      setUser(model);
      if (!model) {
        router.push('/');
      }
    });

    return () => {
      unsubscribe();
    };
  }, [router]);

  // 내가 등록한 도서 — 페이지네이션 적용
  const { data, isPending } = useQuery({
    queryKey: ['myBooks', user?.id, sortOption, page],
    queryFn: () =>
      pb.collection('books').getList(page, perPage, {
        filter: `user_id = "${user?.id}"`,
        sort: sortOption,
      }),
    enabled: !!user?.id,
  });

  const myBooks = useMemo(() => {
    return (data?.items ?? []) as unknown as bookProps[];
  }, [data?.items]);
  const totalPages = data?.totalPages ?? 1;

  // 통계 카드용 전체 목록 (페이지네이션과 별도)
  const { data: myBooksAll } = useQuery<bookProps[]>({
    queryKey: ['myBooks-stats', user?.id],
    queryFn: () =>
      pb.collection('books').getFullList({
        filter: `user_id = "${user?.id}"`,
      }),
    enabled: !!user?.id,
  });

  // 도서 삭제
  const deleteMutation = useMutation({
    mutationFn: (id: string) => pb.collection('books').delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myBooks'] });
      queryClient.invalidateQueries({ queryKey: ['myBooks-stats'] });
      queryClient.invalidateQueries({ queryKey: ['books'] });
      queryClient.invalidateQueries({ queryKey: ['books-dashboard'] });
    },
  });

  // 대출 상태 토글 — 메인 페이지와 동일하게 borrower_id 지원
  const toggleMutation = useMutation({
    mutationFn: ({ id, isAvailable, borrower_id }: { id: string; isAvailable?: boolean; borrower_id?: string }) =>
      pb.collection('books').update(id, { isAvailable: !isAvailable, borrower_id }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['myBooks'] });
      queryClient.invalidateQueries({ queryKey: ['myBooks-stats'] });
      queryClient.invalidateQueries({ queryKey: ['books'] });
      queryClient.invalidateQueries({ queryKey: ['books-dashboard'] });

      // 상세 페이지에서 대출 상태 변경 시 selectedBook도 즉시 반영
      setSelectedBook((prev) => {
        if (!prev || prev.id !== variables.id) return prev;
        return {
          ...prev,
          isAvailable: !variables.isAvailable,
          borrower_id: variables.borrower_id,
        };
      });
    },
  });

  // 페이지네이션 번호 계산
  const visiblePages = useMemo(() => {
    const pages: number[] = [];
    const startPage = Math.max(1, page - 3);
    const endPage = Math.min(totalPages, page + 3);
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    return pages;
  }, [page, totalPages]);

  if (!isHydrated || !user) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-indigo-50">
        <p className="text-gray-500 text-lg">로딩 중...</p>
      </main>
    );
  }

  const joinDate = user.created
    ? new Date(user.created).toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : '알 수 없음';

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50">
      <div className="max-w-5xl mx-auto p-8">
        {/* 상단 네비게이션 */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-indigo-600 transition-colors mb-8 group"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          홈으로 돌아가기
        </Link>

        {/* 프로필 카드 영역 */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 p-[1px] mb-10 shadow-xl shadow-indigo-200/50">
          <div className="rounded-2xl bg-white/95 backdrop-blur-sm p-8">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
              {/* 아바타 */}
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-3xl font-bold shadow-lg shadow-indigo-300/50 shrink-0">
                {(user.name || user.email || '?')[0].toUpperCase()}
              </div>

              {/* 유저 정보 */}
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl font-extrabold text-gray-900 mb-1">
                  {user.name || '이름 미설정'}
                </h1>
                <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-500 mt-2">
                  <span className="flex items-center gap-1.5">
                    <Mail size={14} className="text-indigo-400" />
                    {user.email}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Calendar size={14} className="text-indigo-400" />
                    {joinDate} 가입
                  </span>
                </div>
              </div>

              {/* 통계 카드 */}
              <div className="flex gap-4 shrink-0">
                <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100 rounded-xl px-6 py-4 text-center">
                  <p className="text-3xl font-extrabold text-indigo-600">{myBooksAll?.length ?? '—'}</p>
                  <p className="text-xs font-semibold text-slate-500 mt-1">등록한 도서</p>
                </div>
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-100 rounded-xl px-6 py-4 text-center">
                  <p className="text-3xl font-extrabold text-green-600">
                    {myBooksAll?.filter((b) => b.isAvailable).length ?? '—'}
                  </p>
                  <p className="text-xs font-semibold text-slate-500 mt-1">대출 가능</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 섹션 타이틀 */}
        <div className="flex items-center gap-3 mb-6">
          <BookOpen size={22} className="text-indigo-500" />
          <h2 className="text-xl font-bold text-gray-800">내가 등록한 도서</h2>
        </div>

        {/* 로딩 */}
        {isPending && (
          <p className="text-center py-16 text-gray-400 text-lg">도서 목록을 불러오는 중... 🔄</p>
        )}

        {/* 빈 상태 */}
        {!isPending && (data?.totalItems ?? 0) === 0 && (
          <div className="text-center py-20 px-4">
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-indigo-50 mb-6">
              <BookOpen size={40} className="text-indigo-300" />
            </div>
            <h3 className="text-lg font-bold text-gray-700 mb-2">아직 등록한 도서가 없습니다</h3>
            <p className="text-sm text-gray-400 mb-6">메인 화면에서 도서를 검색하고 등록해 보세요!</p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 py-3 rounded-lg text-sm shadow-md transition-colors"
            >
              도서 등록하러 가기
            </Link>
          </div>
        )}

        {/* 도서 상세 보기 — 메인과 동일한 BookDetailView 사용 */}
        {selectedBook ? (
          <BookDetailView
            selectedBook={selectedBook}
            onBack={() => setSelectedBook(null)}
            toggleMutation={toggleMutation}
            deleteMutation={deleteMutation}
            onDelete={() => setSelectedBook(null)}
            onUpdateBook={setSelectedBook}
          />
        ) : (
          /* 도서 목록 — 메인과 동일한 BookListView + 페이지네이션 */
          <BookListView
            books={myBooks}
            totalPages={totalPages}
            page={page}
            visiblePages={visiblePages}
            sortOption={sortOption}
            setPressSetSelectedBook={setSelectedBook}
            setSortOption={setSortOption}
            setPage={setPage}
            deleteMutation={deleteMutation}
          />
        )}
      </div>
    </main>
  );
}
