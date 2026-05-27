📚 Library Mini Project 4: 오승헌의 직박구리 (Personal Library Manager)
Aivle 9th, Mini Project 4
 개인 서재를 디지털화하여 체계적으로 관리할 수 있는 모던 웹 애플리케이션입니다
. Kakao 책 검색 API를 통해 손쉽게 도서 메타데이터를 불러오고, 내 서재의 도서 보유 현황과 대출 상태를 한눈에 파악할 수 있는 대시보드를 제공합니다
. 총 8명의 기여자가 협업하여 완성한 프로젝트입니다
.

--------------------------------------------------------------------------------
✨ 1. 주요 기능 및 상세 설명 (Features)
이 프로젝트는 사용자의 편의성과 직관적인 UX를 최우선으로 고려하여 개발되었습니다
.
🔍 스마트 도서 검색 및 등록 (Kakao API & AI)
Kakao API 연동: 책 제목이나 저자만 입력해도 Kakao Book Search API를 통해 정확한 도서 정보(표지, 출판사, 저자 등)를 즉시 불러와 데이터베이스에 저장합니다
.
AI 검색어 추천 (New 🚀): 사용자의 검색 경험을 극대화하기 위해 AI 기반의 검색어 추천 기능이 새롭게 도입되었습니다
.
스마트 초기화 UX (New 🚀): 도서 등록 후 사용자가 다음 책을 바로 검색할 수 있도록 입력창과 검색 결과가 자동으로 초기화되는 편의 기능을 추가했습니다
.
📖 직관적인 도서 관리 (CRUD & 상태 관리)
도서의 생성, 조회, 수정, 삭제(CRUD)가 완벽하게 지원됩니다
.
실수로 도서를 삭제하는 것을 방지하기 위해 **삭제 확인 대화창(Confirm Dialog)**을 적용했습니다
.
추천 도서는 별(★) 아이콘으로 직관적으로 하이라이팅 됩니다
.
🔄 대출 상태 관리 토글
도서의 isAvailable 속성을 토글하여 대출 상태를 실시간으로 변경(Update)할 수 있습니다
.
최근 업데이트를 통해 대출 버튼의 동작 로직과 안정성이 완벽하게 정상화되었습니다
.
📊 실시간 통계 대시보드
Recharts 라이브러리를 활용하여 현재 등록된 도서 중 '대출 가능' / '대출 중' 현황을 파이(Pie) 차트로 시각화하여 제공합니다
.

--------------------------------------------------------------------------------
💡 2. 프로젝트의 강점 및 최적화 포인트 (Best Practices)
본 프로젝트는 단순한 기능 구현을 넘어 프론트엔드 성능과 사용자 경험(UX) 최적화에 집중했습니다
.
🚀 성능 및 네트워크 최적화
React Query 캐싱: useQuery를 활용한 쿼리 캐싱 로직을 도입하여 불필요한 API 요청을 최소화하고 서버 부하를 줄였습니다
.
코드 스플리팅: Next.js의 장점을 살린 컴포넌트 레벨의 코드 스플리팅으로 초기 렌더링 속도를 최적화했습니다
.
이미지 최적화: Placeholder 기법을 사용하여 썸네일 이미지 로딩 시 레이아웃 시프트(CLS)를 방지했습니다
.
🎨 모던하고 접근성 높은 UI/UX
유려한 디자인: Tailwind CSS를 활용한 CSS-in-JS 최적화, 그라디언트(Gradient) 헤더, 부드러운 스케일 트랜지션 및 호버(Hover) 애니메이션을 적용했습니다
.
반응형 웹: 모바일, 태블릿, 데스크톱 등 모든 디바이스 환경에서 깨짐 없는 UI를 제공합니다
.
웹 접근성 준수: 시맨틱 HTML 태그를 사용하고, API 통신 시 명확한 시각적 피드백(로딩 상태 등)을 제공하여 접근성을 높였습니다
.
견고한 코드 베이스: 전체 프로젝트 코드의 98.9%를 TypeScript로 작성하여 런타임 에러를 방지하고 유지보수성을 극대화했습니다
.

