'use client';

import { Trash2 } from 'lucide-react';
import LikeButton from './Likebutton';
import { bookProps } from '../page';

interface BookCardProps {
  book: bookProps;
  onClick: () => void;
  onDelete: (id: string) => void;
}

export default function BookCard({ book, onClick, onDelete }: BookCardProps) {
  return (
    <div
      onClick={onClick}
      className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden relative hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer"
    >
      {/* 삭제 버튼 */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          if (confirm('정말 삭제하시겠습니까?')) {
            onDelete(book.id);
          }
        }}
        className="absolute cursor-pointer top-3 right-3 bg-red-500 hover:bg-red-700 text-white w-7 h-7 rounded-full flex justify-center items-center text-sm opacity-80 hover:opacity-100 z-10 transition-all shadow-sm"
      >
        <Trash2 size={14} />
      </button>

      {/* 추천! */}
      {book.bestbook && (
        <span className="absolute top-3 left-3 bg-yellow-400 text-black px-2 py-1 rounded-md font-bold text-xs shadow-sm">
          ★강추!
        </span>
      )}

      {/* 썸네일 */}
      <img
        src={book.thumbnail || 'https://via.placeholder.com/150'}
        alt={book.title || '도서 표지'}
        className="w-full h-56 object-cover bg-gray-100 hover:scale-105 transition-transform duration-300"
      />

      <div className="p-4">
        <h3 className="font-bold text-lg text-gray-800 line-clamp-1">{book.title}</h3>
        <p className="text-sm text-gray-500 mt-1 line-clamp-1">
          {book.author} | {book.publisher}
        </p>

        {/* 좋아요 버튼도 카드 클릭 이벤트 전파 방지 */}
        <div onClick={(e) => e.stopPropagation()}>
          <LikeButton bookId={book.id} initialLikeCount={book.like_count || 0} />
        </div>
      </div>
    </div>
  );
}
