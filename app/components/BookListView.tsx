'use client';
import { bookProps } from '../page';
import LikeButton from '../components/Likebutton';
import { memo } from 'react';


const BookListView = memo(function BookListView({ 
    books,
    totalPages,
    page,
    visiblePages,
sortOption,
setPressSetSelectedBook,
setSortOption,
setPage,
deleteMutation 
}: {
books: bookProps[]
totalPages: number
page: number
visiblePages: number[]
sortOption: string
setPressSetSelectedBook: (book: bookProps) => void
setSortOption: (option: string) => void
setPage: (pageNum: number) => void
deleteMutation: any }) {

return(
        <>
          {/* 정렬 버튼 영역 */}
          <div className="flex gap-3 mb-6 mt-4">
            <button
              onClick={() => {
                setSortOption('-created');
                setPage(1);
              }}
              className={`px-3 py-2 cursor-pointer rounded-lg border text-sm font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-100 ${
                sortOption === '-created' ? 'text-blue-500 border-blue-200 bg-blue-50' : 'text-gray-500'
              }`}
            >
              최신순
            </button>

            <button
              onClick={() => {
                setSortOption('created');
                setPage(1);
              }}
              className={`px-3 py-2 cursor-pointer rounded-lg border text-sm font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-100 ${
                sortOption === 'created' ? 'text-violet-500 border-violet-200 bg-violet-50' : 'text-gray-500'
              }`}
            >
              오래된 순
            </button>

            <button
              onClick={() => {
                setSortOption('title');
                setPage(1);
              }}
              className={`px-3 py-2 cursor-pointer rounded-lg border text-sm font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-100 ${
                sortOption === 'title' ? 'text-cyan-500 border-cyan-200 bg-cyan-50' : 'text-gray-500'
              }`}
            >
              제목순
            </button>
          </div>

          {/* 도서 목록 그리드 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 ">
            {books?.map((book) => (
              <div
                key={book.id}
                onClick={() => setPressSetSelectedBook(book)}
                className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden relative hover:shadow-md transition-shadow cursor-pointer"
              >

                {/* 삭제 버튼 */}
                <button 
                  onClick={(e) => {
                    e.stopPropagation();

                    if(confirm('정말 삭제하시겠습니까?')) {
                      deleteMutation.mutate(book.id);
                    }
                  }}
                  className="absolute cursor-pointer hover:bg-black top-3 right-3 bg-red-500 text-white w-7 h-7 rounded-full flex justify-center items-center text-sm opacity-80 hover:opacity-100 z-10 transition-opacity shadow-sm"
                >
                  ×
                </button>

                {/* 추천! */}
                {book.bestbook ? (
                  <span className='absolute top-3 left-3 bg-yellow-400 text-black px-2 py-1 rounded-md font-bold'>★강추!</span>
                ) : <></>}

                {/* 썸네일 */}
                <img 
                  src={book.thumbnail || "https://via.placeholder.com/150"} 
                  alt={book.title || "도서 표지"} 
                  className="w-full h-56 object-cover bg-gray-100 hover:scale-110 transition-transform duration-300" 
                />

                <div className="p-4">
                  <h3 className="font-bold text-lg text-gray-800 line-clamp-1">{book.title}</h3>
                  <p className="text-sm text-gray-500 mt-1 line-clamp-1">{book.author} | {book.publisher}</p>

                  <div onClick={(e) => e.stopPropagation()}>
                    <LikeButton bookId={book.id} initialLikeCount={book.like_count || 0} />
                  </div>

                </div>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-8 mb-10">
              <button
                onClick={() => setPage(1)}
                disabled={page === 1}
                className="px-3 py-2 rounded-lg border text-sm font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-100"
              >
                처음
              </button>

              <button
                onClick={() => setPage(Math.max(page - 1, 1))}
                disabled={page === 1}
                className="px-3 py-2 rounded-lg border text-sm font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-100"
              >
                이전
              </button>

              {visiblePages.map((pageNum) => (
                <button
                  key={pageNum}
                  onClick={() => setPage(pageNum)}
                  className={`px-3 py-2 rounded-lg border text-sm font-bold ${
                    page === pageNum
                      ? 'bg-black text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {pageNum}
                </button>
              ))}

              <button
                onClick={() => setPage(Math.min(page + 1, totalPages))}
                disabled={page === totalPages}
                className="px-3 py-2 rounded-lg border text-sm font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-100"
              >
                다음
              </button>

              <button
                onClick={() => setPage(totalPages)}
                disabled={page === totalPages}
                className="px-3 py-2 rounded-lg border text-sm font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-100"
              >
                끝
              </button>
            </div>
          )}
        </>
)
}
  );
  export default BookListView