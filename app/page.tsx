'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { pb } from './lib/pocketbase'
import AddBookModal from './components/AddBookModal';
import DashboardChart from './components/DashboardChart';
import LoginModal from './login/LoginModal';
import RegisterModal from './register/RegisterModal';
import { LogIn, UserPlus, LogOut, User } from 'lucide-react';
import LikeButton from './components/Likebutton';
import Link from 'next/link';
import PopularBooksSidebar from './components/PopularBooksSidebar';

// 수정_최승헌_5-2 bookProps 업데이트 (ai_review, user_id, created, updated 필드 추가)
export interface bookProps{
  id:string
  title?:string
  contents?:string /*kakao api와 동일 이름 사용  */
  author?:string
  publisher?:string
  thumbnail?:string
  isAvailable?:boolean
  bestbook?:boolean
  like_count?:number
  ai_review?:string
  user_id?:string
  created?:string
  updated?:string
}
// 수정_최승헌_5-2 완료

export default function Home() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [sortOption, setSortOption] = useState<string>('-created');

  // 인증 관련 상태
  const [user, setUser] = useState<any>(null);
  const [isHydrated, setIsHydrated] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);

  // 추가_최승헌_3-1 선택된 도서 정보 추가
  const [selectedBook, setSelectedBook] = useState<bookProps | null>(null);
  // 추가_최승헌_3-1 완료

  // 수정_최승헌_1-1 페이지네이션 상태 추가
  const [page, setPage] = useState(1);
  const perPage = 8;

  useEffect(() => {
    setUser(pb.authStore.model);
    setIsHydrated(true);

    const unsubscribe = pb.authStore.onChange((token, model) => {
      setUser(model);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const handleLogout = () => {
    pb.authStore.clear();
    alert('로그아웃되었습니다.');
  };

  // 1. 도서 목록 조회 (Read)
  // 수정_최승헌_1-1 페이지네이션 추가된 도서 목록 조회
  const { data, isPending } = useQuery({
    queryKey: ['books', sortOption, page],
    queryFn: () =>
      pb.collection('books').getList(page, perPage, {
        sort: sortOption,
      }),
  });

  const books = (data?.items ?? []) as unknown as bookProps[];
  const totalPages = data?.totalPages ?? 1;

  // 추가_최승헌_4-1 대시보드용 전체 도서 데이터 조회
  // 목록은 페이지네이션 데이터, 대시보드는 전체 통계 데이터가 필요해서 분리
  const { data: dashboardBooks } = useQuery({
    queryKey: ['books-dashboard'],
    queryFn: () => pb.collection('books').getFullList(),
  });

  const allBooks = (dashboardBooks ?? []) as unknown as bookProps[];
  // 추가_최승헌_4-1 완료

  // 페이지네이션에서 보여줄 페이지 번호 계산 함수
  const getVisiblePages = () => {
    const pages: number[] = [];

    // 현재 페이지 중심 앞뒤로 3페이지씩 보여주기
    const startPage = Math.max(1, page - 3);
    const endPage = Math.min(totalPages, page + 3);

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return pages;
  };

  const visiblePages = getVisiblePages();
  // 수정_최승헌_1-1 완료

  // 2. 도서 삭제 (Delete)
  
  const deleteMutation = useMutation({
    mutationFn: (id:string) => pb.collection('books').delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['books'] });
      // 추가_최승헌_4-3 도서 삭제 시 대시보드용 쿼리 갱신 추가
      queryClient.invalidateQueries({ queryKey: ['books-dashboard'] });
      // 추가_최승헌_4-3 완료
    },
  });


  // 3. 대출 상태 토글 (Update)
  
  // 수정_최승헌_5-3 상세 정보에서 대출 상태 변경 시 selectedBook도 즉시 반영
  const toggleMutation = useMutation({
    mutationFn: ({ id, isAvailable } : {id:string,isAvailable?:boolean}) =>
      pb.collection('books').update(id, { isAvailable: !isAvailable }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['books'] });
      // 추가_최승헌_4-4 도서 대출 시 대시보드용 쿼리 갱신 추가
      queryClient.invalidateQueries({ queryKey: ['books-dashboard'] });
        // 추가_최승헌_4-4 완료

      // 상세 페이지에서 대출 상태 변경 시 selectedBook도 즉시 반영
      setSelectedBook((prev) => {
        if (!prev || prev.id !== variables.id) {
          return prev;
        }

        return {
          ...prev,
          isAvailable: !variables.isAvailable,
        };
      });
    },
  });
  // 수정_최승헌_5-3 완료

  return (
    <main className="max-w-5xl mx-auto p-8">
      {/* 헤더 영역 */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 pb-6 border-b border-gray-100">
        <div>
          <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 animate-bounce">📚 오승헌의 직박구리<span className='text-red-300'>🔞</span></h1>
          <p className="animate-shine font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-slate-400 via-red-500 to-slate-400  mt-2">그의 은밀한 취미생활....</p>
        </div>

        {/* Buttons / Auth Section */}
        <div className="flex items-center gap-3 self-end md:self-auto">
          {isHydrated && user ? (
            <>
              <span className="text-sm font-semibold text-slate-700 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200/50 flex items-center">
                {user.name || user.email}
              </span>
              <Link
                href="/me"
                className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-2 rounded-lg text-sm shadow-md transition-colors"
              >
                <User size={16} />
                마이페이지
              </Link>
              <button
                onClick={handleLogout}
                className="cursor-pointer flex items-center gap-1.5 bg-slate-800 hover:bg-slate-900 text-white font-bold px-4 py-2 rounded-lg text-sm shadow-md transition-colors"
              >
                <LogOut size={16} />
                로그아웃
              </button>
            </>
          ) : (
            isHydrated && (
              <>
                <button
                  onClick={() => setIsRegisterOpen(true)}
                  className="cursor-pointer flex items-center gap-1.5 bg-purple-600 hover:bg-purple-700 text-white font-bold px-4 py-2 rounded-lg text-sm shadow-md transition-colors"
                >
                  <UserPlus size={16} />
                  회원가입
                </button>

                <button
                  onClick={() => setIsLoginOpen(true)}
                  className="cursor-pointer flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded-lg text-sm shadow-md transition-colors"
                >
                  <LogIn size={16} />
                  로그인
                </button>

              </>
            )
          )}

          <button 
            onClick={() => setIsModalOpen(true)} 
            className="cursor-pointer px-6 py-2 rounded-lg font-bold text-white shadow-lg animate-rapid-blink"
          >
            + 추가
          </button>
        </div>
      </div>

      {/* 대시보드 차트 (전체 데이터 기준) */}
      {/* 수정_최승헌_4-2 대시보드 차트에 전체 도서 데이터(allBooks) 전달하도록 변경 */}
      <DashboardChart books={allBooks} />
      {/* 수정_최승헌_4-2 완료 */}

      {/* 로딩 상태 */}
      {isPending && <p className="text-center py-10 text-gray-500 text-lg">책장을 불러오는 중입니다... 🔄</p>}

      {/* 추가_최승헌_5-1 도서 상세 정보 페이지 추가 */}
      {/* 선택된 책이 있으면 상세 정보 영역, 없으면 목록과 정렬 버튼 영역 */}
      {selectedBook ? (
        <section className="mt-6 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          {/* 상단 영역 */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <button
              onClick={() => setSelectedBook(null)}
              className="w-fit px-4 py-2 rounded-lg border text-sm font-bold hover:bg-gray-100"
            >
              ← 목록으로
            </button>

            <div className="flex flex-wrap gap-2">
              {selectedBook.bestbook && (
                <span className="bg-yellow-400 text-black px-3 py-1 rounded-md font-bold text-sm">
                  ★ 강추 도서
                </span>
              )}

              <span
                className={`px-3 py-1 rounded-md font-bold text-sm ${
                  selectedBook.isAvailable
                    ? "bg-green-100 text-green-700"
                    : "bg-red-100 text-red-700"
                }`}
              >
                {selectedBook.isAvailable ? "대출 가능" : "대출 중"}
              </span>
            </div>
          </div>

          {/* 메인 정보 영역 */}
          <div className="grid grid-cols-1 md:grid-cols-[320px_1fr] gap-8">
            {/* 왼쪽: 표지 */}
            <div className="bg-gray-50 rounded-2xl border border-gray-100 p-4">
              <img
                src={selectedBook.thumbnail || "https://via.placeholder.com/300"}
                alt={selectedBook.title || "도서 표지"}
                className="w-full h-[420px] object-cover rounded-xl bg-gray-100"
              />
            </div>

            {/* 오른쪽: 기본 정보 */}
            <div className="flex flex-col justify-between">
              <div>
                <h2 className="text-3xl font-extrabold text-gray-800 mb-6 leading-tight">
                  {selectedBook.title || "제목 없음"}
                </h2>

                <div className="space-y-3">
                  <div className="flex border-b border-gray-100 pb-3">
                    <span className="w-24 shrink-0 text-sm font-bold text-gray-500">
                      저자
                    </span>
                    <span className="text-gray-800">
                      {selectedBook.author || "정보 없음"}
                    </span>
                  </div>

                  <div className="flex border-b border-gray-100 pb-3">
                    <span className="w-24 shrink-0 text-sm font-bold text-gray-500">
                      출판사
                    </span>
                    <span className="text-gray-800">
                      {selectedBook.publisher || "정보 없음"}
                    </span>
                  </div>

                  <div className="flex border-b border-gray-100 pb-3">
                    <span className="w-24 shrink-0 text-sm font-bold text-gray-500">
                      등록일
                    </span>
                    <span className="text-gray-800">
                      {selectedBook.created
                        ? new Date(selectedBook.created).toLocaleDateString()
                        : "정보 없음"}
                    </span>
                  </div>

                  <div className="flex border-b border-gray-100 pb-3">
                    <span className="w-24 shrink-0 text-sm font-bold text-gray-500">
                      수정일
                    </span>
                    <span className="text-gray-800">
                      {selectedBook.updated
                        ? new Date(selectedBook.updated).toLocaleDateString()
                        : "정보 없음"}
                    </span>
                  </div>

                  <div className="flex border-b border-gray-100 pb-3">
                    <span className="w-24 shrink-0 text-sm font-bold text-gray-500">
                      좋아요
                    </span>
                    <span className="text-gray-800">
                      {selectedBook.like_count ?? 0}개
                    </span>
                  </div>
                </div>
              </div>

              {/* 수정_최승헌_5-3 상세 페이지 안에서도 대출 상태 변경 가능 (selectedBook 즉시 반영) */}
              <button
                onClick={() =>
                  toggleMutation.mutate({
                    id: selectedBook.id,
                    isAvailable: selectedBook.isAvailable,
                  })
                }
                disabled={toggleMutation.isPending}
                className={`mt-8 w-full py-3 rounded-xl font-bold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                  selectedBook.isAvailable
                    ? "bg-green-100 text-green-700 hover:bg-green-200"
                    : "bg-red-100 text-red-700 hover:bg-red-200"
                }`}
              >
                {toggleMutation.isPending
                  ? "처리 중..."
                  : selectedBook.isAvailable
                    ? "대출하기"
                    : "반납하기"}
              </button>
            </div>
          </div>

          {/* 책 소개 영역 */}
          <div className="mt-8 bg-gray-50 rounded-2xl border border-gray-100 p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-3">
              책 소개
            </h3>

            <p className="text-gray-600 leading-7 whitespace-pre-line">
              {selectedBook.contents || "등록된 책 소개가 없습니다."}
            </p>
          </div>

          {/* AI 리뷰 영역 */}
          <div className="mt-6 bg-blue-50 rounded-2xl border border-blue-100 p-6">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xl">🤖</span>
              <h3 className="text-xl font-bold text-gray-800">
                AI 리뷰 / 요약
              </h3>
            </div>

            <p className="text-gray-700 leading-7 whitespace-pre-line">
              {selectedBook.ai_review || "아직 등록된 AI 리뷰가 없습니다."}
            </p>
          </div>

          {/* 관리 버튼 영역 */}
          <div className="mt-6 flex justify-end">
            <button
              onClick={() => {
                if (confirm("정말 삭제하시겠습니까?")) {
                  deleteMutation.mutate(selectedBook.id);
                  setSelectedBook(null);
                }
              }}
              className="px-4 py-2 rounded-lg bg-red-500 text-white text-sm font-bold hover:bg-red-600"
            >
              도서 삭제
            </button>
          </div>
        </section>
      ) : (
        <>
          {/* 추가_최승헌_5-1 완료 */}

          {/* 수정_최승헌_2-1 정렬 버튼 영역 UI 개선 (border 스타일 + 활성 상태 색상) */}
          {/* 정렬 버튼 영역 */}
          <div className="flex gap-3 mb-6 mt-4">
            <button
              onClick={() => {
                setSortOption('-created');
                setPage(1);
              }}
              className={`px-3 py-2 rounded-lg border text-sm font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-100 ${
                sortOption === '-created' ? 'text-blue-500 border-blue-200 bg-blue-50' : 'text-gray-500'
              }`}
            >
              최신순
            </button>

            <button
              onClick={() => {
                setSortOption('created');
                setPage(1);
              }}
              className={`px-3 py-2 rounded-lg border text-sm font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-100 ${
                sortOption === 'created' ? 'text-violet-500 border-violet-200 bg-violet-50' : 'text-gray-500'
              }`}
            >
              오래된 순
            </button>

            <button
              onClick={() => {
                setSortOption('title');
                setPage(1);
              }}
              className={`px-3 py-2 rounded-lg border text-sm font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-100 ${
                sortOption === 'title' ? 'text-cyan-500 border-cyan-200 bg-cyan-50' : 'text-gray-500'
              }`}
            >
              제목순
            </button>
          </div>
          {/* 수정_최승헌_2-1 완료 */}

          {/* 도서 목록 그리드 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 ">
            {/* 수정_최승헌_3-2 도서 카드 클릭 시 선택 정보 추가 */}
            {books?.map((book) => (
              <div
                key={book.id}
                onClick={() => setSelectedBook(book)}
                className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden relative hover:shadow-md transition-shadow cursor-pointer"
              >
            {/* 수정_최승헌_3-2 완료 */}

                {/* 삭제 버튼 */}
                <button 
                  onClick={(e) => {
                    // 추가_최승헌_3-3 버튼 이벤트 전파 방지
                    e.stopPropagation();
                    // 추가_최승헌_3-3 완료

                    if(confirm('정말 삭제하시겠습니까?')) {
                      deleteMutation.mutate(book.id);
                    }
                  }}
                  className="absolute cursor-pointer hover:bg-black top-3 right-3 bg-red-500 text-white w-7 h-7 rounded-full flex justify-center items-center text-sm opacity-80 hover:opacity-100 z-10 transition-opacity shadow-sm"
                >
                  ×
                </button>

                {/* 추천! */}
                {book.bestbook ? (
                  <span className='absolute top-3 left-3 bg-yellow-400 text-black px-2 py-1 rounded-md font-bold'>★강추!</span>
                ) : <></>}

                {/* 썸네일 */}
                <img 
                  src={book.thumbnail || "https://via.placeholder.com/150"} 
                  alt={book.title || "도서 표지"} 
                  className="w-full h-56 object-cover bg-gray-100 hover:scale-110 transition-transform duration-300" 
                />

                <div className="p-4">
                  <h3 className="font-bold text-lg text-gray-800 line-clamp-1">{book.title}</h3>
                  <p className="text-sm text-gray-500 mt-1 line-clamp-1">{book.author} | {book.publisher}</p>

                  {/* 💡 독립된 LikeButton 컴포넌트 사용 (원본 page.tsx 기능 유지) */}
                  {/* 추가_최승헌_3-3 좋아요 버튼도 카드 클릭 이벤트 전파 방지 */}
                  <div onClick={(e) => e.stopPropagation()}>
                    <LikeButton bookId={book.id} initialLikeCount={book.like_count || 0} />
                  </div>
                  {/* 추가_최승헌_3-3 완료 */}

                  {/* 대출 토글 버튼 */}
                  <button 
                    onClick={(e) => {
                      // 추가_최승헌_3-3 버튼 이벤트 전파 방지
                      e.stopPropagation();
                      // 추가_최승헌_3-3 완료

                      toggleMutation.mutate({
                        id: book.id,
                        isAvailable: book.isAvailable,
                      });
                    }}
                    className={`mt-4 w-full py-2 cursor-pointer rounded-lg font-bold text-sm transition-colors ${
                      book.isAvailable 
                        ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                        : 'bg-red-100 text-red-700 hover:bg-red-200'
                    }`}
                  >
                    {book.isAvailable ? '대출 가능' : '대출 중'}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* 추가_최승헌_1-2 페이지네이션 UI 버튼 추가 */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-8 mb-10">
              <button
                onClick={() => setPage(1)}
                disabled={page === 1}
                className="px-3 py-2 rounded-lg border text-sm font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-100"
              >
                처음
              </button>

              <button
                onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                disabled={page === 1}
                className="px-3 py-2 rounded-lg border text-sm font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-100"
              >
                이전
              </button>

              {visiblePages.map((pageNum) => (
                <button
                  key={pageNum}
                  onClick={() => setPage(pageNum)}
                  className={`px-3 py-2 rounded-lg border text-sm font-bold ${
                    page === pageNum
                      ? 'bg-black text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {pageNum}
                </button>
              ))}

              <button
                onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={page === totalPages}
                className="px-3 py-2 rounded-lg border text-sm font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-100"
              >
                다음
              </button>

              <button
                onClick={() => setPage(totalPages)}
                disabled={page === totalPages}
                className="px-3 py-2 rounded-lg border text-sm font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-100"
              >
                끝
              </button>
            </div>
          )}
          {/* 추가_최승헌_1-2 완료 */}
        </>
      )}

      {/* 등록 모달 */}
      <AddBookModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />

      {/* 로그인 모달 */}
      <LoginModal 
        isOpen={isLoginOpen} 
        onClose={() => setIsLoginOpen(false)} 
        onRegisterClick={() => setIsRegisterOpen(true)} 
      />

      {/* 회원가입 모달 */}
      <RegisterModal 
        isOpen={isRegisterOpen} 
        onClose={() => setIsRegisterOpen(false)} 
        onLoginClick={() => setIsLoginOpen(true)} 
      />

      {/* 우측 플로팅 인기 도서 사이드바 */}
      <PopularBooksSidebar />
    </main>
  );
}
