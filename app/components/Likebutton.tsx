'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { pb } from '../lib/pocketbase';

export default function LikeButton({ bookId, initialLikeCount }: { bookId: string; initialLikeCount: number }) {
  const queryClient = useQueryClient();
  const currentUser = pb.authStore.model; // 현재 로그인한 유저 정보

  // 1. 현재 유저가 이 책에 좋아요를 눌렀는지 확인하는 쿼리
  const { data: likeRecord } = useQuery({
    queryKey: ['likes', bookId, currentUser?.id],
    queryFn: async () => {
      try {
        return await pb.collection('likes').getFirstListItem(
          `book="${bookId}" && user="${currentUser?.id}"`
        );
      } catch (error) {
        return null; // 404 (좋아요 안함) 처리
      }
    },
    enabled: !!currentUser?.id && !!bookId, // 로그인 상태일 때만 실행
  });

  const isLiked = !!likeRecord;
  const userLikeRecordId = likeRecord?.id || null;

  // 2. 좋아요 토글 뮤테이션
  const toggleLikeMutation = useMutation({
    mutationFn: async () => {
      if (!currentUser) throw new Error('로그인이 필요합니다.');

      if (userLikeRecordId) {
        return await pb.collection('likes').delete(userLikeRecordId);
      } else {
        return await pb.collection('likes').create({
          book: bookId,
          user: currentUser.id,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['likes', bookId, currentUser?.id] });
      queryClient.invalidateQueries({ queryKey: ['books'] });
    },
  });

  return (
    <button 
      onClick={() => {
        if (!currentUser) return alert('로그인 후 이용 가능합니다.');
        if (toggleLikeMutation.isPending) return;
        toggleLikeMutation.mutate();
      }}
      disabled={toggleLikeMutation.isPending}
      className={`mt-4 w-full py-2 cursor-pointer rounded-lg font-bold text-sm transition-colors ${
        isLiked 
          ? 'bg-red-100 text-red-700 hover:bg-red-200' 
          : 'bg-green-100 text-green-700 hover:bg-green-200'
      } ${toggleLikeMutation.isPending ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      {isLiked ? '♥' : '♡'} {initialLikeCount} 
    </button>
  );
}