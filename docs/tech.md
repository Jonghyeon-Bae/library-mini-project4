# 기술 문서 (Technical Document)

---

## 목차

1. [시스템 개요](#1-시스템-개요)
2. [기술 스택](#2-기술-스택)
3. [아키텍처](#3-아키텍처)
4. [프로젝트 디렉토리 구조](#4-프로젝트-디렉토리-구조)
5. [주요 모듈 설명](#5-주요-모듈-설명)
6. [데이터 흐름](#6-데이터-흐름)
7. [외부 API 연동](#7-외부-api-연동)
8. [상태 관리 전략](#8-상태-관리-전략)
9. [환경 설정](#9-환경-설정)
10. [실행 방법](#10-실행-방법)

---

## 1. 시스템 개요

알라딘 도서 검색 API, PocketBase 데이터베이스, 그리고 생성형 AI 모델(OpenAI gpt-image-2 / GPT-4o-mini, Upstage AI Solar-pro3)을 연동한 지능형 개인 도서 대출 관리 웹 애플리케이션입니다.
사용자는 책을 검색 및 등록하고, 대출/반납 현황을 관리하며, AI 기반의 썸네일 표지 생성, 요약 리뷰 작성, 연관 키워드 추천을 받아 서재 관리 효율성을 비약적으로 향상할 수 있습니다.

| 항목             | 내용                       |
| ---------------- | -------------------------- |
| 클라이언트 URL   | `http://localhost:3000`    |
| PocketBase URL   | `http://localhost:8090`    |
| PocketBase Admin | `http://localhost:8090/_/` |

---

## 2. 기술 스택

### 프론트엔드

| 기술                 | 버전   | 역할                                  |
| -------------------- | ------ | ------------------------------------- |
| Next.js              | 16.2.6 | 앱 프레임워크 (App Router)            |
| React                | 19.2.4 | UI 렌더링                             |
| TypeScript           | ^5     | 정적 타입 시스템                      |
| Tailwind CSS         | ^4     | 유틸리티 기반 스타일링 (v4 규격 준수) |
| TanStack React Query | ^5     | 비동기 서버 상태 관리 및 캐싱         |
| Recharts             | ^3     | 대출 현황 파이 차트 시각화            |
| Lucide React         | ^1     | 벡터 아이콘 라이브러리                |
| Axios                | ^1     | HTTP 클라이언트                       |
| OpenAI (Client SDK)  | ^4     | Upstage Solar-pro3 리뷰 스트리밍 호출 (dangerouslyAllowBrowser) |

### 백엔드

| 기술            | 버전    | 역할                               |
| --------------- | ------- | ---------------------------------- |
| PocketBase      | ^0.26.9 | NoSQL 데이터베이스 + REST API 서버 |
| Aladin Open API |         | 외부 도서 정보 및 지표 상세 조회   |
| OpenAI API      |         | gpt-image-2 표지 생성 및 GPT-4o-mini 키워드 추천 |
| Upstage AI API  |         | Solar-pro3 도서 요약/리뷰 스트리밍 |

---

## 3. 아키텍처

```
┌─────────────────────────────────────────────────────────────┐
│                      브라우저 (Client)                       │
│                                                             │
│  ┌──────────┐    ┌─────────────────┐    ┌────────────────┐  │
│  │ page.tsx │    │ BookListView    │    │ BookDetailView │  │
│  │ (진입점) │    │ (차트, 정렬목록)│    │ (상세/리뷰/대출)│  │
│  └────┬─────┘    └────────┬────────┘    └────────┬───────┘  │
│       │                   │                      │          │
│  ┌────▼───────────────────▼──────────────────────▼──────┐  │
│  │               TanStack React Query                   │  │
│  │         (useQuery / useMutation / Cache)             │  │
│  └────────────────────────┬─────────────────────────────┘  │
└───────────────────────────┼─────────────────────────────────┘
                            │
        ┌───────────────────┼────────────────────┐
        │                   │                    │
        ▼                   ▼                    ▼
┌───────────────┐   ┌───────────────┐   ┌─────────────────┐
│  PocketBase   │   │  Next.js API  │   │  Upstage AI API │
│  (Port 8090)  │   │  (Proxy/AI)   │   │  (solar-pro3)   │
│  - books      │   │ - /api/aladin │   │  - Client SDK   │
│  - users      │   │ - /api/genthum│   │    Direct Call  │
│  - likes      │   │ - /api/recom  │   │    (Streaming)  │
│  - search_hist│   └───────┬───────┘   └─────────────────┘
└───────────────┘           │
                            ▼
                    ┌───────────────┐
                    │  Aladin / OAI │
                    │  (외부 APIs)  │
                    └───────────────┘
```

### 통신 방식

- **PocketBase ↔ 프론트엔드**: PocketBase JS SDK를 통한 클라이언트/서버 직접 REST 통신 및 인증 처리.
- **알라딘 API ↔ 프론트엔드**: CORS 우회 및 API 키 보호를 위해 `/api/aladin` 경로로 프록시 요청.
- **OpenAI API ↔ 프론트엔드**: 썸네일 생성 및 키워드 추천을 위한 `/api/genthum`, `/api/recommend` API 라우트 호출.
- **Upstage AI ↔ 프론트엔드**: 브라우저 단에서 직접 OpenAI SDK를 인스턴스화하여 Upstage 엔드포인트에 인증키 전송 및 Server-Sent Events 기반 스트리밍 리뷰 응답을 받아 처리.

---

## 4. 프로젝트 디렉토리 구조

```
library-mini-project4/
├── app/
│   ├── page.tsx                     # 메인 페이지 진입점 및 레이아웃 상태 스위칭
│   ├── layout.tsx                   # 루트 레이아웃 (Geist 폰트, Provider 래핑)
│   ├── globals.css                  # 전역 CSS (Tailwind v4 기반 애니메이션 포함)
│   ├── Providers/
│   │   └── page.tsx                 # QueryClientProvider 래핑 컴포넌트
│   ├── api/
│   │   ├── aladin/
│   │   │   └── route.ts             # 알라딘 검색(GET) 및 평가 지표 상세 조회(POST) 프록시
│   │   ├── genthum/
│   │   │   └── route.ts             # gpt-image-2 표지 생성 및 public/covers/ 로컬 파일 저장
│   │   ├── recommend/
│   │   │   └── route.ts             # GPT-4o-mini 기반 최근 검색어 맥락 맞춤 키워드 추천 API
│   │   └── summary/
│   │       └── route.ts             # GPT 요약 API (Direct Upstage 호출로 대체됨)
│   ├── components/
│   │   ├── AddBookModal.tsx         # 알라딘 검색 등록, 최근 검색어 5개, AI 연관 추천 키워드 제공
│   │   ├── ManualAddBookModal.tsx   # 수동 도서 등록 모달 (인라인 gpt-image-2 표지 생성기 통합)
│   │   ├── BookListView.tsx         # 대출 비율 차트, 정렬 옵션, 도서 카드 그리드 목록
│   │   ├── BookDetailView.tsx       # 상세 정보 뷰 (대출 토글, 삭제, Upstage AI Solar 리뷰 스트리밍)
│   │   ├── DashboardChart.tsx       # Recharts 기반 대출 현황 파이 차트
│   │   ├── Likebutton.tsx           # likes 컬렉션 연동 좋아요 토글 컴포넌트
│   │   └── RankingSidebar.tsx       # 실시간 좋아요 상위 TOP 10 랭킹 사이드바 (반응형 뷰 대응)
│   ├── genthum/
│   │   └── AiThumbnailGenerator.tsx # 상세 뷰 연동 표지 재생성 모달
│   ├── lib/
│   │   ├── pocketbase.ts            # PocketBase 클라이언트 싱글톤 인스턴스
│   │   ├── aladinApi.ts             # 알라딘 프록시 통신용 클라이언트 모듈
│   │   └── stylePresets.ts          # AI 표지 생성기용 스타일 테마 설정 프리셋
│   ├── login/
│   │   └── LoginModal.tsx           # 로그인 오버레이 모달
│   ├── register/
│   │   └── RegisterModal.tsx        # 회원가입 오버레이 모달
│   └── me/
│       └── page.tsx                 # 마이페이지 (프로필 및 본인 등록 도서 페이징 조회)
```

---

## 5. 주요 모듈 설명

### 5-1. `app/page.tsx` — 메인 페이지 진입점

- **역할**: 로그인 상태를 추적 및 동기화하고, 최상위 상태 관리를 통해 `selectedBook`의 유무에 따라 도서 목록 뷰(`BookListView`)와 상세 정보 뷰(`BookDetailView`)를 실시간 스위칭 렌더링합니다.
- **인증 동기화**: `pb.authStore.onChange` 구독을 통해 쿠키에 저장된 세션 변화를 감지하고 상태를 동기화합니다.

### 5-2. `app/components/BookDetailView.tsx` — 도서 상세 정보 뷰

- **Upstage Solar 요약 스트리밍**: `NEXT_PUBLIC_LLM_API_KEY` 환경변수를 읽고, Upstage API로 직접 Solar-pro3 모델에 책 제목, 저자, 설명 정보를 전송하여 생성되는 큐레이팅 요약을 실시간으로 스트리밍 받아 출력합니다. 요약 완료 시 `pb.collection('books').update`를 호출하여 요약문을 DB `ai_review` 필드에 동기화합니다.
- **최신 상태 강제 동기화**: 상세 정보 진입 시, 컴포넌트 마운트 생명주기 내에서 PocketBase API(`getOne`)를 직접 호출하여 최신의 DB 레코드로 화면 상태를 보장합니다.
- **대출 및 반납 권한 검증**: 도서의 `isAvailable` 및 `borrower_id`를 조회하여 본인이 대출하지 않은 책의 반납 버튼 노출을 막아 트랜잭션 오류를 사전에 차단합니다.

### 5-3. `app/components/AddBookModal.tsx` — 도서 검색 및 등록

- **알라딘 API 검색**: 키워드 기반 도서 검색(GET)을 수행해 결과 리스트를 바인딩합니다.
- **중복 도서 등록 검사**: 등록 전 `checkDuplicateIsbn13` 함수를 실행하여 `books` 컬렉션의 `isbn13` 고유키 값을 조회해 기등록 여부를 확인합니다.
- **상세 지표 수집 및 자동 평가**: '등록' 시 알라딘 상세 조회 API(POST)를 통해 평점, 판매지수, 카테고리를 비동기 호출합니다. 평점 8.5점 이상이거나 판매지수 15,000점 이상인 경우 베스트도서(`bestbook: true`)로 지정하여 가치 판별을 자동화합니다.
- **최근 검색어 및 AI 연관어 추천**: `search_history` 컬렉션에서 로그인 유저의 검색 데이터 5개를 조회하여 원클릭 재검색 태그를 노출하며, `/api/recommend`를 호출해 GPT-4o-mini 모델이 맞춤 추천한 3개의 관련 키워드를 실시간 제공합니다.

### 5-4. `app/components/ManualAddBookModal.tsx` — 수동 등록 모달

- **정보 수동 입력**: 알라딘 데이터가 없는 독립 서적 등을 입력할 수 있는 폼을 구성합니다.
- **인라인 AI 표지 메이커**: gpt-image-2 연동 표지 생성 패널을 모달 내부에 인라인으로 제공합니다. 제목 입력 시 `stylePresets`에 정의된 테마별 영문 프롬프트를 조합해 즉시 gpt-image-2 표지 이미지 생성 API(`/api/genthum`)를 호출하고 폼 썸네일에 적용합니다.

### 5-5. `app/components/RankingSidebar.tsx` — 인기 도서 랭킹

- **실시간 순위**: 컴포넌트 내에서 PocketBase 실시간 쿼리를 통해 좋아요 수(`like_count`) 기준 상위 10개 레코드를 상시 트래킹합니다. 1~3위에 금/은/동 트로피 뱃지를 부여하고, 랭킹 클릭 시 최상위 컨텍스트의 `selectedBook`을 설정해 상세 정보 뷰로 즉시 이동합니다.

---

## 6. 데이터 흐름

### AI 리뷰 생성 및 요약 스트리밍 흐름

```
[사용자] "AI 리뷰 생성" 클릭 (BookDetailView)
    ↓
OpenAI Client 인스턴스 생성 (baseURL: "https://api.upstage.ai/v1", model: "solar-pro3")
    ↓
[chat.completions.create] 호출 (stream: true)
    ↓
Loop chunk:
    streamedReview 상태 누적 업데이트 → 화면에 실시간 글자 출력
    ↓
생성 완료 후:
    1. PocketBase books 컬렉션의 ai_review 필드 PATCH 요청
    2. 로컬 상태 localAiReview 갱신
    3. 메인 상위 컨텍스트 onUpdateBook 콜백 실행
```

### AI 연관 검색어 추천 흐름

```
[사용자] 검색 모달 진입 및 "추천어 받기" 클릭
    ↓
PocketBase search_history에서 최근 키워드 5개 추출
    ↓
POST /api/recommend { keywords } 요청 전송
    ↓
Server-side: OpenAI GPT-4o-mini 모델 호출 (response_format: "json_object")
    ↓
중복이 배제된 연관 키워드 3개 반환 { recommendations: [...] }
    ↓
Client: aiRecommendations 상태 저장 및 추천어 태그 리스트 렌더링
```

---

## 7. 외부 API 연동

### 7-1. Aladin Open API (Next.js Proxy `/api/aladin`)

- **GET (검색)**: `https://www.aladin.co.kr/ttb/api/ItemSearch.aspx` 호출.
- **POST (상세)**: `https://www.aladin.co.kr/ttb/api/ItemLookUp.aspx` 호출.
  - 응답 데이터에서 `customerReviewRank` 및 `salesPoint`를 기반으로 시스템 베스트 도서 여부(`bestbook`)를 연산 판별합니다.

### 7-2. OpenAI API

- **gpt-image-2 이미지 생성 (`/api/genthum`)**: OpenAI gpt-image-2 모델을 활용하여 1024x1536 해상도 규격으로 표지를 생성하고, `fs.writeFileSync`를 통해 서버 내 `public/covers/`에 로컬 저장한 뒤 클라이언트에 상대 주소(`/covers/filename.png`)를 반환합니다.
- **GPT-4o-mini 추천 (`/api/recommend`)**: 사용자의 최근 검색어 리스트의 컨텍스트를 분석하여 3개의 신규 검색 키워드를 반환합니다.

### 7-3. Upstage AI API (Direct Client SDK Connection)

- **Solar-pro3 모델 호출**: `https://api.upstage.ai/v1` 경로로 직접 연결하며, 스트리밍 응답 처리를 위해 Next.js 환경변수 `NEXT_PUBLIC_LLM_API_KEY`를 사용합니다.

---

## 8. 상태 관리 전략

이 프로젝트는 **TanStack React Query v5**와 React 로컬 State를 결합하여 데이터 일관성을 유지합니다.

### 8-1. React Query Key 설계 규칙

| Query Key                     | 역할                                | 위치                         |
| ----------------------------- | ----------------------------------- | ---------------------------- |
| `['books', sortOption, page]` | 정렬 조건 및 페이지 단위 도서 목록  | `BookListView.tsx`           |
| `['books-dashboard']`         | 대시보드 통계를 위한 전체 도서 목록 | `page.tsx`                   |
| `['searchHistory', userId]`   | 특정 유저의 최근 검색 키워드 기록   | `AddBookModal.tsx`           |
| `['allLikeCounts']`           | 전체 도서의 실시간 좋아요 개수      | `Likebutton.tsx`, `page.tsx` |
| `['rankingBooks']`            | 랭킹 집계를 위한 전체 도서 정보     | `RankingSidebar.tsx`         |

### 8-2. 캐시 무효화 (Invalidation) 정책

도서의 생성/대출/반납/삭제 작업 및 좋아요 토글 동작 성공 시, `queryClient.invalidateQueries`를 호출해 관계 쿼리(`['books']`, `['books-dashboard']`)를 실시간 무효화하여 모든 화면 컴포넌트가 최신 상태를 자동 반영하도록 보장합니다.

---

## 9. 환경 설정

### 9-1. 환경 변수 요구 사양

보안과 API 연동을 위해 루트 디렉토리에 `.env` 파일 구성이 필수적입니다.

```env
# 알라딘 TTBKey 설정 (서버사이드 사용)
ALADIN_TTB_KEY=your_aladin_ttb_key

# OpenAI API Key (서버사이드 gpt-image-2 표지 생성 및 GPT-4o-mini 키워드 추천 호출용)
OPENAI_API_KEY=your_openai_api_key

# Upstage AI API Key (브라우저 직접 연결 호출용)
NEXT_PUBLIC_LLM_API_KEY=your_upstage_api_key
```

---

## 10. 실행 방법

### 사전 요구사항

- Node.js 18 이상 및 PocketBase 실행 바이너리 필요.

### 개발 환경 실행

```bash
# 터미널 1 - PocketBase 서버 실행 (Port 8090)
cd pocketbase_mini4
./pocketbase serve

# 터미널 2 - 웹 애플리케이션 빌드 및 개발 서빙
cd library-mini-project4
npm install
npm run dev
```
