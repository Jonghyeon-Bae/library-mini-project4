'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { pb } from './lib/pocketbase'
import AddBookModal from './components/AddBookModal';
import DashboardChart from './components/DashboardChart';

export interface bookProps {
  id: string
  title?: string
  contents?: string /*kakao api와 동일 이름 사용  */
  author?: string
  publisher?: string
  thumbnail?: string
  isAvailable?: boolean
  bestbook?: boolean
}

export default function Home() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [sortOption, setSortOption] = useState<string>('-created');


  // sorttabs-민영-
  const sortTabs = [
    { label: "최신순", value: "-created" },
    { label: "오래된순", value: "created" },
    { label: "제목순", value: "title" },
  ];

  const [activeIndex, setActiveIndex] = useState(0);




  // 1. 도서 목록 조회 (Read)
  const { data: books, isPending }: { data: bookProps[] | undefined; isPending: boolean } = useQuery({
    queryKey: ['books', sortOption],
    queryFn: () => pb.collection('books').getFullList({ sort: sortOption }),
  });

  // 2. 도서 삭제 (Delete)
  const deleteMutation = useMutation({
    mutationFn: (id: string) => pb.collection('books').delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['books'] }),
  });

  // 3. 대출 상태 토글 (Update)
  const toggleMutation = useMutation({
    mutationFn: ({ id, isAvailable }: { id: string, isAvailable?: boolean }) => pb.collection('books').update(id, { isAvailable: !isAvailable }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['books'] }),
  });

  return (
    <main className="max-w-5xl mx-auto p-8">
      {/* 헤더 영역 */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1>장문경의 서재</h1>
          <p className="animate-shine font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-slate-400 via-red-500 to-slate-400  mt-2">그의 은밀한 취미생활....</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="liquid-button liquid-button-primary"
        >
          + 추가
        </button>
      </div>

      {/* 대시보드 차트 (데이터가 있을 때만 렌더링) */}
      <DashboardChart books={books as bookProps[]} />

      {/* 로딩 상태 */}
      {isPending && <p className="text-center py-10 text-gray-500 text-lg">책장을 불러오는 중입니다... 🔄</p>}

      {/* 원래 있던 sort -민영- */}
      {/* 
      <div className="liquid-segmented">
        <button className="liquid-segment active" onClick={() => setSortOption('-created')}>최신순</button>
        <button className="liquid-segment" onClick={() => setSortOption('created')}>오래된순</button>
        <button className="liquid-segment" onClick={() => setSortOption('title')}>제목순</button>
      </div> */}

      {/* sortbutton - 민영- */}
      <div className="liquid-segmented">
        <div
          className="liquid-segment-indicator"
          style={{
            width: `${100 / sortTabs.length}%`,
            transform: `translateX(${activeIndex * 100}%)`,
          }}
        />

        {sortTabs.map((tab, index) => (
          <button
            key={tab.value}
            className={`liquid-segment ${activeIndex === index ? "active" : ""}`}
            onClick={() => {
              setActiveIndex(index);
              setSortOption(tab.value);
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>



      {/* 도서 목록 그리드 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 ">
        {books?.map((book) => (
          <div key={book.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden relative hover:shadow-md transition-shadow">

            {/* 삭제 버튼 */}
            <button
              onClick={() => { if (confirm('정말 삭제하시겠습니까?')) deleteMutation.mutate(book.id) }}
              className="absolute cursor-pointer hover:bg-black  top-3 right-3 bg-red-500 text-white w-7 h-7 rounded-full flex justify-center items-center text-sm opacity-80 hover:opacity-100 z-10 transition-opacity shadow-sm"
            >
              ×
            </button>
            {/* 추천! */}
            {book.bestbook ?
              <span className='absolute top-3 left-3 bg-yellow-400 text-black px-2 py-1 rounded-md font-bold'>★강추!</span>
              : <></>
            }
            {/* 썸네일 */}
            <img
              src={book.thumbnail || "https://via.placeholder.com/150"}
              alt={book.title}
              className="w-full h-56 object-cover bg-gray-100 hover:scale-110 transition-transform duration-300"
            />

            <div className="p-4">
              <h3 className="font-bold text-lg text-gray-800 line-clamp-1">{book.title}</h3>
              <p className="text-sm text-gray-500 mt-1 line-clamp-1">{book.author} | {book.publisher}</p>

              {/* 대출 토글 버튼 */}
              <button
                onClick={() => toggleMutation.mutate({ id: book.id, isAvailable: book.isAvailable })}
                className={`mt-4 w-full py-2 cursor-pointer rounded-lg font-bold text-sm transition-colors ${book.isAvailable
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

      {/* 등록 모달 */}
      <AddBookModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </main>
  );
}