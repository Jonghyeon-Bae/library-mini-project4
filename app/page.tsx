'use client';

// 가짜 데이터(Dummy)로 화면부터 그려봅니다.
const dummyBooks = [
  { id: 1, title: '해리포터와 마법사의 돌', author: 'J.K. 롤링', publisher: '문학수첩', isAvailable: true, thumbnail: 'https://via.placeholder.com/150' },
  { id: 2, title: '반지의 제왕', author: 'J.R.R. 톨킨', publisher: '황금가지', isAvailable: false, thumbnail: 'https://via.placeholder.com/150' }
];

export default function Home() {
  return (
    <main className="max-w-5xl mx-auto p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">📚 도서 관리 시스템</h1>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
          + 새 도서 추가
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {dummyBooks.map((book) => (
          <div key={book.id} className="bg-white rounded-lg shadow overflow-hidden relative">
            <button className="absolute top-2 right-2 bg-red-500 text-white w-6 h-6 rounded-full text-xs">×</button>
            <img src={book.thumbnail} alt={book.title} className="w-full h-48 object-cover" />
            <div className="p-4">
              <h2 className="font-bold text-lg truncate">{book.title}</h2>
              <p className="text-sm text-gray-500 truncate">{book.author} | {book.publisher}</p>
              <button className={`mt-4 w-full py-2 rounded text-sm font-bold ${
                book.isAvailable ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
              }`}>
                {book.isAvailable ? '대출 가능' : '대출 중'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}









//  Step 3 Tanstack Query Imported.
// 'use client';

// import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
// import { pb } from '../lib/pocketbase';
// import { useState } from 'react';
// import AddBookModal from '../components/AddBookModal';
// import DashboardChart from '../components/DashboardChart';

// export default function Home() {
//   // 더미 데이터 삭제! 마법의 심부름꾼(useQuery) 투입
//   const queryClient = useQueryClient();
//   const [isModalOpen, setIsModalOpen] = useState(false); // 상태 추가
//   const { data: books, isPending } = useQuery({
//     queryKey: ['books'],
//     queryFn: () => pb.collection('books').getFullList({ sort: '-created' }),
//   });
//   // 대출 상태 변경 Mutation 추가
  // const toggleMutation = useMutation({
  //   mutationFn: ({ id, isAvailable }) => pb.collection('books').update(id, { isAvailable: !isAvailable }),
  //   onSuccess: () => queryClient.invalidateQueries({ queryKey: ['books'] }),
  // });

  // // 삭제 Mutation 추가
  // const deleteMutation = useMutation({
  //   mutationFn: (id) => pb.collection('books').delete(id),
  //   onSuccess: () => queryClient.invalidateQueries({ queryKey: ['books'] }),
  // });

//   return (
//     <main className="max-w-5xl mx-auto p-8">
//       <div className="flex justify-between items-center mb-8">
//         <h1 className="text-3xl font-bold">📚 도서 관리 시스템</h1>
//         <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
//           + 새 도서 추가
//         </button>
{/* <button onClick={() => { if(confirm('삭제하시겠습니까?')) deleteMutation.mutate(book.id) }}
            className="absolute top-2 right-2 bg-red-500 text-white w-6 h-6 rounded-full text-xs">
            ×
          </button> */}
//       </div>

//       {/* 로딩 처리 추가 */}
//       {isPending && <p className="text-center py-10 text-gray-500">책장을 불러오는 중... 🔄</p>}
{/*      <DashboardChart books={books} /> */}
//       <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
//         {books?.map((book) => (
//           // (카드 UI 내용은 Step 1과 완전히 동일하게 유지)
//           <div key={book.id} className="bg-white rounded-lg shadow overflow-hidden relative">
//             <button className="absolute top-2 right-2 bg-red-500 text-white w-6 h-6 rounded-full text-xs">×</button>
//             <img src={book.thumbnail || "https://via.placeholder.com/150"} alt={book.title} className="w-full h-48 object-cover" />
//             <div className="p-4">
//               <h2 className="font-bold text-lg truncate">{book.title}</h2>
//               <p className="text-sm text-gray-500 truncate">{book.author} | {book.publisher}</p>
//               <button className={`mt-4 w-full py-2 rounded text-sm font-bold ${
//                 book.isAvailable ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
//               }`}
// onClick={() => toggleMutation.mutate({ id: book.id, isAvailable: book.isAvailable })}>
//                 {book.isAvailable ? '대출 가능' : '대출 중'}
//               </button>
//             </div>
//           </div>
//         ))}
//       </div>
{/* <AddBookModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} /> */}
//     </main>
//   );
// }