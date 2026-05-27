'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { pb } from '../lib/pocketbase';
import { searchBookFromAladin, lookupBookMetricsFromAladin } from '../lib/aladinApi';
import { Search, X, Clock, Loader2, Sparkles, RefreshCw } from 'lucide-react';
import { bookProps } from '../page';
import axios from 'axios';

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
  isbn13?:string
}

export default function AddBookModal({ isOpen, onClose }:AddBookModalProps) {
  const queryClient = useQueryClient();
  const [keyword, setKeyword] = useState('');
  const [results, setResults] = useState([]);

  // 현재 상세 지표를 조회/등록 중인 아이템의 인덱스 상태 관리 (버튼 로딩 처리용)
  const [registeringIdx, setRegisteringIdx] = useState<number | null>(null);

  // [AI 추천 추가] AI 추천 결과와 로딩 상태를 관리하는 State 추가
  const [aiRecommendations, setAiRecommendations] = useState<string[]>([]);
  const [isAiLoading, setIsAiLoading] = useState(false);

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

  // [AI 추천 추가] AI 추천 검색어를 백엔드 API에서 가져오는 함수 추가
  const getAiRecommendations = async () => {
    if (recentSearches.length === 0) return alert('검색 기록이 부족합니다!');
    
    setIsAiLoading(true);
    try {
      // 최근 검색어 배열에서 최대 5개의 키워드만 추출하여 서버로 전송
      const allKeywords = recentSearches.map((item) => item.keyword);
      const targetKeywords = allKeywords.slice(0, 5);

      const response = await fetch('/api/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keywords: targetKeywords }),
      });

      const data = await response.json();
      
      if (data.recommendations) {
        setAiRecommendations(data.recommendations);
      }
    } catch (error) {
      console.error('AI 추천 에러:', error);
      alert('추천을 불러오지 못했습니다.');
    } finally {
      setIsAiLoading(false);
    }
  };

  // DB에 저장하는 Mutation
  const addMutation = useMutation({
    mutationFn: (newBook: NewBookProps) => pb.collection('books').create(newBook),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['books'] }); // 저장 성공시 목록 새로고침!
      alert('도서가 등록되었습니다!');
      onClose(); 
      setResults([])
      setKeyword('')
      setAiRecommendations([])
    },
  });

  // 최승헌 추가 isbn13 기준 중복 확인 함수
  const checkDuplicateIsbn13 = async (isbn13?: string) => {
    const targetIsbn13 = isbn13?.trim();

    if (!targetIsbn13) return false;

    try {
      const result = await pb.collection('books').getList(1, 1, {
        filter: `isbn13 = "${targetIsbn13.replace(/"/g, '\\"')}"`,
      });
      return result.totalItems > 0;
    } catch (error) {
      console.warn('PocketBase books 컬렉션에 isbn13 필드가 없어 중복 검사를 건너뜁니다. 스키마 확인을 권장합니다.', error);
      return false;
    }
  };

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
        // 추가_최승헌 등록 전 DB에 같은 isbn13의 책이 있는지 확인
        if (!book.isbn13) {
          alert('ISBN13 정보가 없는 도서입니다.');
          return;
        }
        const isDuplicate = await checkDuplicateIsbn13(book.isbn13);

        if (isDuplicate) {
          alert('이미 등록된 책입니다.');
          return;
        }
        // 추가완료_최승헌
        // 1. 가져온 isbn13을 이용해 상품 상세 조회 API 호출 (평점, 판매지수 확보)
        const metrics = await lookupBookMetricsFromAladin(book.isbn13);

      // 2. 확보된 데이터와 자동 판별된 추천 여부(isRecommended)를 결합하여 DB에 전송
      addMutation.mutate({
        title: book.title, 
        author: book.author, // 알라딘은 저자 정보가 문자열로 제공됨
        publisher: book.publisher, 
        thumbnail: book.cover, // 알라딘의 이미지 키값은 cover
        isbn13: book.isbn13, // 도서 고유값 isbn13
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
    } 
  };
    
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-xl max-h-[80vh] flex flex-col">
        <div className="p-4 border-b flex justify-between">
          <h2 className="font-bold">도서 검색 및 등록 (알라딘 자동 추천 시스템)</h2>
          <button onClick={()=>{
            onClose()
            setResults([])
            setKeyword('')
            setAiRecommendations([])
          }}><X size={20}/></button>
        </div>
        
        <div className="p-4 flex gap-2 border-b">
          <input 
            value={keyword} onChange={(e) => setKeyword(e.target.value)}
            className="flex-1 border p-2 rounded" placeholder="책 제목을 검색하세요"
            onKeyDown={(e) => e.key === 'Enter' && handleSearch(keyword)}
          />
          <button onClick={() => handleSearch(keyword)} className="bg-blue-600 text-white px-4 rounded"><Search size={18}/></button>
        </div>

        {/* [AI 추천 추가] 최근 검색어 UI를 '내가 찾은 검색어'와 'AI 추천' 구역으로 분리 확장했습니다. */}
        {recentSearches.length > 0 && (
          <div className="px-4 py-4 bg-gray-50 border-b flex flex-col gap-5 shrink-0">
            
            {/* 1. 내가 찾은 검색어 (유저 데이터) */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center text-sm font-bold text-gray-700 gap-1.5">
                <Clock size={15} />
                <span>내가 찾은 검색어</span>
              </div>
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                {recentSearches.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setKeyword(item.keyword);
                      handleSearch(item.keyword);
                    }}
                    className="px-3 py-1.5 bg-white border border-gray-200 text-sm rounded-full text-gray-600 hover:border-blue-500 hover:text-blue-600 transition whitespace-nowrap shadow-sm"
                  >
                    {item.keyword}
                  </button>
                ))}
              </div>
            </div>

            {/* 2. AI 맞춤 추천 영역 */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center text-sm font-bold text-indigo-600 gap-1.5">
                  <Sparkles size={15} />
                  <span>AI 맞춤 연관 검색어</span>
                </div>
                
                {/* 💡 수정됨: 조건부 렌더링을 없애고 항상 보이되 텍스트와 아이콘이 바뀌도록 변경 */}
                <button 
                  onClick={getAiRecommendations}
                  disabled={isAiLoading}
                  className="text-xs bg-indigo-100 text-indigo-700 px-3 py-1.5 rounded-md hover:bg-indigo-200 transition font-medium disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isAiLoading ? (
                    <>
                      <Loader2 size={12} className="animate-spin" />
                      분석 중...
                    </>
                  ) : aiRecommendations.length > 0 ? (
                    <>
                      <RefreshCw size={12} />
                      다시 받기
                    </>
                  ) : (
                    '추천어 받기'
                  )}
                </button>
              </div>

              {/* AI 추천 결과 렌더링 */}
              {aiRecommendations.length > 0 && (
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {aiRecommendations.map((rec, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setKeyword(rec);
                        handleSearch(rec);
                      }}
                      className="px-3 py-1.5 bg-indigo-50 border border-indigo-200 text-sm font-medium rounded-full text-indigo-700 hover:bg-indigo-600 hover:text-white transition whitespace-nowrap shadow-sm"
                    >
                      {rec}
                    </button>
                  ))}
                </div>
              )}
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