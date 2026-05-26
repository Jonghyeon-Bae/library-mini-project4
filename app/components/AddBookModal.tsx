'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { pb } from '../lib/pocketbase';
import { searchBookFromKakao } from '../lib/kakaoApi';
import { Search, X } from 'lucide-react';

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
  user_id?:string
}

export default function AddBookModal({ isOpen, onClose }:AddBookModalProps) {
  const queryClient = useQueryClient();
  const [keyword, setKeyword] = useState('');
  const [results, setResults] = useState([]);

  // DB에 저장하는 Mutation
  const addMutation = useMutation({
    mutationFn: (newBook: NewBookProps) => pb.collection('books').create(newBook),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['books'] }); // 저장 성공시 목록 새로고침!
      alert('도서가 등록되었습니다!');
      onClose(); 
    },
  });

  const handleSearch = async () => {
    if (!keyword) return alert('검색어를 입력하세요!');
    const data = await searchBookFromKakao(keyword);
    setResults(data);
  };

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
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
          <button onClick={handleSearch} className="bg-blue-600 text-white px-4 rounded"><Search size={18}/></button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {results.map((book: any, idx) => (
            <div key={idx} className="flex gap-4 items-center border-b pb-4">
              <img src={book.thumbnail || "https://via.placeholder.com/50"} alt="표지" className="w-12 object-cover" />
              <div className="flex-1">
                <p className="font-bold line-clamp-1">{book.title}</p>
                <p className="text-sm text-gray-500">{book.authors?.join(', ')}</p>
              </div>
              <button 
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