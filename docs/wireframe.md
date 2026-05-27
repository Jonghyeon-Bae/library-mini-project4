# 화면 정의서 (Wireframe)

본 문서는 도서 대출 관리 애플리케이션의 화면 구조와 데이터 흐름을 정의합니다. 본 사양은 실제 React/Next.js 코드를 기반으로 작성되었습니다.

---

## 1. 메인 페이지 (Screen 1: Main Page)

애플리케이션의 뼈대가 되는 기본 뷰로, 좌측에는 사이드바, 우측/중앙에는 동적으로 변경되는 뷰 컴포넌트를 렌더링합니다.

### 1.1 주요 UI 구성 요소

- **헤더 영역**: 
  - 좌측: 메인 로고 및 타이틀 ("📚 5조의 도서관")
  - 우측: 로그인 상태에 따른 동적 버튼 (비로그인: `[회원가입]` `[로그인]` | 로그인: `[사용자 이름]` `[마이페이지]` `[로그아웃]`) 및 **`[Search!]`**, **`[CreatorMode!]`** 버튼 제공.
- **좌측 플로팅 영역**: `RankingSidebar` 컴포넌트가 위치하며 실시간 '인기 도서 TOP 10'을 상시 노출 (좋아요 순).
- **중앙 메인 영역**: `selectedBook` 상태에 따라 아래 두 가지 뷰 중 하나를 교체 렌더링.
  - **도서 목록 뷰 (BookListView)**: 전체 도서 8개 단위 페이징 그리드, 정렬 드롭다운, 상단 대시보드 대출 현황 차트 포함.
  - **도서 상세 뷰 (BookDetailView)**: 선택된 단일 도서의 썸네일, 저자, 본문 등 상세 정보와 각종 상호작용 액션 버튼 포함.

### 1.2 화면 흐름도 (Flowchart)

```mermaid
flowchart TD
    START([페이지 접속]) --> HEADER[로그인 상태 확인 및 헤더 렌더링]
    HEADER --> RENDER_SIDEBAR[RankingSidebar 렌더링]
    HEADER --> CHECK_SELECTED{selectedBook<br/>상태 확인}

    %% 뷰 스위칭
    CHECK_SELECTED -->|null| RENDER_LIST[BookListView 렌더링<br/>페이징 목록 및 대시보드]
    CHECK_SELECTED -->|도서 객체| RENDER_DETAIL[BookDetailView 렌더링<br/>선택 도서 상세 정보]

    %% 리스트 뷰 인터랙션
    RENDER_LIST -->|도서 카드 클릭| SET_SELECTED[선택 도서 상태 업데이트]
    SET_SELECTED --> RENDER_DETAIL

    %% 상세 뷰 인터랙션
    RENDER_DETAIL -->|대출 토글| TOGGLE[isAvailable PATCH API]
    RENDER_DETAIL -->|삭제 버튼| DELETE[도서 DELETE API]
    RENDER_DETAIL -->|좋아요 버튼| LIKE[likes 컬렉션 추가/삭제]
    RENDER_DETAIL -->|목록으로 이동| CLEAR_SELECTED[selectedBook = null]
    CLEAR_SELECTED --> RENDER_LIST
```

---

## 2. 도서 검색 및 등록 모달 (Screen 2: Book Registration Modals)

도서 등록을 위한 두 가지 독립적인 모달 뷰입니다.

### 2.1 검색 및 AI 연관 추천 모달 (Search Modal)

알라딘 API를 활용한 도서 검색 및 최근 검색 이력을 기반으로 한 GPT-4o-mini 연관 키워드 추천 인터페이스를 포함합니다.

#### 화면 흐름도 (Search & AI Recommendation Flow)

```mermaid
flowchart TD
    START([헤더의 'Search!' 버튼 클릭]) --> RENDER[검색 모달 창 노출]
    
    %% 최근 검색어 및 추천어
    RENDER -->|최근 검색 기록 존재 시| SHOW_HISTORY[최근 검색어 5개 태그 노출]
    RENDER -->|'추천어 받기' 버튼 클릭| API_RECOMMEND[OpenAI GPT-4o-mini 키워드 추천 API 호출]
    API_RECOMMEND --> SHOW_RECOMMEND[AI 맞춤 연관 검색어 3개 태그 노출]
    
    %% 검색 및 등록
    SHOW_HISTORY & SHOW_RECOMMEND -->|태그 클릭 또는 입력 창 검색| API_SEARCH[알라딘 도서 검색 API 호출]
    API_SEARCH --> SET_RESULTS[검색 결과 리스트 렌더링]
    
    SET_RESULTS -->|'등록' 버튼 클릭| CHECK_DUP{DB 중복 확인<br/>checkDuplicateIsbn13}
    CHECK_DUP -->|중복 발생| ALERT[alert: 이미 등록된 책입니다]
    CHECK_DUP -->|중복 없음| METRICS[알라딘 상세 지표 API 호출<br/>customerReviewRank, salesPoint]
    METRICS --> PROCESS_RECOMMEND[베스트 도서 bestbook 자동 평가 및 AI 초기리뷰 지정]
    PROCESS_RECOMMEND --> ADD_DB[PocketBase 도서 생성 API 호출]
    ADD_DB -->|성공| INVALIDATE[Query Client Invalidate 및 목록 동기화]
    INVALIDATE --> CLOSE([모달 닫기])
```

