# CLAUDE.md

This file is the primary context document for AI coding assistants (Claude, Gemini, Copilot, etc.) working in this repository.
Read this fully before touching any code.

---

## Project

**오승헌의 직박구리** — A personal library management web app.
Users can search books (Kakao Book API), register them to a shared library, manage borrow status, like books, and view AI-generated reviews.

→ See [`docs/`](./docs/) for full SRS, schema, wireframes, and feature specs.

---

## Stack

| Layer | Tool |
|---|---|
| Framework | Next.js 16 (App Router) — **read AGENTS.md before writing any Next.js code** |
| Language | TypeScript 5 |
| Styling | Tailwind CSS v4 |
| Backend / DB | PocketBase 0.26.9 (local, `http://127.0.0.1:8090`) |
| State / Fetching | TanStack React Query v5 |
| External APIs | Kakao Book Search API, Aladin API (partially implemented) |
| Charts | Recharts |
| Icons | Lucide React |

---

## Running Locally

```bash
# 1. PocketBase (separate terminal — must run first)
cd ../pocketbase_mini4
./pocketbase serve
# Admin UI → http://localhost:8090/_/

# 2. Next.js dev server
npm run dev
# App → http://localhost:3000
```

Lint:

```bash
npm run lint
```

---

## Repository Layout

```
app/
  page.tsx              ← Main page: book list, dashboard, auth header
  layout.tsx            ← Root layout + font
  globals.css           ← Global Tailwind base styles
  components/
    AddBookModal.tsx    ← Kakao search → register book flow
    BookListView.tsx    ← Paginated book grid
    BookDetailView.tsx  ← Book detail panel (borrow toggle, delete, AI review)
    DashboardChart.tsx  ← Recharts pie chart (available vs borrowed)
    RankingSidebar.tsx  ← Floating sidebar: like-count ranking
    Likebutton.tsx      ← Optimistic like toggle (PocketBase likes collection)
  lib/
    pocketbase.ts       ← Singleton PocketBase client + cookie auth sync
    kakaoApi.ts         ← Kakao book search
    aladinApi.ts        ← Aladin book data (sales rank, category) ← WIP
  Providers/
    page.tsx            ← React Query QueryClientProvider wrapper
  login/               ← LoginModal component
  register/            ← RegisterModal component
  me/
    page.tsx            ← MyPage: user profile + my registered books
  genthum/
    page.tsx            ← AI thumbnail generation page (WIP)
  api/
    aladin/             ← Next.js route handler for Aladin API proxy
docs/
  schema.md             ← PocketBase collection schemas + ER diagram
  srs.md                ← Software requirements
  function.md           ← Feature breakdown
  tech.md               ← Tech decision docs
  wireframe.md          ← UI wireframes
  usecase.md            ← Use case descriptions
```

---

## Data Model (PocketBase Collections)

### `books`

| Field | Type | Notes |
|---|---|---|
| `id` | text PK | auto |
| `title` | text | required |
| `contents` | text | Kakao API `contents` field |
| `author` | text | comma-joined from Kakao `authors[]` |
| `publisher` | text | |
| `thumbnail` | text | image URL |
| `isAvailable` | bool | default `true` |
| `bestbook` | bool | default `false` (★ badge) |
| `ai_review` | text | AI-generated review |
| `user_id` | relation → `users` | who registered this book |
| `like_count` | number | default `0` |
| `created` / `updated` | autodate | |

### `users` (PocketBase auth)

Standard PocketBase auth fields + `name`, `avatar`, `borrowed_books` (relation list → `books`).

### `likes`

| Field | Type |
|---|---|
| `book_id` | text |
| `user_id` | text |

`likes` is a composite unique record — one user can like a book once.

---

## Key Conventions

### PocketBase Client

Always import from `app/lib/pocketbase.ts`:

```ts
import { pb } from '@/lib/pocketbase';
```

The client is a singleton. Auth state is synced to a browser cookie on every change.
**Never create a second `new PocketBase(...)` instance.**

### React Query Keys

| Data | Query Key |
|---|---|
| Paginated book list | `['books', sortOption, page]` |
| All books (dashboard) | `['books-dashboard']` |
| My books | `['myBooks', user?.id]` |
| Like counts | `['allLikeCounts']` |
| Search history | `['searchHistory', user?.id]` |

When mutating books, always invalidate **both** `['books']` and `['books-dashboard']`.

### bookProps Interface

The canonical book type lives in `app/page.tsx` as `export interface bookProps`.
Import it when you need it:

```ts
import type { bookProps } from '@/app/page.tsx';
```

### Commit Message Format

```
수정_<이름>_<번호>  ←  for modifications
추가_<이름>_<번호>  ←  for additions
최적화_<이름>       ←  for performance work
```

Inline comments in code use the same prefix pattern (see existing code).

### Auth Guard Pattern

Pages that require login check `pb.authStore.model` inside `useEffect` on mount.
Redirect with `router.push('/')` if not authenticated.
Always gate query execution with `enabled: !!user?.id`.

---

## Common Gotchas

- **Hydration mismatch**: Auth state comes from a cookie. Always use an `isHydrated` flag (see `app/page.tsx`) before rendering auth-dependent UI.
- **`authors` vs `author`**: Kakao API returns `authors: string[]`. PocketBase stores `author: string` (comma-joined). Don't confuse them.
- **Aladin API**: The route handler at `app/api/aladin/` is a proxy because Aladin's API returns JSONP (not plain JSON). The `handleAdd` flow in `AddBookModal` is currently commented out pending this integration.
- **PocketBase `getList` vs `getFullList`**: Main book list uses paginated `getList`. Dashboard stats use `getFullList` (separate query key `books-dashboard`) so pagination doesn't skew chart numbers.
- **Tailwind v4**: Config is in `postcss.config.mjs` (not a `tailwind.config.js` file). The `@tailwindcss/postcss` plugin handles it. Do not add a `tailwind.config.js`.

---

## What's WIP / Not Done

- Aladin sales-rank / category integration (`handleAdd` in `AddBookModal` — currently commented out)
- AI thumbnail generation (`app/genthum/page.tsx`)
- AI review generation for books (`ai_review` field exists, generation flow TBD)

Check `docs/plan.md` for current task status.
