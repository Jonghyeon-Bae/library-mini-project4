'use client';

import { useState } from 'react';
import { pb } from '../lib/pocketbase';
import { X, Mail, Lock, User, UserPlus, Loader2 } from 'lucide-react';

interface RegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginClick: () => void;
}

export default function RegisterModal({ isOpen, onClose, onLoginClick }: RegisterModalProps) {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !username.trim() || !password.trim() || !passwordConfirm.trim()) {
      setError('모든 필드를 채워주세요.');
      return;
    }
    if (password !== passwordConfirm) {
      setError('비밀번호가 일치하지 않습니다.');
      return;
    }
    if (password.length < 8) {
      setError('비밀번호는 최소 8자 이상이어야 합니다.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const data = {
        email: email.trim(),
        name: username.trim(), // 실제 DB의 name 필드에 매핑
        password,
        passwordConfirm,
        emailVisibility: true,
      };

      // 1. 회원가입 진행
      await pb.collection('users').create(data);
      // 2. 가입 성공 후 즉시 자동 로그인 (이메일로 인증)
      await pb.collection('users').authWithPassword(email.trim(), password);
      
      alert('회원가입 및 로그인이 완료되었습니다!');
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err?.message || '회원가입에 실패했습니다. 입력값을 확인해주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-slate-950/80 flex justify-center items-center z-50 p-4 transition-all duration-300"
      onClick={onClose}
    >
      <div 
        className="bg-slate-900/95 text-white rounded-2xl w-full max-w-md border border-slate-800 shadow-2xl overflow-hidden relative transform scale-100 transition-all duration-300 flex flex-col p-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Decorative background glow */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-purple-500/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-pink-500/20 rounded-full blur-3xl pointer-events-none"></div>

        {/* Close Button */}
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors cursor-pointer p-1 hover:bg-slate-800/80 rounded-full"
        >
          <X size={20}/>
        </button>

        {/* Header */}
        <div className="text-center mb-6 relative">
          <div className="inline-flex items-center justify-center p-3 bg-purple-500/10 rounded-xl mb-3 border border-purple-500/20">
            <UserPlus className="text-purple-400" size={32} />
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-purple-400 via-pink-200 to-rose-400 bg-clip-text text-transparent">
            새로운 시작을 함께해요
          </h2>
          <p className="text-sm text-slate-400 mt-2">몇 가지 간단한 정보로 계정을 만들어보세요.</p>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-4 p-3 bg-red-950/50 border border-red-500/30 rounded-lg text-red-200 text-sm font-medium">
            ⚠️ {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleRegister} className="space-y-4 relative">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              이메일 주소
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 pointer-events-none">
                <Mail size={18} />
              </span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-950/50 border border-slate-800 hover:border-slate-700 focus:border-purple-500 rounded-xl py-2.5 pl-10 pr-4 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all font-medium"
                placeholder="example@email.com"
                disabled={isLoading}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              아이디 (Username)
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 pointer-events-none">
                <User size={18} />
              </span>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-slate-950/50 border border-slate-800 hover:border-slate-700 focus:border-purple-500 rounded-xl py-2.5 pl-10 pr-4 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all font-medium"
                placeholder="영문, 숫자 혼용 가능"
                disabled={isLoading}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              비밀번호
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 pointer-events-none">
                <Lock size={18} />
              </span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-950/50 border border-slate-800 hover:border-slate-700 focus:border-purple-500 rounded-xl py-2.5 pl-10 pr-4 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all font-medium"
                placeholder="8자 이상 입력"
                disabled={isLoading}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              비밀번호 확인
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 pointer-events-none">
                <Lock size={18} />
              </span>
              <input
                type="password"
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
                className="w-full bg-slate-950/50 border border-slate-800 hover:border-slate-700 focus:border-purple-500 rounded-xl py-2.5 pl-10 pr-4 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all font-medium"
                placeholder="비밀번호 재입력"
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold py-3 px-4 rounded-xl shadow-lg shadow-purple-500/25 transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed mt-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="animate-spin" size={20} />
                가입 중...
              </>
            ) : (
              '회원가입'
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="text-center mt-5 text-sm text-slate-400 relative">
          이미 계정이 있으신가요?{' '}
          <button 
            type="button"
            onClick={() => {
              onClose();
              onLoginClick();
            }}
            className="text-purple-400 hover:text-purple-300 font-bold underline cursor-pointer bg-transparent border-none"
          >
            로그인하기
          </button>
        </div>
      </div>
    </div>
  );
}
