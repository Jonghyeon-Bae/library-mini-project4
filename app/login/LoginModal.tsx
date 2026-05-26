'use client';

import { useState } from 'react';
import { pb } from '../lib/pocketbase';
import { X, Mail, Lock, LogIn, Loader2 } from 'lucide-react';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRegisterClick: () => void;
}

export default function LoginModal({ isOpen, onClose, onRegisterClick }: LoginModalProps) {
  const [identity, setIdentity] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identity.trim() || !password.trim()) {
      setError('이메일과 비밀번호를 입력해주세요.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await pb.collection('users').authWithPassword(identity.trim(), password);
      alert('로그인에 성공했습니다!');
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err?.message || '로그인에 실패했습니다. 이메일과 비밀번호를 확인해주세요.');
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
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-blue-500/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-purple-500/20 rounded-full blur-3xl pointer-events-none"></div>

        {/* Close Button */}
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors cursor-pointer p-1 hover:bg-slate-800/80 rounded-full"
        >
          <X size={20}/>
        </button>

        {/* Header */}
        <div className="text-center mb-8 relative">
          <div className="inline-flex items-center justify-center p-3 bg-blue-500/10 rounded-xl mb-4 border border-blue-500/20">
            <LogIn className="text-blue-400" size={32} />
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-blue-400 via-indigo-200 to-purple-400 bg-clip-text text-transparent">
            반가워요! 다시 오셨군요
          </h2>
          <p className="text-sm text-slate-400 mt-2">서비스 이용을 위해 로그인을 완료해주세요.</p>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-4 p-3 bg-red-950/50 border border-red-500/30 rounded-lg text-red-200 text-sm font-medium">
            ⚠️ {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-5 relative">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              이메일 주소
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 pointer-events-none">
                <Mail size={18} />
              </span>
              <input
                type="email"
                value={identity}
                onChange={(e) => setIdentity(e.target.value)}
                className="w-full bg-slate-950/50 border border-slate-800 hover:border-slate-700 focus:border-blue-500 rounded-xl py-3 pl-10 pr-4 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all font-medium"
                placeholder="example@email.com"
                disabled={isLoading}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
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
                className="w-full bg-slate-950/50 border border-slate-800 hover:border-slate-700 focus:border-blue-500 rounded-xl py-3 pl-10 pr-4 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all font-medium"
                placeholder="••••••••"
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold py-3.5 px-4 rounded-xl shadow-lg shadow-blue-500/25 transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed mt-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="animate-spin" size={20} />
                로그인 중...
              </>
            ) : (
              '로그인'
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="text-center mt-6 text-sm text-slate-400 relative">
          아직 계정이 없으신가요?{' '}
          <button 
            type="button"
            onClick={() => {
              onClose();
              onRegisterClick();
            }}
            className="text-blue-400 hover:text-blue-300 font-bold underline cursor-pointer bg-transparent border-none"
          >
            회원가입
          </button>
        </div>
      </div>
    </div>
  );
}
