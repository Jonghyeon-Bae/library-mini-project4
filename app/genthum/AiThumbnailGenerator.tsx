'use client';
// "library-mini-project4\public\covers" 생성된 표지 이미지는 해당 경로에 저장되고 해당 주소를 db에넣습니다
// AI 표지 이미지 자동 생성 모달 컴포넌트 추가
import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
// 수정 AI 느낌을 줄이기 위해 Sparkles 아이콘을 Palette 아이콘으로 교체
import { pb } from '../lib/pocketbase';
import { bookProps } from '../page';
import { Palette, X, Check, RefreshCw, Undo, Download, Image as ImageIcon } from 'lucide-react';
import { STYLE_PRESETS } from '../lib/stylePresets';

interface AiThumbnailGeneratorProps {
  isOpen: boolean;
  onClose: () => void;
  book: bookProps;
  onUpdateSuccess?: (newThumbnail: string) => void;
}

export default function AiThumbnailGenerator({ isOpen, onClose, book, onUpdateSuccess }: AiThumbnailGeneratorProps) {
  const queryClient = useQueryClient();
  
  const [selectedStyle, setSelectedStyle] = useState(STYLE_PRESETS[0].id);
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingStep, setLoadingStep] = useState(0);

  // 책 제목 정제 및 프롬프트 기본값 생성 헬퍼
  const getPromptForStyle = (styleId: string) => {
    const activeStyle = STYLE_PRESETS.find(s => s.id === styleId);
    const cleanTitle = book?.title?.replace(/[^\w\sㄱ-ㅎㅏ-ㅣ가-힣]/g, '') || '';
    return `Book cover for "${cleanTitle}", ${activeStyle?.promptPart || ''}, professional typography, 8k resolution, award-winning book design`;
  };

  // 프롬프트를 책 정보를 기반으로 직접 초기화
  const [prompt, setPrompt] = useState(() => getPromptForStyle(STYLE_PRESETS[0].id));

  // 책이 변경될 경우 프롬프트 재설정
  useEffect(() => {
    if (book) {
      setPrompt(getPromptForStyle(selectedStyle));
    }
  }, [book]);

  // 스타일 변경 처리 핸들러 (useEffect 없이 직접 상태 업데이트)
  const handleStyleChange = (styleId: string) => {
    setSelectedStyle(styleId);
    setPrompt(getPromptForStyle(styleId));
  };

  // 로딩 단계 텍스트 회전 애니메이션
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isGenerating) {
      const steps = [
        '책 내용 과몰입 중... (진심모드)',
        '표지 구도 스케치 중... ',
        'AI 화가 열일중...',
        '디테일 장인 각성 중...',
        '마무리 미모 필터 씌우는 중'
      ];
      interval = setInterval(() => {
        setLoadingStep((prev) => (prev < steps.length - 1 ? prev + 1 : prev));
      }, 2500);
    }
    return () => clearInterval(interval);
  }, [isGenerating]);

  // PocketBase DB 반영 Mutation
  const updateMutation = useMutation({
    mutationFn: async (url: string) => {
      return pb.collection('books').update(book.id, { thumbnail: url });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['books'] });
      queryClient.invalidateQueries({ queryKey: ['books-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['myBooks', pb.authStore.model?.id] });
      
      alert('AI 표지가 책장에 성공적으로 적용되었습니다!');
      if (onUpdateSuccess) {
        onUpdateSuccess(data.thumbnail);
      }
      onClose();
    },
    onError: (err) => {
      console.error('표지 저장 실패:', err);
      alert('PocketBase 저장 중 오류가 발생했습니다.');
    }
  });

  // 모달이 닫혀있으면 훅 실행 완료 후 얼리 리턴 (Rules of Hooks 준수)
  if (!isOpen) return null;

  // AI 이미지 생성 요청 처리
  const handleGenerate = async () => {
    if (!prompt.trim()) {
      alert('프롬프트를 입력해 주세요!');
      return;
    }
    
    setIsGenerating(true);
    setLoadingStep(0);
    setImageLoaded(false);
    setError(null);
    setGeneratedUrl(null);
    
    try {
      const response = await axios.post('/api/genthum', {
        prompt: prompt.trim(),
        bookId: book.id,
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
      setError(errMsg);
      setIsGenerating(false);
    }
  };

  const handleApply = () => {
    if (!generatedUrl || !imageLoaded) return;
    updateMutation.mutate(generatedUrl);
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
      link.download = `${book.title || 'book'}_ai_cover.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (e) {
      alert('이미지 다운로드에 실패했습니다. 이미지를 마우스 우클릭하여 직접 저장해 주세요.');
    }
  };

  const stepsText = [
    '책 내용 과몰입 중... (진심모드)',
    '표지 구도 스케치 중... ',
    'AI 화가 열일중...',
    '디테일 장인 각성 중...',
    '마무리 미모 필터 씌우는 중'
  ];

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex justify-center items-center z-50 p-4 transition-all duration-300">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] shadow-xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* 헤더 */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-slate-800 text-white dark:bg-slate-700">
              <Palette size={20} />
            </div>
            <div>
              <h2 className="font-extrabold text-lg text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                AI 도서 표지 생성기
              </h2>
              <p className="text-xs font-medium text-slate-400 mt-0.5">
                도서의 핵심 정보를 기반으로 맞춤형 표지를 그립니다.
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* 바디 영역 */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* 왼쪽: 이미지 프리뷰 */}
          <div className="flex flex-col items-center justify-center bg-slate-100/50 dark:bg-slate-950/40 rounded-xl p-4 border border-slate-100 dark:border-slate-800/50 min-h-[400px] relative overflow-hidden group">
            
            {generatedUrl && (
              <div 
                className="absolute inset-0 bg-cover bg-center opacity-10 blur-2xl transition-all duration-700" 
                style={{ backgroundImage: `url(${generatedUrl})` }}
              />
            )}

            {!generatedUrl && !isGenerating ? (
              <div className="text-center space-y-4 max-w-xs py-10 z-10">
                <div className="inline-flex p-4 rounded-full bg-slate-200/50 dark:bg-slate-800/50 text-slate-400">
                  <ImageIcon size={38} />
                </div>
                <h3 className="font-bold text-slate-700 dark:text-slate-300">새로운 표지가 여기에 표시됩니다</h3>
                <p className="text-xs leading-5 text-slate-400">
                  우측의 스타일 프리셋과 프롬프트를 조절한 뒤 표지 생성하기 버튼을 눌러보세요.
                </p>
                
                {book.thumbnail && (
                  <div className="pt-4 border-t border-slate-200/40 mt-4 text-left">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">현재 도서 표지</span>
                    <div className="flex gap-3 items-center bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-200/30">
                      <img src={book.thumbnail} className="w-10 h-14 object-cover rounded shadow-sm" alt="현재 표지" />
                      <span className="text-xs text-slate-500 truncate flex-1">{book.title}</span>
                    </div>
                  </div>
                )}
              </div>
            ) : null}

            {/* 로딩 인디케이터 */}
            {isGenerating && !imageLoaded && (
              <div className="absolute inset-0 bg-slate-900/90 backdrop-blur-sm flex flex-col justify-center items-center text-center p-6 z-20">
                <div className="relative mb-6">
                  <div className="w-20 h-20 rounded-full border-4 border-slate-300 border-t-indigo-600 animate-spin" />
                  <Palette size={28} className="absolute inset-0 m-auto text-indigo-400 animate-pulse" />
                </div>
                
                <h4 className="font-extrabold text-white text-base transition-all duration-300">
                  {stepsText[loadingStep]}
                </h4>
                <p className="text-xs text-slate-300 mt-2 font-medium">
                  표지를 생성하고 있습니다.
                </p>

                <div className="w-48 bg-slate-800 h-1.5 rounded-full overflow-hidden mt-6">
                  <div 
                    className="h-full bg-indigo-600 transition-all duration-1000 ease-out"
                    style={{ width: `${((loadingStep + 1) / stepsText.length) * 100}%` }}
                  />
                </div>
              </div>
            )}

            {/* 생성 결과 이미지 */}
            {generatedUrl && (
              <div className={`relative w-full max-w-[280px] aspect-[2/3] rounded-lg shadow-md overflow-hidden border border-slate-200/30 dark:border-slate-800/80 transition-all duration-500 z-10 ${imageLoaded ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}>
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
                    setError('이미지 불러오기에 실패했습니다. 다시 생성해 주세요.');
                  }}
                />
                
                {imageLoaded && (
                  <div className="absolute bottom-3 right-3 flex gap-2">
                    <button
                      onClick={handleDownload}
                      title="내 컴퓨터에 저장"
                      className="p-2 bg-slate-900/80 hover:bg-slate-950 backdrop-blur-md text-white rounded-lg transition-colors border border-slate-700/50"
                    >
                      <Download size={15} />
                    </button>
                  </div>
                )}
              </div>
            )}

            {error && (
              <div className="text-center text-red-500 text-sm font-semibold max-w-xs z-10">
                <p>{error}</p>
                <button 
                  onClick={handleGenerate}
                  className="mt-4 px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 text-xs rounded-lg font-bold flex items-center gap-1.5 mx-auto"
                >
                  <RefreshCw size={12} /> 재시도
                </button>
              </div>
            )}
          </div>

          {/* 오른쪽: 프롬프트 및 설정 패널 */}
          <div className="flex flex-col justify-between space-y-6">
            
            {/* 설정 그룹 */}
            <div className="space-y-5">
              
              {/* 스타일 선택 */}
              <div>
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-2.5">
                  1. 표지 스타일 테마
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {STYLE_PRESETS.map((style) => (
                    <button
                      key={style.id}
                      onClick={() => handleStyleChange(style.id)}
                      className={`text-left p-2.5 text-xs font-bold rounded-xl border transition-all ${
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

              {/* 프롬프트 상세 수정 */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    2. AI 프롬프트 상세설정
                  </label>
                  <button
                    onClick={() => {
                      setPrompt(getPromptForStyle(selectedStyle));
                    }}
                    className="text-[10px] font-bold text-slate-400 hover:text-indigo-600 flex items-center gap-1 transition-colors"
                    title="기본값으로 초기화"
                  >
                    <Undo size={10} /> 초기화
                  </button>
                </div>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="표지 생성을 위한 묘사를 영어로 작성하세요."
                  className="w-full min-h-[110px] p-3 text-xs leading-5 rounded-xl border border-slate-200 dark:border-slate-800 dark:bg-slate-950 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 focus:outline-none transition resize-none font-mono text-slate-700 dark:text-slate-300"
                />
                <p className="text-[10px] text-slate-400 mt-1.5 leading-relaxed">
                  표지 프롬프트는 영문으로 작성 시 가장 좋은 품질을 발휘합니다. 책의 메인 테마 단어(예: SF, romance, coding)를 추가해 보세요.
                </p>
              </div>

              {/* 원본 도서 정보 확인 */}
              <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800/80 rounded-xl p-3.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">도서 정보 요약</span>
                <h4 className="font-extrabold text-sm text-slate-800 dark:text-slate-200 truncate">{book.title}</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                  {book.contents || '등록된 소개가 없습니다.'}
                </p>
              </div>
            </div>

            {/* 하단 액션 버튼 */}
            <div className="flex gap-3 pt-4 border-t border-slate-100 dark:border-slate-800/80 shrink-0">
              <button
                onClick={handleGenerate}
                disabled={isGenerating}
                className="flex-1 cursor-pointer py-3 px-4 bg-slate-800 hover:bg-slate-900 disabled:opacity-50 text-white font-extrabold text-sm rounded-xl transition flex items-center justify-center gap-2"
              >
                {isGenerating ? <RefreshCw size={16} className="animate-spin" /> : <Palette size={16} />}
                {isGenerating ? '표지 생성 중...' : '표지 생성하기'}
              </button>

              <button
                onClick={handleApply}
                disabled={!imageLoaded || updateMutation.isPending || isGenerating}
                className={`py-3 px-5 font-extrabold text-sm rounded-xl transition flex items-center gap-1.5 cursor-pointer ${
                  imageLoaded && !updateMutation.isPending && !isGenerating
                    ? 'bg-indigo-600 hover:bg-indigo-700 text-white dark:bg-indigo-600 dark:text-white dark:hover:bg-indigo-700'
                    : 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500 cursor-not-allowed'
                }`}
              >
                <Check size={16} />
                {updateMutation.isPending ? '적용 중...' : '적용하기'}
              </button>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
