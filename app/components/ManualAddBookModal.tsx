'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { pb } from '../lib/pocketbase';
import { X, Loader2 } from 'lucide-react';

interface ManualAddBookModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface NewBookProps {
  id?: string;
  title?: string;
  author?: string;
  publisher?: string;
  thumbnail?: string;
  isAvailable?: boolean;
  bestbook?: boolean;
  category?: string;
  sales?: number;
  contents?: string;
  user_id?: string;
  ai_review?: string;
}

export default function ManualAddBookModal({ isOpen, onClose }: ManualAddBookModalProps) {
  const queryClient = useQueryClient();
  const currentUser = pb.authStore.model;

  const [formData, setFormData] = useState<NewBookProps>({
    title: '',
    author: '',
    publisher: '',
    thumbnail: '',
    isAvailable: true,
    category: '',
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // DB에 저장하는 Mutation
  const addMutation = useMutation({
    mutationFn: (newBook: NewBookProps) => pb.collection('books').create(newBook),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['books'] });
      alert('도서가 등록되었습니다!');
      resetForm();
      onClose();
    },
    onError: (error) => {
      console.error('도서 등록 실패:', error);
      alert('도서 등록 중 오류가 발생했습니다.');
    },
  });

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.title?.trim()) {
      newErrors.title = '제목은 필수입니다.';
    }
    if (!formData.author?.trim()) {
      newErrors.author = '저자는 필수입니다.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const resetForm = () => {
    setFormData({
      title: '',
      author: '',
      publisher: '',
      thumbnail: '',
      isAvailable: true,
      category: '',
    });
    setErrors({});
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const handleSubmit = () => {
    if (!validateForm()) {
      return;
    }

    if (!currentUser?.id) {
      alert('도서를 등록하려면 로그인이 필요합니다.');
      return;
    }

    addMutation.mutate({
      ...formData,
      user_id: currentUser.id,
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="font-bold text-lg">도서 수동 등록</h2>
          <button
            onClick={() => {
              resetForm();
              onClose();
            }}
            className="hover:bg-gray-100 p-1 rounded"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* 제목 */}
          <div>
            <label className="block text-sm font-semibold mb-2">
              제목 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="title"
              value={formData.title || ''}
              onChange={handleChange}
              className={`w-full border p-2 rounded outline-none ${
                errors.title ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="책 제목을 입력하세요"
            />
            {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title}</p>}
          </div>

          {/* 저자 */}
          <div>
            <label className="block text-sm font-semibold mb-2">
              저자 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="author"
              value={formData.author || ''}
              onChange={handleChange}
              className={`w-full border p-2 rounded outline-none ${
                errors.author ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="저자명을 입력하세요 (여러 명일 경우 쉼표로 구분)"
            />
            {errors.author && <p className="text-red-500 text-sm mt-1">{errors.author}</p>}
          </div>

          {/* 출판사 */}
          <div>
            <label className="block text-sm font-semibold mb-2">출판사</label>
            <input
              type="text"
              name="publisher"
              value={formData.publisher || ''}
              onChange={handleChange}
              className="w-full border border-gray-300 p-2 rounded outline-none"
              placeholder="출판사를 입력하세요"
            />
          </div>

          {/* 카테고리 */}
          <div>
            <label className="block text-sm font-semibold mb-2">카테고리</label>
            <input
              type="text"
              name="category"
              value={formData.category || ''}
              onChange={handleChange}
              className="w-full border border-gray-300 p-2 rounded outline-none"
              placeholder="예: 소설, 비소설, 자기계발 등"
            />
          </div>

          {/* 썸네일 URL */}
          <div>
            <label className="block text-sm font-semibold mb-2">표지 이미지 URL</label>
            <input
              type="text"
              name="thumbnail"
              value={formData.thumbnail || ''}
              onChange={handleChange}
              className="w-full border border-gray-300 p-2 rounded outline-none"
              placeholder="표지 이미지의 URL을 입력하세요"
            />
            {formData.thumbnail && (
              <div className="mt-2">
                <img
                  src={formData.thumbnail}
                  alt="미리보기"
                  className="w-20 h-28 object-cover rounded border"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://via.placeholder.com/80x112?text=No+Image';
                  }}
                />
              </div>
            )}
          </div>

          {/* 설명 */}
          <div>
            <label className="block text-sm font-semibold mb-2">설명</label>
            <textarea
              name="contents"
              value={formData.contents || ''}
              onChange={handleChange}
              className="w-full border border-gray-300 p-2 rounded outline-none resize-none"
              placeholder="도서에 대한 설명을 입력하세요"
              rows={3}
            />
          </div>
        </div>

        {/* 버튼 */}
        <div className="p-4 border-t flex gap-2 justify-end">
          <button
            onClick={() => {
              resetForm();
              onClose();
            }}
            className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
          >
            취소
          </button>
          <button
            onClick={handleSubmit}
            disabled={addMutation.isPending}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-blue-400 flex items-center gap-2"
          >
            {addMutation.isPending && <Loader2 size={16} className="animate-spin" />}
            {addMutation.isPending ? '등록 중...' : '등록'}
          </button>
        </div>
      </div>
    </div>
  );
}