--------------------------------------------------------------------------------
🛠 3. 기술 스택 (Tech Stack)
Frontend
Framework: Next.js 16 (App Router)
Language & UI: TypeScript (98.9%), React 19
Styling: Tailwind CSS 4
State Management: TanStack React Query 5
Libraries: Recharts (시각화), Lucide React (아이콘), Axios (HTTP 통신)
Backend & DB
Database / BaaS: PocketBase (가볍고 빠른 NoSQL)
External API: Kakao Book Search API

--------------------------------------------------------------------------------
🗄 4. 데이터베이스 스키마 및 구조
백엔드로 사용된 PocketBase의 books 컬렉션 구조입니다
.
Field Name
Type
Description
id
string
도서 데이터의 고유 식별자
title
string
책 제목
author
string
저자
publisher
string
출판사
thumbnail
string
Kakao API 연동 책 표지 이미지 URL
isAvailable
boolean
대출 가능 여부 (true: 가능 / false: 대출 중)
bestbook
boolean
추천 도서 여부 (별점 표시용)
created
datetime
레코드 생성 일시
updated
datetime
레코드 마지막 수정 일시
Base URL: http://localhost:8090/api/collections/books

--------------------------------------------------------------------------------
🚀 5. 시작하기 (Getting Started)
프로젝트를 로컬 환경에서 실행하기 위한 단계별 가이드입니다.
5-1. 필수 요구사항
Node.js: v18 이상
PocketBase: 로컬 서버 실행용 실행 파일
Kakao API Key: 도서 검색 API 연동을 위한 환경 변수 세팅 필요
5-2. 설치 및 실행 방법
의존성 패키지 설치
PocketBase (백엔드) 서버 실행 별도의 터미널 창을 열고 아래 명령어를 실행하여 데이터베이스 서버를 구동합니다.
관리자 페이지 URL: http://localhost:8090/_/
Next.js (프론트엔드) 개발 서버 실행 다시 프론트엔드 루트 폴더 터미널로 돌아와 서버를 켭니다.
애플리케이션 접속 URL: http://localhost:3000
빌드 및 프로덕션 배포

--------------------------------------------------------------------------------
📁 6. 프로젝트 디렉토리 구조
library-mini-project4/
├── app/                       # 프론트엔드 (Next.js App Router)
│   ├── page.tsx               # 메인 페이지 (도서 목록 렌더링) [5]
│   ├── layout.tsx             # 전역 레이아웃 설정 [5]
│   ├── globals.css            # 전역 CSS 및 Tailwind 지시어 [5]
│   ├── components/            # UI 컴포넌트 폴더
│   │   ├── AddBookModal.tsx   # 도서 추가용 모달 창 [5]
│   │   └── DashboardChart.tsx # 도서 상태 통계 차트 (Recharts) [5]
│   ├── lib/                   # API 통신 및 설정 폴더
│   │   ├── pocketbase.ts      # PocketBase 인스턴스 초기화 [5]
│   │   └── kakaoApi.ts        # Kakao 책 검색 API 호출 로직 [5]
│   └── Providers/             
│       └── page.tsx           # React Query Provider 세팅 [5]
├── pocketbase_mini4/          # 백엔드 데이터베이스 (PocketBase)
│   ├── pb_data/               # 실제 DB 저장소 [6]
│   ├── pb_migrations/         # DB 스키마 마이그레이션 파일 [6]
│   └── types.d.ts             # 백엔드 타입 정의 파일 [6]
├── docs/                      # 프로젝트 문서 폴더 [4]
├── next.config.ts             # Next.js 설정 [5]
├── tailwind.config.js         # Tailwind CSS 설정 [5]
└── package.json               # 프로젝트 패키지 관리 [5]

--------------------------------------------------------------------------------
💡 7. 향후 고도화 계획 (Future Roadmap)
현재 버전에 만족하지 않고, 다음과 같은 추가 기능을 기획하고 있습니다.
인증 및 계정 연동: PocketBase의 Auth 기능을 활용해 개인별 서재를 분리하고, 다중 사용자 대출/반납 이력 시스템 구축.
탐색 기능 강화: 내 서재 안에서 책을 검색하고, 태그 및 카테고리별로 분류할 수 있는 필터링 시스템.
리뷰 및 평점 기능: 별점(1~5점) 기반의 평가 시스템 및 개인 독서 메모(리뷰) 기능 추가.
UI 고도화: 전체 도서 로딩 시 성능 향상을 위한 무한 스크롤(Infinite Scroll) 도입.

--------------------------------------------------------------------------------
License: MIT License