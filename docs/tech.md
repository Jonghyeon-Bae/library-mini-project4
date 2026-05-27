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

Kakao 도서 검색 API와 PocketBase를 연동한 개인 도서 관리 웹 애플리케이션입니다.
사용자는 키워드로 책을 검색해 라이브러리에 등록하고, 대출 상태를 관리하며, 현황을 차트로 확인할 수 있습니다.

| 항목             | 내용                       |
| ---------------- | -------------------------- |
| 클라이언트 URL   | `http://localhost:3000`    |
| PocketBase URL   | `http://localhost:8090`    |
| PocketBase Admin | `http://localhost:8090/_/` |

---

## 2. 기술 스택

### 프론트엔드

| 기술                 | 버전   | 역할                                      |
| -------------------- | ------ | ----------------------------------------- |
| Next.js              | 16.2.6 | 앱 프레임워크 (App Router)                |
| React                | 19.2.4 | UI 렌더링                                 |
| TypeScript           | ^5     | 정적 타입 시스템                          |
| Tailwind CSS         | ^4     | 유틸리티 기반 스타일링                    |
| TanStack React Query | ^5     | 비동기 서버 상태 관리                     |
| Recharts             | ^3     | 파이 차트 시각화                          |
| Lucide React         | ^1     | 아이콘 라이브러리                         |
| Axios                | ^1     | HTTP 클라이언트 (Aladin 검색 프록시 호출) |

### 백엔드

| 기술            | 버전    | 역할                               |
| --------------- | ------- | ---------------------------------- |
| PocketBase      | ^0.26.9 | NoSQL 데이터베이스 + REST API 서버 |
| Aladin Open API |         | 외부 도서 정보/지표 상세 조회      |

### 폰트

| 폰트       | 제공처                                      |
| ---------- | ------------------------------------------- |
| Geist Sans | Vercel 제작, `next/font/google`을 통해 로드 |
| Geist Mono | Vercel 제작, `next/font/google`을 통해 로드 |

---

## 3. 아키텍처

```
┌────────────────────────────────────────────┐
│              브라우저 (Client)              │
│                                            │
│  ┌──────────┐    ┌───────────────────────┐ │
│  │  page.tsx │    │  AddBookModal.tsx     │ │
│  │ (메인 목록)│    │  (Aladin 검색 + 등록) │ │
│  └────┬─────┘    └──────────┬────────────┘ │
│       │                     │              │
│  ┌────▼─────────────────────▼────────────┐ │
│  │       TanStack React Query            │ │
│  │   (useQuery / useMutation / Cache)    │ │
│  └────────────┬──────────────────────────┘ │
└───────────────┼────────────────────────────┘
                │
    ┌───────────┼───────────────┐
    │           │               │
    ▼           ▼               ▼
┌────────┐ ┌────────┐    ┌─────────────┐
│Pocket  │ │Aladin  │    │  Recharts   │
│Base    │ │API     │    │ (Dashboard) │
│:8090   │ │(외부)  │    └─────────────┘
└────────┘ └────────┘
```

### 통신 방식

- **PocketBase ↔ 프론트엔드**: PocketBase JS SDK(`pocketbase` npm 패키지)를 통한 REST 통신
- **Aladin API ↔ 프론트엔드**: 프론트엔드에서 `/api/aladin` 경로로 프록시 요청 (CORS 및 인증키 보안 해결)

---

## 4. 프로젝트 디렉토리 구조

```
library-mini-project4/
├── app/
│   ├── page.tsx                 # 메인 페이지: 도서 목록, 정렬, 대출 토글, 삭제
│   ├── page.tsx.origin          # 원본 메인 페이지 백업
│   ├── layout.tsx               # 루트 레이아웃 (폰트, Provider 래핑, 메타데이터)
│   ├── globals.css              # 전역 CSS (Tailwind 기반 커스텀 애니메이션 포함)
│   ├── favicon.ico              # 파비콘
│   ├── components/
│   │   ├── AddBookModal.tsx     # Aladin 검색 모달 + 상세 지표 조회 + PocketBase 등록 처리
│   │   └── DashboardChart.tsx   # Recharts 기반 파이 차트 (대출 현황)
│   ├── lib/
│   │   ├── pocketbase.ts        # PocketBase 클라이언트 인스턴스 싱글턴
│   │   └── aladinApi.ts         # Aladin API 프록시 호출 함수 (검색, 상세 조회)
│   └── Providers/
│       └── page.tsx             # QueryClientProvider 래핑 컴포넌트
├── docs/                        # 프로젝트 문서
├── next.config.ts               # Next.js 설정
├── postcss.config.mjs           # PostCSS 설정 (@tailwindcss/postcss 플러그인)
├── eslint.config.mjs            # ESLint 설정
├── tsconfig.json                # TypeScript 컴파일 옵션
└── package.json                 # 의존성 및 스크립트
```

---

## 5. 주요 모듈 설명

### 5-1. `app/page.tsx` — 메인 페이지

