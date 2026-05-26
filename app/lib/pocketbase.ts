import PocketBase from 'pocketbase';

// 포트 번호(8090) 
export const pb = new PocketBase('http://127.0.0.1:8090');

// 브라우저 환경에서 쿠키로부터 세션 로드 및 상태 동기화
if (typeof window !== 'undefined') {
  pb.authStore.loadFromCookie(document.cookie);
  
  pb.authStore.onChange(() => {
    document.cookie = pb.authStore.exportToCookie({ 
      secure: false, // 로컬 개발(HTTP) 환경을 위해 false
      sameSite: 'Lax',
      httpOnly: false // 클라이언트-사이드 JS에서 접근 가능하도록 false
    });
  });
}