### 2.2 수동 등록 및 인라인 AI 표지 메이커 (Creator Modal)

도서의 제목, 저자 등 메타데이터를 직접 기재하는 모달이며, 내장된 인라인 표지 메이커를 제공합니다.

#### 화면 흐름도 (Manual Creator & Inline AI Cover Flow)

```mermaid
flowchart TD
    START([헤더의 'CreatorMode!' 버튼 클릭]) --> RENDER[수동 등록 모달 노출]
    
    %% AI 표지 제작
    RENDER -->|'AI로 표지 만들기' 토글| OPEN_AI_PANEL[AI 표지 생성 패널 활성화]
    OPEN_AI_PANEL --> SELECT_STYLE[테마 스타일 테마 선택]
    SELECT_STYLE --> GEN_PROMPT[스타일과 도서 제목을 결합한 영문 프롬프트 빌드]
    GEN_PROMPT -->|'표지 생성하기' 클릭| API_GEN[Next.js API /api/genthum 호출<br/>OpenAI gpt-image-2]
    API_GEN -->|성공| PREVIEW[생성 표지 이미지 및 다운로드 버튼 제공]
    PREVIEW -->|'이 표지 사용하기' 클릭| APPLY_COVER[폼 thumbnail 필드에 이미지 주소 주입]
    
    %% 최종 제출
    RENDER & APPLY_COVER -->|'등록' 버튼 클릭| VALIDATE{필수 입력값 검증<br/>제목, 저자}
    VALIDATE -->|성공| CREATE_DB[PocketBase 도서 생성 API 호출]
    CREATE_DB -->|성공| CLOSE([모달 닫기 및 목록 동기화])
```

---

## 3. 인증 관련 모달 및 페이지 (Screen 3: Auth)

### 3.1 로그인 / 회원가입 모달
- 메인 화면 헤더에서 접근 가능한 모달창.
- 이메일과 비밀번호(회원가입 시 이름 추가)를 입력받아 PocketBase Auth API 호출.
- 성공 시 브라우저 쿠키에 세션 정보를 동기화하고 헤더 UI를 갱신합니다.

### 3.2 마이페이지 (`/me`)
- 로그인한 사용자만 접근 가능한 별도 라우트.
- 상단에 가입자 프로필 정보(이름, 이메일) 및 기본 가입 현황 노출.
- 하단에 해당 사용자가 직접 등록한 도서 목록(`user_id = currentUser.id`)만 필터링하여 페이징 그리드로 노출합니다.

---

## 4. AI 표지 이미지 생성 모달 (Screen 4: Detail View AI Cover Generator)

도서 상세 뷰에서 기존 표지가 없을 경우, 단독 팝업 형태로 실행되는 AI 표지 제작 모달입니다.

### 4.1 화면 흐름도 (Flowchart)

```mermaid
flowchart TD
    START([상세 뷰에서 'AI 표지 이미지 생성' 클릭]) --> RENDER[AI 썸네일 생성기 모달 노출]
    
    RENDER -->|'생성하기' 버튼 클릭| API_GEN[Next.js API /api/genthum 호출]
    API_GEN --> GPT_IMG[OpenAI gpt-image-2 모델 이미지 빌드]
    GPT_IMG --> SAVE_FILE[서버 로컬 public/covers/ 디렉토리에 파일 저장]
    SAVE_FILE --> SAVE_DB[DB thumbnail 필드에 상대 경로 /covers/파일명.png 저장]
    
    SAVE_DB --> REFRESH[도서 상세 정보 및 목록 데이터 갱신]
    REFRESH --> CLOSE([결과 확인 후 모달 닫기])
```

---

## 5. AI 리뷰 및 요약 스트리밍 (Screen 5: AI Review Streaming)

도서 상세 뷰 내에 인라인으로 결합된 AI 도서 요약/리뷰 스트리밍 인터페이스입니다.

### 5.1 화면 흐름도 (Flowchart)

```mermaid
flowchart TD
    START([상세 뷰 진입 및 'AI 리뷰 생성' 클릭]) --> CONNECT[Upstage AI 엔드포인트에 직접 연결]
    
    CONNECT --> REQUEST[solar-pro3 모델에 도서 메타데이터 전달 및 요약 요청]
    REQUEST --> STREAM{응답 데이터 청크 스트리밍 루프}
    
    STREAM -->|데이터 수신| UPDATE_UI[streamedReview 상태 업데이트 및 타이핑 효과 출력]
    UPDATE_UI --> STREAM
    
    STREAM -->|생성 완료| SAVE_DB[PocketBase books 컬렉션의 ai_review 필드 PATCH 요청]
    SAVE_DB --> SYNC[localAiReview 로컬 상태 갱신 및 상세 화면 정적 뷰 보존]
```
