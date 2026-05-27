'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { pb } from './lib/pocketbase'
import AddBookModal from './components/AddBookModal';
import DashboardChart from './components/DashboardChart';
import LoginModal from './login/LoginModal';
import RegisterModal from './register/RegisterModal';
import { LogIn, UserPlus, LogOut, User } from 'lucide-react';
import RankingSidebar from './components/RankingSidebar';
import Link from 'next/link';
import BookDetailView from './components/BookDetailView';
import BookListView from './components/BookListView';
import ManualAddBookModal from './components/ManualAddBookModal';


// 수정_최승헌_5-2 bookProps 업데이트 (ai_review, user_id, created, updated 필드 추가)
export interface bookProps{
  id:string
  title?:string
  contents?:string /*kakao api와 동일 이름 사용  */
  author?:string 
  publisher?:string   // Stinrg or Undefined 
  thumbnail?:string
  isAvailable?:boolean
  borrower_id?: string;
  bestbook?:boolean
  like_count?:number
  ai_review?:string
  user_id?:string
  created?:string
  updated?:string
  isbn13?:string
}

export default function Home() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [sortOption, setSortOption] = useState<string>('-created');

  // 
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);

  // 인증 관련 상태
  const [user, setUser] = useState<any>(null);
  const [isHydrated, setIsHydrated] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);

  const [selectedBook, setSelectedBook] = useState<bookProps | null>(null);
  const [page, setPage] = useState(1);
  const perPage = 8;

  useEffect(() => {
    setUser(pb.authStore.model);
    setIsHydrated(true);

    const unsubscribe = pb.authStore.onChange((token, model) => {
      setUser(model);
      queryClient.invalidateQueries({ queryKey: ['allLikeCounts'] });
    });

    return () => {
      unsubscribe();
    };
  }, [queryClient]);

  const handleLogout = useCallback(() => {
    pb.authStore.clear();
    alert('로그아웃되었습니다.');
  }, []);

  // 1. 도서 목록 조회 (Read)
  const { data, isPending } = useQuery({
    queryKey: ['books', sortOption, page],
    queryFn: () =>
      pb.collection('books').getList(page, perPage, {
        sort: sortOption,
      }),
  });

  const books = useMemo(() => {
    return (data?.items ?? []) as unknown as bookProps[];
  }, [data?.items]);
  const totalPages = data?.totalPages ?? 1;

  // 목록은 페이지네이션 데이터, 대시보드는 전체 통계 데이터가 필요해서 분리
  const { data: dashboardBooks } = useQuery({
    queryKey: ['books-dashboard'],
    queryFn: () => pb.collection('books').getFullList(),
  });

  // 최적화_useMemo로 allBooks 메모이제이션: DashboardChart의 memo 효과 극대화
  // 수정_종현_1 RankingSidebar는 내부에서 getFullList로 직접 조회하므로 여기서 전달하지 않음
  const allBooks = useMemo(() => {
    return (dashboardBooks ?? []) as unknown as bookProps[];
  }, [dashboardBooks]);

  // 최적화_useMemo를 이용한 페이지네이션 번호 계산 메모이제이션
  const visiblePages = useMemo(() => {
    const pages: number[] = [];

    // 현재 페이지 중심 앞뒤로 3페이지씩 보여주기
    const startPage = Math.max(1, page - 3);
    const endPage = Math.min(totalPages, page + 3);

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return pages;
  }, [page, totalPages]);

  // 2. 도서 삭제 (Delete)
  const deleteMutation = useMutation({
    mutationFn: (id:string) => pb.collection('books').delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['books'] });
      queryClient.invalidateQueries({ queryKey: ['books-dashboard'] });
    },
  });

  // 3. 대출 상태 토글 (Update)
  
  const toggleMutation = useMutation({
    mutationFn: ({ id, isAvailable, borrower_id } : {id:string,isAvailable?:boolean,borrower_id?:string}) =>
      pb.collection('books').update(id, { isAvailable: !isAvailable, borrower_id }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['books'] });
      queryClient.invalidateQueries({ queryKey: ['books-dashboard'] });

      // 상세 페이지에서 대출 상태 변경 시 selectedBook도 즉시 반영
      setSelectedBook((prev) => {
        if (!prev || prev.id !== variables.id) {
          return prev;
        }

        return {
          ...prev,
          isAvailable: !variables.isAvailable,
          borrower_id: variables.borrower_id,
        };
      });
    },
  });

  return (
    <main className="max-w-5xl mx-auto p-8">
      {/* 헤더 영역 */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 pb-6 border-b border-gray-100">
        
        <Link href="/" className=" items-center gap-3">
        <div>
          <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 animate-bounce">📚 5조의 도서관<span className='text-red-300'></span></h1>
          <p className="animate-shine font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-slate-400 via-red-500 to-slate-400  mt-2">그들의 취미생활....</p>
        </div>
        </Link>

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
            Search!
          </button>
          <button 
            onClick={() => setIsManualModalOpen(true)} 
            className="cursor-pointer px-6 py-2 rounded-lg font-bold text-white shadow-lg animate-rapid-blink"
          >
            CreatorMode!
          </button>
        </div>
      </div>

      {/* 대시보드 차트 (전체 데이터 기준) */}
      <DashboardChart books={allBooks} />
    
      {/* 로딩 상태 */}
      {isPending && <p className="text-center py-10 text-gray-500 text-lg">책장을 불러오는 중입니다... 🔄</p>}

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
        <BookListView
          books={books}
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

      {/* 등록 모달 */}
      <AddBookModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      {/* 수동 등록 모달 */}
      <ManualAddBookModal isOpen={isManualModalOpen} onClose={() => setIsManualModalOpen(false)} />

      {/* 로그인 모달 */}
      <LoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        onRegisterClick={() => {
          setIsLoginOpen(false);
          setIsRegisterOpen(true);
        }}
      />

      {/* 회원가입 모달 */}
      <RegisterModal
        isOpen={isRegisterOpen}
        onClose={() => setIsRegisterOpen(false)}
        onLoginClick={() => {
          setIsRegisterOpen(false);
          setIsLoginOpen(true);
        }}
      />

      {/* 좌측 플로팅 랭킹 사이드바 — 수정_종현_1 books prop 제거, 내부 getFullList 조회 */}
      <RankingSidebar onBookSelect={setSelectedBook} />
    </main>
  );
}