**역할**: 애플리케이션의 진입점이자 핵심 페이지. 도서 목록 조회, 정렬, 대출 상태 변경, 삭제 기능을 담당합니다.

**핵심 타입**

```typescript
export interface bookProps {
  id: string;
  title?: string;
  contents?: string; // Aladin API description 필드명과 매핑
  author?: string;
  publisher?: string;
  thumbnail?: string;
  isAvailable?: boolean;
  bestbook?: boolean;
}
```

**React Query 훅 구성**

| 훅                     | 역할                                      | Query Key   |
| ---------------------- | ----------------------------------------- | ----------- |
| `useQuery`             | 전체 도서 목록 조회 (`getFullList`)       | `['books']` |
| `useMutation` (delete) | 도서 삭제                                 | —           |
| `useMutation` (toggle) | `isAvailable` 필드 PATCH (대출 상태 토글) | —           |

**정렬 옵션**

| 옵션값     | 설명            |
| ---------- | --------------- |
| `-created` | 최신순 (기본값) |
| `created`  | 오래된 순       |
| `title`    | 제목순          |

---

### 5-2. `app/components/AddBookModal.tsx` — 도서 등록 모달

**역할**: Aladin 상품 검색 API로 도서를 검색하고, 상세 평점/판매지수를 확인한 뒤 PocketBase `books` 컬렉션에 등록합니다.

**동작 흐름**

```
사용자 키워드 입력
    ↓
handleSearch() 호출
    ↓
searchBookFromAladin(keyword) → Next.js /api/aladin 프록시 요청
    ↓
검색 결과 목록 렌더링
    ↓
사용자 "등록" 버튼 클릭
    ↓
addMutation.mutate(bookData) → pb.collection('books').create()
    ↓
성공 시 books 쿼리 무효화(invalidate) → 목록 자동 갱신
```

**props 인터페이스**

```typescript
interface AddBookModalProps {
  isOpen: boolean;
  onClose: () => void;
}
```

**등록 시 기본값**

| 필드          | 기본값  |
| ------------- | ------- |
| `isAvailable` | `true`  |
| `bestbook`    | `false` |

---

### 5-3. `app/components/DashboardChart.tsx` — 대시보드 차트

**역할**: books 목록을 받아 대출 가능/대출 중 비율을 Recharts `PieChart`로 시각화합니다.

**데이터 가공 로직**

```typescript
const availableCount = books.filter((b) => b.isAvailable).length;
const borrowedCount = books.length - availableCount;
```

**Recharts 구성 요소**

| 컴포넌트   | 설명                                                 |
| ---------- | ---------------------------------------------------- |
| `PieChart` | 차트 컨테이너 (300×200px)                            |
| `Pie`      | 도넛 형태 (innerRadius=60, outerRadius=80)           |
| `Cell`     | 색상 지정 (대출 가능: `#22c55e`, 대출 중: `#ef4444`) |
| `Tooltip`  | 마우스 오버 툴팁                                     |
| `Legend`   | 범례                                                 |

> 도서 데이터가 없을 경우 컴포넌트는 `null`을 반환하여 렌더링을 생략합니다.

---

### 5-4. `app/lib/pocketbase.ts` — PocketBase 클라이언트

```typescript
import PocketBase from "pocketbase";
export const pb = new PocketBase("http://127.0.0.1:8090");
```

- PocketBase 인스턴스를 **싱글턴**으로 export하여 전역에서 재사용합니다.
- 기본 포트: `8090`

---

### 5-5. `app/lib/aladinApi.ts` — Aladin API 프록시 호출

```typescript
import axios from "axios";

// 알라딘 키워드 검색 함수
export const searchBookFromAladin = async (query: string) => {
  const { data } = await axios.get("/api/aladin", { params: { q: query } });
  return data.item || [];
};

// 알라딘 ISBN 기반 평점/판매지수 상세 조회 함수
export const lookupBookMetricsFromAladin = async (isbn13: string) => {
  const { data } = await axios.post("/api/aladin", { isbn13 });
  return data; // { isRecommended, customerReviewRank, salesPoint, categoryName } 반환
};
```

- Aladin Open API를 직접 호출하지 않고 `/api/aladin` Next.js 라우트 핸들러를 경유(프록시)합니다.

---

### 5-6. `app/Providers/page.tsx` — React Query Provider

`QueryClientProvider`를 래핑하여 앱 전역에서 React Query를 사용할 수 있도록 설정합니다.
`app/layout.tsx`에서 `<Providers>`로 `<body>`를 감싸는 구조입니다.

---

## 6. 데이터 흐름

### 도서 목록 조회 흐름

```
컴포넌트 마운트
    → useQuery(['books']) 실행
    → pb.collection('books').getFullList({ sort: sortOption })
    → PocketBase REST GET /api/collections/books/records
    → 응답 데이터 → React Query 캐시 저장
    → books 상태 업데이트 → UI 렌더링
```

