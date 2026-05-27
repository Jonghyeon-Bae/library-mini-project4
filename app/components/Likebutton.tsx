'use client';

import { memo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { pb } from '../lib/pocketbase';

const LikeButton = memo(function LikeButton({ bookId, initialLikeCount }: { bookId: string; initialLikeCount: number }) {
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

  // 2. books 컬렉션에서 like_count 필드 조회 (main.pb.js에서 관리)
  // PocketBase의 hooks에서 like_count를 자동으로 업데이트하므로, 여기서는 books의 like_count만 참조
  const { data: bookData, refetch: refetchBookData } = useQuery({
    queryKey: ['bookDetail', bookId],
    queryFn: async () => {
      try {
        return await pb.collection('books').getOne(bookId);
      } catch (error) {
        console.error(error)
        return null;
      }
    },
    staleTime: 0, // 항상 fresh 상태로 유지
    gcTime: 5 * 60 * 1000, // 5분 캐시
  });

  const isLiked = !!likeRecord;
  const userLikeRecordId = likeRecord?.id || null;
  // books 컬렉션의 like_count를 사용 (PocketBase 백엔드에서 관리)
  const currentLikeCount = bookData?.like_count ?? initialLikeCount ?? 0;

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
    onMutate: async () => {
      // Optimistic update: 책 상세 정보 갱신 (UI 즉시 반영)
      await queryClient.cancelQueries({ queryKey: ['bookDetail', bookId] });
      const previousBookData = queryClient.getQueryData(['bookDetail', bookId]);

      queryClient.setQueryData(['bookDetail', bookId], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          like_count: isLiked ? old.like_count - 1 : old.like_count + 1,
        };
      });

      return { previousBookData };
    },
    onSuccess: (data) => {
      console.log('좋아요 성공!', data);
      // 1. 현재 유저의 좋아요 여부 갱신
      queryClient.invalidateQueries({ queryKey: ['likes', bookId, currentUser?.id] });
      // 2. 책 상세 정보 갱신 (like_count가 PocketBase에서 업데이트됨)
      refetchBookData();
      // 3. 책 목록 갱신 (목록에서도 like_count가 보이도록)
      queryClient.invalidateQueries({ queryKey: ['books'] });
      queryClient.invalidateQueries({ queryKey: ['books-dashboard'] });
      // 4. 랭킹 사이드바 갱신
      queryClient.invalidateQueries({ queryKey: ['allLikeCounts'] });
    },
    onError: (error: any, variables, context: any) => {
      console.error('좋아요 에러:', error?.message || error);
      // Optimistic update 롤백
      if (context?.previousBookData !== undefined) {
        queryClient.setQueryData(['bookDetail', bookId], context.previousBookData);
      }
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
});

// 최적화_React.memo 적용: bookId와 initialLikeCount props가 변경될 때만 리렌더링
export default LikeButton;