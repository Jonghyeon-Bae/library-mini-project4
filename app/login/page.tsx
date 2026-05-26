'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { pb } from '../lib/pocketbase'; // 경로는 프로젝트에 맞게 수정해주세요

export default function LoginPage() {
  const router = useRouter();
  
  // 상태 관리
  const [isSignupMode, setIsSignupMode] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); // 폼 제출 시 페이지 새로고침 방지
    if (isLoading) return;
    setIsLoading(true);

    try {
      if (isSignupMode) {
        // [회원가입 로직]
        if (password !== passwordConfirm) {
          alert('비밀번호가 일치하지 않습니다.');
          setIsLoading(false);
          return;
        }

        // 1. PocketBase에 유저 생성 (users 컬렉션)
        await pb.collection('users').create({
          email,
          password,
          passwordConfirm,
        });

        // 2. 가입 직후 자동 로그인 처리 (UX 향상)
        await pb.collection('users').authWithPassword(email, password);
        alert('회원가입 및 로그인이 완료되었습니다!');

      } else {
        // [로그인 로직]
        await pb.collection('users').authWithPassword(email, password);
        alert('환영합니다!');
      }

      // 로그인 성공 시 메인 페이지로 이동 및 라우터 새로고침
      router.push('/');
      router.refresh(); 

    } catch (error: string | any) {
      console.error('Auth Error:', error);
      // PB 에러 메시지는 error.response.message 등에 담겨 옵니다
      alert(isSignupMode ? '회원가입에 실패했습니다.' : '이메일이나 비밀번호를 확인해주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
        
        {/* 헤더 타이틀 */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-extrabold text-gray-900">
            {isSignupMode ? '새 계정 만들기' : '로그인'}
          </h2>
          <p className="text-sm text-gray-500 mt-2">
            오승헌의 직박구리에 오신 것을 환영합니다.
          </p>
        </div>

        {/* 폼 영역 */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">이메일</label>
            <input 
              type="email" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
              placeholder="name@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">비밀번호</label>
            <input 
              type="password" 
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
              placeholder="최소 8자 이상"
              minLength={8}
            />
          </div>

          {/* 회원가입 모드일 때만 비밀번호 확인 필드 노출 */}
          {isSignupMode && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">비밀번호 확인</label>
              <input 
                type="password" 
                required
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
                placeholder="비밀번호를 한번 더 입력해주세요"
                minLength={8}
              />
            </div>
          )}

          <button 
            type="submit" 
            disabled={isLoading}
            className={`w-full py-3 rounded-lg font-bold text-white transition-colors ${
              isLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {isLoading ? '처리 중...' : (isSignupMode ? '가입하기' : '로그인')}
          </button>
        </form>

        {/* 모드 전환 토글 버튼 */}
        <div className="mt-6 text-center text-sm text-gray-600">
          {isSignupMode ? '이미 계정이 있으신가요?' : '아직 계정이 없으신가요?'}
          <button 
            type="button"
            onClick={() => setIsSignupMode(!isSignupMode)}
            className="ml-2 font-bold text-blue-600 hover:underline outline-none"
          >
            {isSignupMode ? '로그인하기' : '회원가입하기'}
          </button>
        </div>

      </div>
    </div>
  );
}