'use client';
import { useQuery } from '@tanstack/react-query';
import { pb } from '../lib/pocketbase';
import { bookProps } from '../page';

export default function RankingSidebar({ books }: { books: bookProps[] }) {
  if (!books || books.length === 0) return null;

  // 모든 책의 좋아요 개수 조회
  const { data: likeCounts = {} } = useQuery({
    queryKey: ['allLikeCounts', books.map(b => b.id).join(',')],
    queryFn: async () => {
      const counts: Record<string, number> = {};
      for (const book of books) {
        try {
          const records = await pb.collection('likes').getFullList({
            filter: `book="${book.id}"`,
          });
          counts[book.id] = records.length;
        } catch (error) {
          counts[book.id] = 0;
        }
      }
      return counts;
    },
    staleTime: 0,
  });

  // 좋아요 개수 기반 정렬
  const ranked = [...(books || [])]
    .map(book => ({
      ...book,
      likeCount: likeCounts[book.id] || 0
    }))
    .sort((a, b) => b.likeCount - a.likeCount)
    .slice(0, 10);

  return (
    <div className="w-64 bg-gradient-to-b from-pink-50 via-purple-50 to-blue-50 rounded-lg p-6 shadow-lg sticky top-8 h-fit border-2 border-pink-200">
      <h3 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-600 to-purple-600 mb-6">
        ❤️ 인기 도서 TOP 10
      </h3>
      <div className="space-y-3">
        {ranked.map((book, idx) => (
          <div
            key={book.id}
            className="flex items-center gap-3 p-3 bg-white rounded-lg shadow-sm hover:shadow-md transition border border-pink-100 hover:border-pink-300"
          >
            {/* 순위 배지 */}
            <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-white text-sm ${
              idx === 0 ? 'bg-gradient-to-r from-yellow-400 to-yellow-500' :
              idx === 1 ? 'bg-gradient-to-r from-gray-300 to-gray-400' :
              idx === 2 ? 'bg-gradient-to-r from-orange-400 to-orange-500' :
              'bg-gradient-to-r from-blue-400 to-blue-500'
            }`}>
              {idx + 1}
            </div>

            {/* 책 정보 */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-gray-800 truncate hover:text-clip" title={book.title}>
                {book.title}
              </p>
              <p className="text-xs text-gray-600 truncate">
                {book.author}
              </p>
            </div>

            {/* 좋아요 개수 */}
            <div className="flex-shrink-0">
              <span className="inline-block px-3 py-1 bg-pink-100 text-pink-600 rounded-full text-sm font-bold">
                {ranked[idx].likeCount}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* 총 책 개수 */}
      <div className="mt-6 pt-6 border-t-2 border-pink-200 text-center">
        <p className="text-sm font-bold text-gray-700">
          📚 총 <span className="text-pink-600">{books.length}</span>권의 도서
        </p>
      </div>
    </div>
  );
}