### 대출 상태 변경 흐름

```
"대출 가능 / 대출 중" 버튼 클릭
    → toggleMutation.mutate({ id, isAvailable })
    → pb.collection('books').update(id, { isAvailable: !isAvailable })
    → PocketBase REST PATCH /api/collections/books/records/:id
    → onSuccess: queryClient.invalidateQueries(['books'])
    → 목록 자동 갱신
```

### 도서 삭제 흐름

```
"×" 버튼 클릭 → window.confirm 확인
    → deleteMutation.mutate(id)
    → pb.collection('books').delete(id)
    → PocketBase REST DELETE /api/collections/books/records/:id
    → onSuccess: queryClient.invalidateQueries(['books'])
    → 목록 자동 갱신
```

---

## 7. 외부 API 연동

### 7-1. Aladin Open API (via Next.js Proxy)

| 항목          | 내용                                                                                          |
| ------------- | --------------------------------------------------------------------------------------------- |
| 엔드포인트    | `/api/aladin` (내부 프록시)                                                                   |
| 메서드        | 검색: `GET`, 상세 조회: `POST`                                                                |
| 인증 방식     | 서버 측에서 TTBKey로 인증 처리                                                                |
| 주요 파라미터 | `q` (검색어), `isbn13` (상세 조회용)                                                          |
| 응답 필드     | `title`, `author`, `publisher`, `cover`, `description`, `customerReviewRank`, `salesPoint` 등 |

**응답 데이터 → PocketBase 필드 매핑**

| Aladin 응답 필드  | PocketBase 필드 | 처리 방식              |
| ----------------- | --------------- | ---------------------- |
| `title`           | `title`         | 그대로 저장            |
| `author` (문자열) | `authors`       | 그대로 저장            |
| `publisher`       | `publisher`     | 그대로 저장            |
| `cover`           | `thumbnail`     | URL 문자열 그대로 저장 |
| `description`     | `contents`      | 그대로 저장            |

---

### 7-2. PocketBase REST API

| 작업      | HTTP 메서드 | 엔드포인트                           |
| --------- | ----------- | ------------------------------------ |
| 전체 조회 | `GET`       | `/api/collections/books/records`     |
| 단건 생성 | `POST`      | `/api/collections/books/records`     |
| 단건 수정 | `PATCH`     | `/api/collections/books/records/:id` |
| 단건 삭제 | `DELETE`    | `/api/collections/books/records/:id` |

---

## 8. 상태 관리 전략

이 프로젝트는 **TanStack React Query v5**를 서버 상태 관리의 핵심으로 사용합니다.

| 관심사                              | 전략                                |
| ----------------------------------- | ----------------------------------- |
| 서버 데이터 (도서 목록)             | `useQuery` + 자동 캐싱              |
| 쓰기 작업 (등록/수정/삭제)          | `useMutation` + `invalidateQueries` |
| UI 상태 (모달 열림 여부, 정렬 옵션) | `useState` (로컬 상태)              |
| 검색 결과 및 알라딘 API 지표        | `useState` (로컬 상태, 캐싱 불필요) |

**캐시 무효화 전략**: 모든 쓰기 작업(`create`, `update`, `delete`)의 `onSuccess`에서 `queryClient.invalidateQueries({ queryKey: ['books'] })`를 호출하여 항상 최신 데이터를 보장합니다.

---

## 9. 환경 설정

### 9-1. Next.js 설정 (`next.config.ts`)

별도의 커스텀 설정 없이 기본 Next.js 설정을 사용합니다.

### 9-2. TypeScript 설정 (`tsconfig.json`)

Next.js 기본 TypeScript 설정을 따릅니다.

### 9-3. Tailwind CSS 설정

Tailwind CSS v4를 사용하며, `postcss.config.mjs`에서 `@tailwindcss/postcss` 플러그인을 통해 처리됩니다.

### 9-4. 환경 변수

현재 Aladin API TTBKey 등 민감한 인증 정보는 환경 변수로 분리하는 것을 권장합니다.
Next.js 서버사이드 환경 변수로 관리하여 클라이언트에 키가 노출되지 않도록 설정합니다.

```env
# .env.local
ALADIN_TTB_KEY=your_ttb_key
```

---

## 10. 실행 방법

### 사전 요구사항

- Node.js 18 이상
- PocketBase 실행 파일 (`pocketbase_mini4/` 디렉토리 내)

### 개발 환경 실행

**터미널 1 — PocketBase 서버 시작**

```bash
cd pocketbase_mini4
./pocketbase serve
```

**터미널 2 — Next.js 개발 서버 시작**

```bash
npm install
npm run dev
```

### 접속 URL

| 서비스           | URL                        |
| ---------------- | -------------------------- |
| 웹 앱            | http://localhost:3000      |
| PocketBase API   | http://localhost:8090/api/ |
| PocketBase Admin | http://localhost:8090/\_/  |

### 빌드 및 프로덕션 실행

```bash
npm run build
npm start
```
