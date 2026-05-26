'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { pb } from '../lib/pocketbase';

export default function LikeButton({ bookId, initialLikeCount }: { bookId: string; initialLikeCount: number }) {
  const queryClient = useQueryClient();
  const currentUser = pb.authStore.model;

  // 1. 현재 유저가 이 책에 좋아요를 눌렀는지 확인
  const { data: likeRecord } = useQuery({
    queryKey: ['likes', bookId, currentUser?.id],
    queryFn: async () => {
      try {
        return await pb.collection('likes').getFirstListItem(
          `book="${bookId}" && user="${currentUser?.id}"`
        );
      } catch (error) {
        return null;
      }
    },
    enabled: !!currentUser?.id && !!bookId,
  });

  // 2. 현재 책의 좋아요 총 개수 조회
  const { data: likeStats } = useQuery({
    queryKey: ['bookLikes', bookId],
    queryFn: async () => {
      try {
        const records = await pb.collection('likes').getFullList({
          filter: `book="${bookId}"`,
        });
        return records.length;
      } catch (error) {
        return initialLikeCount;
      }
    },
  });

  const isLiked = !!likeRecord;
  const userLikeRecordId = likeRecord?.id || null;
  const currentLikeCount = likeStats ?? initialLikeCount;

  // 2. 좋아요 토글 뮤테이션
  const toggleLikeMutation = useMutation({
    mutationFn: async () => {
      if (!currentUser) throw new Error('로그인이 필요합니다.');

      console.log('좋아요 시도:', { bookId, userId: currentUser.id, isLiked });

      if (userLikeRecordId) {
        console.log('좋아요 삭제:', userLikeRecordId);
        return await pb.collection('likes').delete(userLikeRecordId);
      } else {
        console.log('좋아요 생성:', { book: bookId, user: currentUser.id });
        return await pb.collection('likes').create({
          book: bookId,
          user: currentUser.id,
        });
      }
    },
    onSuccess: (data) => {
      console.log('좋아요 성공!', data);
      queryClient.invalidateQueries({ queryKey: ['likes', bookId, currentUser?.id] });
      queryClient.invalidateQueries({ queryKey: ['bookLikes', bookId] });
      queryClient.invalidateQueries({ queryKey: ['allLikeCounts'] }); // ✅ 추가
      queryClient.invalidateQueries({ queryKey: ['books'] });
    },
    onError: (error: any) => {
      console.error('좋아요 에러:', error?.message || error);
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
      {isLiked ? '♥' : '♡'} {currentLikeCount} 
    </button>
  );
}