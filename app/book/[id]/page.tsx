'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { pb } from '../../lib/pocketbase';
import LikeButton from '../../components/Likebutton';
import { ArrowLeft } from 'lucide-react';
import BookDetailView from '../../components/BookDetailView';

interface bookProps {
  id: string;
  title?: string;
  contents?: string;
  author?: string;
  publisher?: string;
  thumbnail?: string;
  isAvailable?: boolean;
  bestbook?: boolean;
  like_count?: number;
  ai_review?: string;
  user_id?: string;
  created?: string;
  updated?: string;
}

export default function BookDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const bookId = params.id as string;

  // 도서 상세 조회
  const { data: book, isPending } = useQuery<bookProps>({
    queryKey: ['book', bookId],
    queryFn: () => pb.collection('books').getOne(bookId),
    enabled: !!bookId,
  });

  // 도서 삭제
  const deleteMutation = useMutation({
    mutationFn: (id: string) => pb.collection('books').delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['books'] });
      queryClient.invalidateQueries({ queryKey: ['books-dashboard'] });
      router.push('/');
    },
  });

  // 대출 상태 토글
  const toggleMutation = useMutation({
    mutationFn: ({ id, isAvailable }: { id: string; isAvailable?: boolean }) =>
      pb.collection('books').update(id, { isAvailable: !isAvailable }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['book', bookId] });
      queryClient.invalidateQueries({ queryKey: ['books'] });
      queryClient.invalidateQueries({ queryKey: ['books-dashboard'] });
    },
  });

  // 로딩 상태
  if (isPending) {
    return (
      <main className="max-w-5xl mx-auto p-8">
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
          <p className="text-gray-500 text-lg font-medium">도서 정보를 불러오는 중...</p>
        </div>
      </main>
    );
  }

  // 도서를 찾을 수 없는 경우
  if (!book) {
    return (
      <main className="max-w-5xl mx-auto p-8">
        <div className="text-center py-20">
          <p className="text-gray-500 text-lg">도서를 찾을 수 없습니다.</p>
          <button
            onClick={() => router.push('/')}
            className="mt-4 px-6 py-2 rounded-lg bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition-colors"
          >
            홈으로 돌아가기
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-5xl mx-auto p-8">
      <BookDetailView
        selectedBook={book as any}
        onBack={() => router.back()}
        toggleMutation={toggleMutation}
        deleteMutation={deleteMutation}
        onDelete={(id) => deleteMutation.mutate(id)}
      />
    </main>
  );
}
