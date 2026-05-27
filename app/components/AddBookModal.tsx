'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { pb } from '../lib/pocketbase';
import { searchBookFromKakao } from '../lib/kakaoApi';
import { searchBookFromAladin, lookupBookMetricsFromAladin } from '../lib/aladinApi';
import { Search, X, Clock, Loader2 } from 'lucide-react';
import { bookProps } from '../page';

interface AddBookModalProps{
  isOpen:boolean
  onClose:()=>void
}

interface NewBookProps{
  id?:string
  title?:string
  author?:string
  publisher?:string
  thumbnail?:string
  isAvailable?:boolean
  bestbook?:boolean
  category?:string
  sales?: number
  contents?:string // 알라딘의 description을 저장할 필드 추가(장문경)
  user_id?:string
  ai_review?: string; //AI 리뷰 필드 추가 (장문경)
}

export default function AddBookModal({ isOpen, onClose }:AddBookModalProps) {
  const queryClient = useQueryClient();
  const [keyword, setKeyword] = useState('');
  const [results, setResults] = useState([]);

  // 현재 상세 지표를 조회/등록 중인 아이템의 인덱스 상태 관리 (버튼 로딩 처리용)
  const [registeringIdx, setRegisteringIdx] = useState<number | null>(null);

  // 현재 로그인한 유저 정보 가져오기
  const currentUser = pb.authStore.model;

  // 최근 검색어 5개 불러오기 (Read)
  const { data: historyData } = useQuery({
    queryKey: ['searchHistory', currentUser?.id],
    queryFn: () => pb.collection('search_history').getList(1, 5, {
      filter: `user = "${currentUser?.id}"`,
      sort: '-created', // 최신순 정렬
    }),
    enabled: !!currentUser?.id, // 유저 ID가 있을 때만 쿼리 실행
  });

  // 불러온 데이터에서 items 배열만 추출 (없으면 빈 배열)
  const recentSearches = historyData?.items || [];

  // DB에 저장하는 Mutation
  const addMutation = useMutation({
    mutationFn: (newBook: NewBookProps) => pb.collection('books').create(newBook),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['books'] }); // 저장 성공시 목록 새로고침!
      alert('도서가 등록되었습니다!');
      onClose(); 
    },
  });

  // 2. 검색 실행 함수 (태그 클릭 시 즉시 검색을 위해 매개변수 분리)
  const handleSearch = async (targetKeyword: string) => {
    if (!targetKeyword.trim()) return alert('검색어를 입력하세요!');
    
  // 알라딘 상품 검색 API 실행
  const data = await searchBookFromAladin(targetKeyword);
  setResults(data);

    // 검색 기록 저장 (Create)
    if (currentUser?.id) {
      try {
        await pb.collection('search_history').create({
          user: currentUser.id,
          keyword: targetKeyword,
        });
        
        // 기록 저장 성공 시 최근 검색어 쿼리 무효화 -> 화면 자동 갱신
        queryClient.invalidateQueries({ queryKey: ['searchHistory', currentUser?.id] });
      } catch (error) {
        console.error('검색 기록 저장 실패:', error);
      }
    }
  };

  // 장문경 수정
  // 💡 [핵심 추가] 등록 버튼 클릭 시 조회 API를 거쳐 최종 저장하는 함수
  const handleAddWithMetrics = async (book: bookProps, idx: number) => {
    const currentUserId = pb.authStore.model?.id;
    if (!currentUserId) {
      alert('도서를 등록하려면 로그인이 필요합니다.');
      return;
    }

    if (registeringIdx !== null) return; // 중복 클릭 방지
    setRegisteringIdx(idx); // 현재 등록 중인 버튼 로딩 활성화

    try {
      // 1. 가져온 isbn13을 이용해 상품 상세 조회 API 호출 (평점, 판매지수 확보)
      const metrics = await lookupBookMetricsFromAladin(book.isbn13);

      // 2. 확보된 데이터와 자동 판별된 추천 여부(isRecommended)를 결합하여 DB에 전송
      addMutation.mutate({
        title: book.title, 
        author: book.author, // 알라딘은 저자 정보가 문자열로 제공됨
        publisher: book.publisher, 
        thumbnail: book.cover, // 알라딘의 이미지 키값은 cover
        isAvailable: true, 
        bestbook: metrics.isRecommended, // ➔ 자동 판별된 시스템 추천 여부 바인딩 (리뷰 8.5↑ OR 판매지수 15000↑)
        category: metrics.categoryName,  // 상세 조회로 가져온 카테고리 정보
        sales: metrics.salesPoint,        // 상세 조회로 가져온 판매 지수
        contents: metrics.description,   // 알라딘 소개글을 DB의 contents 필드에 매핑
        user_id: currentUserId,
        ai_review: metrics.isRecommended 
          ? `[자동 추천] 평점 ${metrics.customerReviewRank}점, 판매지수 ${metrics.salesPoint}점의 검증된 우수 명작입니다.` 
          : `평점 ${metrics.customerReviewRank}점의 서재 보관 도서입니다.`
      });

    } catch (error) {
      console.error("도서 정보 조회 실패:", error);
      alert("도서 평가 지표를 가져오는 중 오류가 발생했습니다.");
    } finally {
      setRegisteringIdx(null); // 로딩 상태 해제
    }
  };
    
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-xl max-h-[80vh] flex flex-col">
        <div className="p-4 border-b flex justify-between">
          <h2 className="font-bold">도서 검색 및 등록 (알라딘 자동 추천 시스템)</h2>
          <button onClick={onClose}><X size={20}/></button>
        </div>
        
        <div className="p-4 flex gap-2 border-b">
          <input 
            value={keyword} onChange={(e) => setKeyword(e.target.value)}
            className="flex-1 border p-2 rounded" placeholder="책 제목을 검색하세요"
            onKeyDown={(e) => e.key === 'Enter' && handleSearch(keyword)}
          />
          <button onClick={() => handleSearch(keyword)} className="bg-blue-600 text-white px-4 rounded"><Search size={18}/></button>
        </div>

        {recentSearches.length > 0 && (
          <div className="px-4 py-3 bg-gray-50 border-b flex items-center gap-3 overflow-x-auto">
            <div className="flex items-center text-sm font-medium text-gray-500 shrink-0 gap-1">
              <Clock size={14} />
              <span>최근 검색</span>
            </div>
            <div className="flex gap-2">
              {recentSearches.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setKeyword(item.keyword);    // 인풋창 값 변경
                    handleSearch(item.keyword); // 즉시 검색 실행
                  }}
                  className="px-3 py-1 bg-white border border-gray-200 text-sm rounded-full text-gray-600 hover:border-blue-500 hover:text-blue-600 transition whitespace-nowrap shadow-sm"
                >
                  {item.keyword}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {results.map((book: bookProps, idx) => (
            <div key={idx} className="flex gap-4 items-center border-b pb-4">
              {/* 알라딘 API는 이미지 키가 thumbnail이 아닌 cover로 제공됨 */}
              <img src={book.cover || "https://via.placeholder.com/50"} alt="표지" className="w-12 object-cover" />
              <div className="flex-1">
                <p className="font-bold line-clamp-1">{book.title}</p>
                <p className="text-sm text-gray-500">{book.author} | {book.publisher}</p>
              </div>

              {/* 변경된 등록 버튼 영역 */}
              <button 
                onClick={() => handleAddWithMetrics(book, idx)}
                disabled={registeringIdx === idx}
                className="bg-gray-800 hover:bg-black text-white px-3 py-1.5 rounded text-sm transition-colors flex items-center gap-1.5 min-w-[75px] justify-center cursor-pointer disabled:bg-gray-400"
              >
                {registeringIdx === idx ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    분석중
                  </>
                ) : (
                  '등록'
                )}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}