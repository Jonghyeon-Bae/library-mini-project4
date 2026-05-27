'use client';

import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { pb } from '../lib/pocketbase';
import { X, Loader2, Palette, RefreshCw, Undo, Image as ImageIcon, Download, ChevronDown, ChevronUp } from 'lucide-react';
import { STYLE_PRESETS } from '../lib/stylePresets';
import axios from 'axios';

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

  // 추가_종현 AI 표지 생성 관련 상태
  const [showAiPanel, setShowAiPanel] = useState(false);
  const [selectedStyle, setSelectedStyle] = useState(STYLE_PRESETS[0].id);
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [loadingStep, setLoadingStep] = useState(0);

  // 프롬프트 생성 헬퍼 — 수정_종현 설명(contents) 자동 삽입
  const getPromptForStyle = (styleId: string) => {
    const activeStyle = STYLE_PRESETS.find(s => s.id === styleId);
    const cleanTitle = formData.title?.replace(/[^\w\sㄱ-ㅎㅏ-ㅣ가-힣]/g, '') || '';
    const description = formData.contents?.trim();
    const descPart = description ? `, book description: "${description}"` : '';
    return `Book cover for "${cleanTitle}"${descPart}, ${activeStyle?.promptPart || ''}, professional typography, 8k resolution, award-winning book design`;
  };

  // AI 패널 토글 시 프롬프트 초기화 (제목/설명 변경 시에도 갱신)
  useEffect(() => {
    if (showAiPanel && formData.title) {
      setAiPrompt(getPromptForStyle(selectedStyle));
    }
  }, [showAiPanel, formData.title, formData.contents]);

  // 로딩 단계 텍스트 회전 애니메이션
  const stepsText = [
    '책 내용 과몰입 중... (진심모드)',
    '표지 구도 스케치 중... ',
    'AI 화가 열일중...',
    '디테일 장인 각성 중...',
    '마무리 미모 필터 씌우는 중'
  ];

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isGenerating) {
      interval = setInterval(() => {
        setLoadingStep((prev) => (prev < stepsText.length - 1 ? prev + 1 : prev));
      }, 2500);
    }
    return () => clearInterval(interval);
  }, [isGenerating]);

  // 스타일 변경 핸들러
  const handleStyleChange = (styleId: string) => {
    setSelectedStyle(styleId);
    setAiPrompt(getPromptForStyle(styleId));
  };

  // AI 이미지 생성 요청
  const handleAiGenerate = async () => {
    if (!aiPrompt.trim()) {
      alert('프롬프트를 입력해 주세요!');
      return;
    }

    setIsGenerating(true);
    setLoadingStep(0);
    setImageLoaded(false);
    setAiError(null);
    setGeneratedUrl(null);

    try {
      const response = await axios.post('/api/genthum', {
        prompt: aiPrompt.trim(),
        // bookId를 전달하지 않으면 API에서 UUID로 자동 생성
      });

      if (response.data?.url) {
        setGeneratedUrl(response.data.url);
      } else {
        throw new Error('API 응답에 이미지 URL이 없습니다.');
      }
    } catch (err: unknown) {
      console.error('AI 표지 생성 에러:', err);
      let errMsg = '알 수 없는 오류가 발생했습니다.';
      if (axios.isAxiosError(err)) {
        errMsg = err.response?.data?.error || err.message;
      } else if (err instanceof Error) {
        errMsg = err.message;
      }
      setAiError(errMsg);
      setIsGenerating(false);
    }
  };

  // 생성된 표지를 폼에 적용
  const handleApplyAiCover = () => {
    if (!generatedUrl) return;
    setFormData((prev) => ({
      ...prev,
      thumbnail: generatedUrl,
    }));
    // 패널은 열어둔 채로 미리보기 유지
  };

  // 이미지 다운로드 기능
  const handleDownload = async () => {
    if (!generatedUrl) return;
    try {
      const response = await fetch(generatedUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${formData.title || 'book'}_ai_cover.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch {
      alert('이미지 다운로드에 실패했습니다.');
    }
  };

  // DB에 저장하는 Mutation
  const addMutation = useMutation({
    mutationFn: (newBook: NewBookProps) => pb.collection('books').create(newBook),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['books'] });
      queryClient.invalidateQueries({ queryKey: ['books-dashboard'] });
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
    // AI 표지 관련 상태도 초기화
    setShowAiPanel(false);
    setGeneratedUrl(null);
    setImageLoaded(false);
    setAiError(null);
    setAiPrompt('');
    setSelectedStyle(STYLE_PRESETS[0].id);
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
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50 p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-xl border border-slate-200 dark:border-slate-800">
        {/* 헤더 */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50 shrink-0 rounded-t-2xl">
          <h2 className="font-extrabold text-lg text-slate-800 dark:text-slate-100">도서 수동 등록</h2>
          <button
            onClick={() => {
              resetForm();
              onClose();
            }}
            className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* 폼 바디 */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* 제목 */}
          <div>
            <label className="block text-sm font-semibold mb-2 text-slate-700 dark:text-slate-300">
              제목 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="title"
              value={formData.title || ''}
              onChange={handleChange}
              className={`w-full border p-2.5 rounded-xl outline-none text-sm transition-colors focus:ring-1 focus:ring-indigo-500/30 focus:border-indigo-500 ${
                errors.title ? 'border-red-500' : 'border-slate-200 dark:border-slate-700'
              } dark:bg-slate-950 dark:text-slate-200`}
              placeholder="책 제목을 입력하세요"
            />
            {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title}</p>}
          </div>

          {/* 저자 */}
          <div>
            <label className="block text-sm font-semibold mb-2 text-slate-700 dark:text-slate-300">
              저자 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="author"
              value={formData.author || ''}
              onChange={handleChange}
              className={`w-full border p-2.5 rounded-xl outline-none text-sm transition-colors focus:ring-1 focus:ring-indigo-500/30 focus:border-indigo-500 ${
                errors.author ? 'border-red-500' : 'border-slate-200 dark:border-slate-700'
              } dark:bg-slate-950 dark:text-slate-200`}
              placeholder="저자명을 입력하세요 (여러 명일 경우 쉼표로 구분)"
            />
            {errors.author && <p className="text-red-500 text-sm mt-1">{errors.author}</p>}
          </div>

          {/* 출판사 */}
          <div>
            <label className="block text-sm font-semibold mb-2 text-slate-700 dark:text-slate-300">출판사</label>
            <input
              type="text"
              name="publisher"
              value={formData.publisher || ''}
              onChange={handleChange}
              className="w-full border border-slate-200 dark:border-slate-700 p-2.5 rounded-xl outline-none text-sm transition-colors focus:ring-1 focus:ring-indigo-500/30 focus:border-indigo-500 dark:bg-slate-950 dark:text-slate-200"
              placeholder="출판사를 입력하세요"
            />
          </div>

          {/* 카테고리 */}
          <div>
            <label className="block text-sm font-semibold mb-2 text-slate-700 dark:text-slate-300">카테고리</label>
            <input
              type="text"
              name="category"
              value={formData.category || ''}
              onChange={handleChange}
              className="w-full border border-slate-200 dark:border-slate-700 p-2.5 rounded-xl outline-none text-sm transition-colors focus:ring-1 focus:ring-indigo-500/30 focus:border-indigo-500 dark:bg-slate-950 dark:text-slate-200"
              placeholder="예: 소설, 비소설, 자기계발 등"
            />
          </div>

          {/* 설명 */}
          <div>
            <label className="block text-sm font-semibold mb-2 text-slate-700 dark:text-slate-300">설명</label>
            <textarea
              name="contents"
              value={formData.contents || ''}
              onChange={handleChange}
              className="w-full border border-slate-200 dark:border-slate-700 p-2.5 rounded-xl outline-none resize-none text-sm transition-colors focus:ring-1 focus:ring-indigo-500/30 focus:border-indigo-500 dark:bg-slate-950 dark:text-slate-200"
              placeholder="도서에 대한 설명을 입력하세요"
              rows={3}
            />
          </div>

          {/* 표지 이미지 섹션 */}
          <div className="space-y-3">
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">표지 이미지</label>

            {/* 썸네일 URL 직접 입력 */}
            <input
              type="text"
              name="thumbnail"
              value={formData.thumbnail || ''}
              onChange={handleChange}
              className="w-full border border-slate-200 dark:border-slate-700 p-2.5 rounded-xl outline-none text-sm transition-colors focus:ring-1 focus:ring-indigo-500/30 focus:border-indigo-500 dark:bg-slate-950 dark:text-slate-200"
              placeholder="표지 이미지 URL을 입력하거나, 아래 AI로 생성하세요"
            />

            {/* 현재 적용된 썸네일 미리보기 */}
            {formData.thumbnail && (
              <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-950/30 rounded-xl border border-green-200 dark:border-green-800/50">
                <img
                  src={formData.thumbnail}
                  alt="적용된 표지"
                  className="w-12 h-16 object-cover rounded-lg shadow-sm border border-green-200/50"
                />
                <div className="flex-1 min-w-0">
                  <span className="text-xs font-bold text-green-700 dark:text-green-400 block">✓ 표지가 설정되었습니다</span>
                  <span className="text-[10px] text-green-600/70 dark:text-green-500/70 truncate block">{formData.thumbnail}</span>
                </div>
              </div>
            )}

            {/* AI 표지 생성 토글 버튼 */}
            <button
              type="button"
              onClick={() => {
                setShowAiPanel(!showAiPanel);
                if (!showAiPanel && formData.title) {
                  setAiPrompt(getPromptForStyle(selectedStyle));
                }
              }}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-indigo-400 hover:text-indigo-600 dark:hover:border-indigo-500 dark:hover:text-indigo-400 transition-all text-sm font-bold"
            >
              <Palette size={16} />
              {showAiPanel ? 'AI 표지 생성기 접기' : 'AI로 표지 만들기'}
              {showAiPanel ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>

            {/* 추가_종현 AI 표지 생성 인라인 패널 */}
            {showAiPanel && (
              <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-slate-50/50 dark:bg-slate-950/40 animate-in slide-in-from-top-2 duration-200">
                
                {/* 패널 헤더 */}
                <div className="p-4 bg-slate-100/80 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-slate-800 text-white dark:bg-slate-700">
                      <Palette size={14} />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-sm text-slate-800 dark:text-slate-100">AI 도서 표지 생성기</h3>
                      <p className="text-[10px] text-slate-400 mt-0.5">도서 제목을 기반으로 맞춤형 표지를 생성합니다.</p>
                    </div>
                  </div>
                  {!formData.title?.trim() && (
                    <p className="text-xs text-amber-600 dark:text-amber-400 mt-2 font-semibold bg-amber-50 dark:bg-amber-950/30 p-2 rounded-lg">
                      ⚠️ 도서 제목을 먼저 입력하면 더 정확한 표지를 생성할 수 있습니다.
                    </p>
                  )}
                </div>

                <div className="p-4 space-y-4">
                  {/* 스타일 프리셋 선택 */}
                  <div>
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-2">
                      1. 표지 스타일 테마
                    </label>
                    <div className="grid grid-cols-2 gap-1.5">
                      {STYLE_PRESETS.map((style) => (
                        <button
                          type="button"
                          key={style.id}
                          onClick={() => handleStyleChange(style.id)}
                          className={`text-left p-2 text-[11px] font-bold rounded-lg border transition-all ${
                            selectedStyle === style.id
                              ? 'border-indigo-600 bg-indigo-50/50 text-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-400'
                              : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                          }`}
                        >
                          {style.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 프롬프트 편집 */}
                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        2. AI 프롬프트 상세설정
                      </label>
                      <button
                        type="button"
                        onClick={() => setAiPrompt(getPromptForStyle(selectedStyle))}
                        className="text-[10px] font-bold text-slate-400 hover:text-indigo-600 flex items-center gap-1 transition-colors"
                        title="기본값으로 초기화"
                      >
                        <Undo size={10} /> 초기화
                      </button>
                    </div>
                    <textarea
                      value={aiPrompt}
                      onChange={(e) => setAiPrompt(e.target.value)}
                      placeholder="표지 생성을 위한 묘사를 영어로 작성하세요."
                      className="w-full min-h-[80px] p-2.5 text-xs leading-5 rounded-lg border border-slate-200 dark:border-slate-800 dark:bg-slate-950 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 focus:outline-none transition resize-none font-mono text-slate-700 dark:text-slate-300"
                    />
                    <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
                      프롬프트는 영문으로 작성 시 가장 좋은 품질을 발휘합니다.
                    </p>
                  </div>

                  {/* 이미지 미리보기 영역 */}
                  <div className="flex flex-col items-center bg-slate-100/50 dark:bg-slate-950/40 rounded-xl p-4 border border-slate-100 dark:border-slate-800/50 min-h-[200px] relative overflow-hidden">
                    
                    {/* 생성 전 안내 */}
                    {!generatedUrl && !isGenerating && (
                      <div className="text-center space-y-2 py-6">
                        <div className="inline-flex p-3 rounded-full bg-slate-200/50 dark:bg-slate-800/50 text-slate-400">
                          <ImageIcon size={28} />
                        </div>
                        <p className="text-xs text-slate-400 font-medium">생성된 표지가 여기에 표시됩니다</p>
                      </div>
                    )}

                    {/* 로딩 인디케이터 */}
                    {isGenerating && !imageLoaded && (
                      <div className="flex flex-col justify-center items-center text-center py-8 w-full">
                        <div className="relative mb-4">
                          <div className="w-16 h-16 rounded-full border-4 border-slate-300 border-t-indigo-600 animate-spin" />
                          <Palette size={22} className="absolute inset-0 m-auto text-indigo-400 animate-pulse" />
                        </div>
                        <h4 className="font-extrabold text-slate-700 dark:text-slate-200 text-sm">
                          {stepsText[loadingStep]}
                        </h4>
                        <p className="text-[10px] text-slate-400 mt-1">표지를 생성하고 있습니다.</p>
                        <div className="w-40 bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden mt-4">
                          <div
                            className="h-full bg-indigo-600 transition-all duration-1000 ease-out"
                            style={{ width: `${((loadingStep + 1) / stepsText.length) * 100}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* 생성된 이미지 */}
                    {generatedUrl && (
                      <div className={`relative w-full max-w-[200px] aspect-[2/3] rounded-lg shadow-md overflow-hidden border border-slate-200/30 dark:border-slate-800/80 transition-all duration-500 ${imageLoaded ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}>
                        <img
                          src={generatedUrl}
                          alt="AI Generated Cover"
                          className="w-full h-full object-cover"
                          onLoad={() => {
                            setIsGenerating(false);
                            setImageLoaded(true);
                          }}
                          onError={() => {
                            setIsGenerating(false);
                            setAiError('이미지 불러오기에 실패했습니다. 다시 생성해 주세요.');
                          }}
                        />
                        {imageLoaded && (
                          <div className="absolute bottom-2 right-2">
                            <button
                              type="button"
                              onClick={handleDownload}
                              title="내 컴퓨터에 저장"
                              className="p-1.5 bg-slate-900/80 hover:bg-slate-950 backdrop-blur-md text-white rounded-lg transition-colors border border-slate-700/50"
                            >
                              <Download size={12} />
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    {/* 에러 표시 */}
                    {aiError && (
                      <div className="text-center text-red-500 text-xs font-semibold py-4">
                        <p>{aiError}</p>
                        <button
                          type="button"
                          onClick={handleAiGenerate}
                          className="mt-2 px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-700 text-xs rounded-lg font-bold flex items-center gap-1 mx-auto"
                        >
                          <RefreshCw size={10} /> 재시도
                        </button>
                      </div>
                    )}
                  </div>

                  {/* AI 표지 액션 버튼 */}
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleAiGenerate}
                      disabled={isGenerating}
                      className="flex-1 cursor-pointer py-2.5 px-3 bg-slate-800 hover:bg-slate-900 disabled:opacity-50 text-white font-extrabold text-xs rounded-xl transition flex items-center justify-center gap-1.5"
                    >
                      {isGenerating ? <RefreshCw size={14} className="animate-spin" /> : <Palette size={14} />}
                      {isGenerating ? '생성 중...' : '표지 생성하기'}
                    </button>

                    {imageLoaded && generatedUrl && (
                      <button
                        type="button"
                        onClick={handleApplyAiCover}
                        disabled={formData.thumbnail === generatedUrl}
                        className={`py-2.5 px-4 font-extrabold text-xs rounded-xl transition flex items-center gap-1.5 cursor-pointer ${
                          formData.thumbnail === generatedUrl
                            ? 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400 cursor-default'
                            : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                        }`}
                      >
                        {formData.thumbnail === generatedUrl ? '✓ 적용됨' : '이 표지 사용하기'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 하단 버튼 */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex gap-2 justify-end shrink-0 bg-slate-50/50 dark:bg-slate-900/50 rounded-b-2xl">
          <button
            onClick={() => {
              resetForm();
              onClose();
            }}
            className="px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-sm font-bold text-slate-600 dark:text-slate-400 transition-colors"
          >
            취소
          </button>
          <button
            onClick={handleSubmit}
            disabled={addMutation.isPending}
            className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:bg-indigo-400 flex items-center gap-2 text-sm font-extrabold transition-colors shadow-md cursor-pointer"
          >
            {addMutation.isPending && <Loader2 size={16} className="animate-spin" />}
            {addMutation.isPending ? '등록 중...' : '등록'}
          </button>
        </div>
      </div>
    </div>
  );
}