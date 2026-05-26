'use client';
import { bookProps } from '../page';

interface MutationLike<T>{
  mutate: (args: T) => void;
  isPending?: boolean;
};

export default function BookDetailView({ selectedBook,
onBack,
toggleMutation,
deleteMutation,
onDelete }: { selectedBook: bookProps; onBack: () => void; toggleMutation: MutationLike<{ id: string; isAvailable?: boolean }>; deleteMutation: MutationLike<string>; onDelete: (id: string) => void }) {

return(
            <section className="mt-6 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          {/* 상단 영역 */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <button
              onClick={onBack}
              className="w-fit px-4 py-2 rounded-lg border text-sm font-bold hover:bg-gray-100"
            >
              ← 목록으로
            </button>

            <div className="flex flex-wrap gap-2">
              {selectedBook.bestbook && (
                <span className="bg-yellow-400 text-black px-3 py-1 rounded-md font-bold text-sm">
                  ★ 강추 도서
                </span>
              )}

              <span
                className={`px-3 py-1 rounded-md font-bold text-sm ${
                  selectedBook.isAvailable
                    ? "bg-green-100 text-green-700"
                    : "bg-red-100 text-red-700"
                }`}
              >
                {selectedBook.isAvailable ? "대출 가능" : "대출 중"}
              </span>
            </div>
          </div>

          {/* 메인 정보 영역 */}
          <div className="grid grid-cols-1 md:grid-cols-[320px_1fr] gap-8">
            {/* 왼쪽: 표지 */}
            <div className="bg-gray-50 rounded-2xl border border-gray-100 p-4">
              <img
                src={selectedBook.thumbnail || "https://via.placeholder.com/300"}
                alt={selectedBook.title || "도서 표지"}
                className="w-full h-105 object-cover rounded-xl bg-gray-100"
              />
            </div>

            {/* 오른쪽: 기본 정보 */}
            <div className="flex flex-col justify-between">
              <div>
                <h2 className="text-3xl font-extrabold text-gray-800 mb-6 leading-tight">
                  {selectedBook.title || "제목 없음"}
                </h2>

                <div className="space-y-3">
                  <div className="flex border-b border-gray-100 pb-3">
                    <span className="w-24 shrink-0 text-sm font-bold text-gray-500">
                      저자
                    </span>
                    <span className="text-gray-800">
                      {selectedBook.author || "정보 없음"}
                    </span>
                  </div>

                  <div className="flex border-b border-gray-100 pb-3">
                    <span className="w-24 shrink-0 text-sm font-bold text-gray-500">
                      출판사
                    </span>
                    <span className="text-gray-800">
                      {selectedBook.publisher || "정보 없음"}
                    </span>
                  </div>

                  <div className="flex border-b border-gray-100 pb-3">
                    <span className="w-24 shrink-0 text-sm font-bold text-gray-500">
                      등록일
                    </span>
                    <span className="text-gray-800">
                      {selectedBook.created
                        ? new Date(selectedBook.created).toLocaleDateString()
                        : "정보 없음"}
                    </span>
                  </div>

                  <div className="flex border-b border-gray-100 pb-3">
                    <span className="w-24 shrink-0 text-sm font-bold text-gray-500">
                      수정일
                    </span>
                    <span className="text-gray-800">
                      {selectedBook.updated
                        ? new Date(selectedBook.updated).toLocaleDateString()
                        : "정보 없음"}
                    </span>
                  </div>

                  <div className="flex border-b border-gray-100 pb-3">
                    <span className="w-24 shrink-0 text-sm font-bold text-gray-500">
                      좋아요
                    </span>
                    <span className="text-gray-800">
                      {selectedBook.like_count ?? 0}개
                    </span>
                  </div>
                </div>
              </div>

              {/* 수정_최승헌_5-3 상세 페이지 안에서도 대출 상태 변경 가능 (selectedBook 즉시 반영) */}
              <button
                onClick={() =>
                  toggleMutation.mutate({
                    id: selectedBook.id,
                    isAvailable: selectedBook.isAvailable,
                  })
                }
                disabled={toggleMutation.isPending}
                className={`mt-8 w-full py-3 rounded-xl font-bold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                  selectedBook.isAvailable
                    ? "bg-green-100 text-green-700 hover:bg-green-200"
                    : "bg-red-100 text-red-700 hover:bg-red-200"
                }`}
              >
                {toggleMutation.isPending
                  ? "처리 중..."
                  : selectedBook.isAvailable
                    ? "대출하기"
                    : "반납하기"}
              </button>
            </div>
          </div>

          {/* 책 소개 영역 */}
          <div className="mt-8 bg-gray-50 rounded-2xl border border-gray-100 p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-3">
              책 소개
            </h3>

            <p className="text-gray-600 leading-7 whitespace-pre-line">
              {selectedBook.contents || "등록된 책 소개가 없습니다."}
            </p>
          </div>

          {/* AI 리뷰 영역 */}
          <div className="mt-6 bg-blue-50 rounded-2xl border border-blue-100 p-6">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xl">🤖</span>
              <h3 className="text-xl font-bold text-gray-800">
                AI 리뷰 / 요약
              </h3>
            </div>

            <p className="text-gray-700 leading-7 whitespace-pre-line">
              {selectedBook.ai_review || "아직 등록된 AI 리뷰가 없습니다."}
            </p>
          </div>

          {/* 관리 버튼 영역 */}
          <div className="mt-6 flex justify-end">
            <button
              onClick={() => {
                if (confirm("정말 삭제하시겠습니까?")) {
                  deleteMutation.mutate(selectedBook.id);
                  onDelete(selectedBook.id);
                }
              }}
              className="px-4 py-2 rounded-lg bg-red-500 text-white text-sm font-bold hover:bg-red-600"
            >
              도서 삭제
            </button>
          </div>
        </section>
)
}