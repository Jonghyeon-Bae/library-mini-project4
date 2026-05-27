'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { pb } from '../lib/pocketbase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, BookOpen, Mail, Calendar } from 'lucide-react';
import LikeButton from '../components/Likebutton';
// 수정_종현_7 메인과 동일한 BookDetailView 사용
import BookDetailView from '../components/BookDetailView';
import { bookProps } from '../page';

export default function MyPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [user, setUser] = useState<any>(null);
  const [isHydrated, setIsHydrated] = useState(false);
  // 수정_종현_7 도서 상세 보기 상태 추가
  const [selectedBook, setSelectedBook] = useState<bookProps | null>(null);

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

  // 내가 등록한 도서만 조회
  const { data: myBooks, isPending } = useQuery<bookProps[]>({
    queryKey: ['myBooks', user?.id],
    queryFn: () =>
      pb.collection('books').getFullList({
        filter: `user_id = "${user?.id}"`,
        sort: '-created',
      }),
    enabled: !!user?.id,
  });

  // 도서 삭제
  const deleteMutation = useMutation({
    mutationFn: (id: string) => pb.collection('books').delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myBooks'] });
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
                  <p className="text-3xl font-extrabold text-indigo-600">{myBooks?.length ?? '—'}</p>
                  <p className="text-xs font-semibold text-slate-500 mt-1">등록한 도서</p>
                </div>
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-100 rounded-xl px-6 py-4 text-center">
                  <p className="text-3xl font-extrabold text-green-600">
                    {myBooks?.filter((b) => b.isAvailable).length ?? '—'}
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
        {!isPending && myBooks && myBooks.length === 0 && (
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

        {/* 수정 도서 상세 보기 — 메인과 동일한 BookDetailView 사용 */}
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
          <>
            {/* 도서 목록 그리드 — 메인 BookListView 카드와 동일한 스타일 */}
            {myBooks && myBooks.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {myBooks.map((book) => (
                  <div
                    key={book.id}
                    onClick={() => setSelectedBook(book)}
                    className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden relative hover:shadow-md transition-shadow cursor-pointer"
                  >
                    {/* 삭제 버튼 */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm('정말 삭제하시겠습니까?')) deleteMutation.mutate(book.id);
                      }}
                      className="absolute cursor-pointer hover:bg-black top-3 right-3 bg-red-500 text-white w-7 h-7 rounded-full flex justify-center items-center text-sm opacity-80 hover:opacity-100 z-10 transition-opacity shadow-sm"
                    >
                      ×
                    </button>

                    {/* 추천 배지 */}
                    {book.bestbook && (
                      <span className="absolute top-3 left-3 bg-yellow-400 text-black px-2 py-1 rounded-md font-bold text-xs shadow-sm">
                        ★강추!
                      </span>
                    )}

                    {/* 썸네일 */}
                    <img
                      src={book.thumbnail || 'https://via.placeholder.com/150'}
                      alt={book.title || '도서 표지'}
                      className="w-full h-56 object-cover bg-gray-100 hover:scale-110 transition-transform duration-300"
                    />

                    <div className="p-4">
                      <h3 className="font-bold text-lg text-gray-800 line-clamp-1">{book.title}</h3>
                      <p className="text-sm text-gray-500 mt-1 line-clamp-1">
                        {book.author} | {book.publisher}
                      </p>

                      {/* 좋아요 버튼 */}
                      <div onClick={(e) => e.stopPropagation()}>
                        <LikeButton bookId={book.id} initialLikeCount={book.like_count || 0} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
