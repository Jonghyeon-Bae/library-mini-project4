'use client';
import { useState, useEffect } from 'react';
import { bookProps } from '../page';
import AiThumbnailGenerator from '../genthum/AiThumbnailGenerator';
import { Sparkles, Palette } from 'lucide-react';
import { pb } from '../lib/pocketbase';
import { OpenAI } from 'openai';

interface MutationLike<T>{
  mutate: (args: T) => void;
  isPending?: boolean;
}

export default function BookDetailView({ 
  selectedBook,
  onBack,
  toggleMutation,
  deleteMutation,
  onDelete,
  onUpdateBook 
}: { 
  selectedBook: bookProps
  onBack: () => void
  toggleMutation: MutationLike<{ id: string; isAvailable?: boolean; borrower_id?: string }>
  deleteMutation: MutationLike<string> 
  onDelete: (id: string) => void
  onUpdateBook?: (book: bookProps) => void 
}) {
  const [isAiGenOpen, setIsAiGenOpen] = useState(false);
  const [isGeneratingReview, setIsGeneratingReview] = useState(false);
  const [streamedReview, setStreamedReview] = useState("");

  // 💡 1. 부모가 준 과거 데이터를 덮어쓸 안전한 '로컬 AI 리뷰 상태' 생성
  const [localAiReview, setLocalAiReview] = useState(selectedBook.ai_review || "");

  const currentUser = pb.authStore.model;
  const isAvailable = selectedBook.isAvailable;
  const isBorrower = currentUser?.id === selectedBook.borrower_id;
  const canControl = isAvailable || (!isAvailable && isBorrower);

  // 💡 2. 컴포넌트 마운트(진입) 시 PocketBase에서 최신 데이터 강제 동기화
  useEffect(() => {
    let isMounted = true;
    
    const fetchLatestData = async () => {
      try {
        // requestKey: null 옵션은 연속된 동일 API 호출이 취소되는 것을 방지합니다.
        const record = await pb.collection('books').getOne(selectedBook.id, { requestKey: null });
        if (isMounted && record.ai_review) {
          setLocalAiReview(record.ai_review); // DB에서 가져온 최신 리뷰로 덮어쓰기
        }
      } catch (error) {
        console.error("도서 최신 데이터 동기화 실패:", error);
      }
    };

    fetchLatestData();

    return () => { isMounted = false; };
  }, [selectedBook.id]); // 도서 id가 바뀔 때마다 실행

  const handleGenerateReview = async () => {
    if (isGeneratingReview) return;
    setIsGeneratingReview(true);
    setStreamedReview("");

    try {
      const apiKey = process.env.NEXT_PUBLIC_LLM_API_KEY;
      const openai = new OpenAI({
        apiKey,
        dangerouslyAllowBrowser: true, 
        baseURL: "https://api.upstage.ai/v1"
      });

      const isAdvanced = (selectedBook.contents?.length || 0) > 300;

      const chatCompletion = await openai.chat.completions.create({
        model: "solar-pro3",
        messages: [
          { role: "system", content: "당신은 도서 큐레이터입니다. 주어진 책 정보를 바탕으로 핵심을 3~4문장으로 요약하고, 독자의 흥미를 유발하는 리뷰를 작성해주세요." },
          { role: "user", content: `책 제목: ${selectedBook.title}\n저자: ${selectedBook.author}\n책 소개: ${selectedBook.contents || '내용 없음'}` }
        ],
        temperature: 0.3, 
        top_p: isAdvanced ? 0.8 : 0.5,
        stream: true
      });

      let fullReview = "";

      for await (const chunk of chatCompletion) {
        const content = chunk.choices[0]?.delta?.content || "";
        fullReview += content;
        setStreamedReview(fullReview);
      }

      await pb.collection('books').update(selectedBook.id, { ai_review: fullReview });
      
      // 💡 3. 스트리밍 완료 후 즉시 로컬 상태 갱신
      setLocalAiReview(fullReview); 

      if (onUpdateBook) {
        onUpdateBook({ ...selectedBook, ai_review: fullReview });
      }

    } catch (e) {
      console.error(e);
      alert('AI 리뷰 생성에 실패했습니다.');
    } finally {
      setIsGeneratingReview(false);
    }
  };

  return(
    <section className="mt-6 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      {/* 상단, 메인, 책 소개 영역은 수정할 필요 없으므로 기존 코드 그대로 사용합니다 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <button onClick={onBack} className="w-fit px-4 py-2 rounded-lg border text-sm font-bold hover:bg-gray-100">
          ← 목록으로
        </button>
        <div className="flex flex-wrap gap-2">
          {selectedBook.bestbook && <span className="bg-yellow-400 text-black px-3 py-1 rounded-md font-bold text-sm">★ 강추 도서</span>}
          <span className={`px-3 py-1 rounded-md font-bold text-sm ${selectedBook.isAvailable ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
            {selectedBook.isAvailable ? "대출 가능" : "대출 중"}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[320px_1fr] gap-8">
        <div className="bg-gray-50 rounded-2xl border border-gray-100 p-4 flex flex-col gap-4">
          <img src={selectedBook.thumbnail || "https://via.placeholder.com/300"} alt={selectedBook.title || "도서 표지"} className="w-full h-105 object-cover rounded-xl bg-gray-100" />
          {(!selectedBook.thumbnail || selectedBook.thumbnail.includes('placeholder')) && (
            <button onClick={() => setIsAiGenOpen(true)} className="w-full py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-extrabold text-xs rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer">
              <Palette size={14} /> AI 표지 이미지 생성
            </button>
          )}
        </div>

        <div className="flex flex-col justify-between">
          <div>
            <h2 className="text-3xl font-extrabold text-gray-800 mb-6 leading-tight">{selectedBook.title || "제목 없음"}</h2>
            <div className="space-y-3">
              {/* 저자, 출판사 등 영역 생략(유지) */}
            </div>
          </div>
          <button onClick={() => { const nextBorrowerId = isAvailable ? currentUser?.id : ""; toggleMutation.mutate({ id: selectedBook.id, isAvailable, borrower_id: nextBorrowerId }) }} disabled={toggleMutation.isPending || !currentUser || !canControl} className={`mt-8 w-full py-3 rounded-xl font-bold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${!currentUser ? "bg-gray-200 text-gray-500" : !canControl ? "bg-gray-200 text-gray-400" : isAvailable ? "bg-green-100 text-green-700 hover:bg-green-200" : "bg-red-100 text-red-700 hover:bg-red-200"}`}>
            {!currentUser ? "로그인이 필요합니다" : toggleMutation.isPending ? "처리 중..." : isAvailable ? "대출하기" : isBorrower ? "반납하기" : "대출 중 (반납 권한 없음)"}
          </button>
        </div>
      </div>

      <div className="mt-8 bg-gray-50 rounded-2xl border border-gray-100 p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-3">책 소개</h3>
        {selectedBook.contents ? (
          <div className="text-gray-600 leading-7 break-keep" dangerouslySetInnerHTML={{ __html: selectedBook.contents }} />
        ) : (
          <p className="text-gray-600 leading-7 whitespace-pre-line">등록된 책 소개가 없습니다.</p>
        )}
      </div>

      {/* AI 리뷰 영역 */}
      <div className="mt-6 bg-blue-50 rounded-2xl border border-blue-100 p-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-xl">🤖</span>
            <h3 className="text-xl font-bold text-gray-800">AI 요약</h3>
          </div>
          <button
            onClick={handleGenerateReview}
            disabled={isGeneratingReview}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-slate-800 text-white font-bold rounded-lg hover:bg-slate-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Sparkles size={16} />
            {isGeneratingReview ? '생성 중...' : 'AI 리뷰 생성'}
          </button>
        </div>

        <p className="text-gray-700 leading-7 whitespace-pre-line min-h-[60px]">
          {isGeneratingReview ? (
            <>
              {streamedReview || "AI가 책 내용을 분석하여 리뷰를 작성하고 있습니다..."}
              <span className="animate-pulse font-bold ml-1 text-blue-600">|</span>
            </>
          ) : (
            /* 💡 4. selectedBook.ai_review 대신 무조건 localAiReview를 바라보도록 수정 */
            localAiReview || "아직 등록된 AI 리뷰가 없습니다."
          )}
        </p>
      </div>

      <div className="mt-6 flex justify-end">
        <button onClick={() => { if (confirm("정말 삭제하시겠습니까?")) { deleteMutation.mutate(selectedBook.id); onDelete(selectedBook.id); } }} className="px-4 py-2 rounded-lg bg-red-500 text-white text-sm font-bold hover:bg-red-600">
          도서 삭제
        </button>
      </div>

      {isAiGenOpen && (
        <AiThumbnailGenerator
          isOpen={isAiGenOpen}
          onClose={() => setIsAiGenOpen(false)}
          book={selectedBook}
          onUpdateSuccess={(newThumbnail) => {
            if (onUpdateBook) { onUpdateBook({ ...selectedBook, thumbnail: newThumbnail }); }
          }}
        />
      )}
    </section>
  )
}