'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { pb } from '../lib/pocketbase';
import { searchBookFromKakao } from '../lib/kakaoApi';
import { searchBookFromAladin } from '../lib/aladinApi';
import { Search, X, Clock } from 'lucide-react';

interface AddBookModalProps{
  isOpen:boolean
  onClose:()=>void
}


interface NewBookProps{
  id?:string
  title?:string
  authors?:string
  publisher?:string
  thumbnail?:string
  isAvailable?:boolean
  bestbook?:boolean
  category?:string
  sales?: number
  user_id?:string
}

export default function AddBookModal({ isOpen, onClose }:AddBookModalProps) {
  const queryClient = useQueryClient();
  const [keyword, setKeyword] = useState('');
  const [results, setResults] = useState([]);

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
    
    // 카카오 API 검색 결과 세팅
    const data = await searchBookFromKakao(targetKeyword);
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

    

//   const handleAdd =async (book: NewBookProps) => {
//     const aladin_data= await searchBookFromAladin(book.title??"") 
//     console.log(book.title )

//     //const obj = JSON.parse(aladin_data);
//     const clean = aladin_data.replace(/;$/, "");    //옛날 XML 방식이라 JSON 으로 가져오면 오류 
//     const obj = JSON.parse(clean);
//     console.log(obj);

    

//     addMutation.mutate({
//       title: book.title,
//       authors: book.authors?.join(", "),
//       publisher: book.publisher,
//       thumbnail: book.thumbnail,
//       isAvailable: true,
//       bestbook: false,
//       category: obj.item[0].categoryName,
//       sales: obj.item[0].customerReviewRank,
//       });

//   // 👉 추가 작업
      
    
// };


  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-xl max-h-[80vh] flex flex-col">
        <div className="p-4 border-b flex justify-between">
          <h2 className="font-bold">도서 검색 및 등록</h2>
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
          {results.map((book: any, idx) => (
            <div key={idx} className="flex gap-4 items-center border-b pb-4">
              <img src={book.thumbnail || "https://via.placeholder.com/50"} alt="표지" className="w-12 object-cover" />
              <div className="flex-1">
                <p className="font-bold line-clamp-1">{book.title}</p>
                <p className="text-sm text-gray-500">{book.authors?.join(', ')}</p>
              </div>
              <button 
                //  onClick={() => handleAdd(book)}
                  
                  onClick={() => {
                  const currentUserId = pb.authStore.model?.id;
                  if (!currentUserId) {
                    alert('도서를 등록하려면 로그인이 필요합니다.');
                    return;
                  }
                  addMutation.mutate({
                    title: book.title, authors: book.authors?.join(', '),
                    publisher: book.publisher, thumbnail: book.thumbnail, isAvailable: true, bestbook:false, user_id: currentUserId
                  });
                }}
                className="bg-gray-800 text-white px-3 py-1 rounded"
              >
                등록
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}