<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

<!-- END:nextjs-agent-rules -->

---

# AGENTS.md — AI Agent Rules for This Repository

Read `CLAUDE.md` first. This file adds agent-specific rules on top of it.

---

## Before You Write Any Code

1. **Read the Next.js docs that ship with this repo.**
   This project uses Next.js 16 with React 19 — both are likely newer than your training cutoff.

   ```
   node_modules/next/dist/docs/
   ```

   Open and read the relevant guide before using any Next.js API.

2. **Check `docs/` for existing specs.**
   Feature requests are often already specced in `docs/function.md`, `docs/srs.md`, or `docs/wireframe.md`.
   Do not invent behavior that contradicts those docs.

3. **Check existing code before creating new abstractions.**
   This codebase is small. Grep before adding a new hook, utility, or component.

---

## Mandatory Checks Before Submitting Changes

- [ ] `npm run lint` passes with no new errors
- [ ] No new `PocketBase` instances created — use the singleton from `app/lib/pocketbase.ts`
- [ ] Both `['books']` and `['books-dashboard']` are invalidated after any book mutation
- [ ] Auth-dependent UI is gated behind `isHydrated` (prevents SSR/hydration mismatch)
- [ ] Query is gated with `enabled: !!user?.id` when it requires a logged-in user
- [ ] No `tailwind.config.js` was added (Tailwind v4 uses `postcss.config.mjs`)

---

## Code Generation Rules

### General

- Write TypeScript. No `any` unless the existing code already uses it there.
- Prefer `useMemo` / `useCallback` for anything passed as props to memoized children.
- Do not add new dependencies without asking first.

### React Query

Always follow the established query key table from `CLAUDE.md`.
When adding a new collection query, pick a stable, descriptive key and document it in `CLAUDE.md`.

```ts
// Good
useQuery({ queryKey: ['books', sortOption, page], queryFn: ... })

// Bad — unstable key, breaks caching
useQuery({ queryKey: ['books' + Date.now()], queryFn: ... })
```

### PocketBase

```ts
// Always
import { pb } from "@/lib/pocketbase";

// Never
import PocketBase from "pocketbase";
const pb = new PocketBase("http://127.0.0.1:8090"); // ← creates a second instance
```

Auth is stored in a cookie. To read current user: `pb.authStore.model`.
To gate UI on auth: use the `isHydrated` + `user` state pattern from `app/page.tsx`.

### Kakao API

The field name is `authors` (array) coming from Kakao.
PocketBase stores it as `author` (string, comma-joined).
Always join before saving:

```ts
author: book.authors?.join(", ");
```

### File & Asset Storage Rules

- **Generated Assets**: Do not use external storage services for generated assets (e.g., AI thumbnails from DALL-E) unless explicitly requested. Save them as local files inside the `public/` directory (e.g., `public/covers/`).
- **Database Paths**: Never store absolute local paths or `public/` prefixes in the database. Store only the relative path (e.g., `/covers/filename.png`) so Next.js can serve it directly via `<img>` or `<Image>`.

### Comments / Commit Style

Follow the team's established tagging style:

```ts
// 추가_<이름>_<번호> 기능 설명
// 수정_<이름>_<번호> 변경 이유
// 최적화_<이름> 최적화 내용
```

---

## UI & Styling Conventions

- **Tailwind Only**: Do not use inline styles (`style={{...}}`) or CSS modules unless absolutely necessary. Rely on Tailwind CSS utility classes.
- **Icons**: Strictly use **`lucide-react`**. Do not introduce other icon libraries.
- **Design Language**: Maintain the project's modern, premium aesthetic.
  - Use **glassmorphism** for floating elements or modals (e.g., `bg-white/90 backdrop-blur-md`).
  - Use **micro-animations** for interactive elements (e.g., `transition-all duration-200 hover:scale-105 active:scale-95`).
  - Utilize **gradients** where appropriate to highlight primary actions (e.g., `bg-gradient-to-r from-indigo-500 to-purple-600`).

---

## File Creation Rules

| Situation                 | Where to put it             |
| ------------------------- | --------------------------- |
| New page                  | `app/<route>/page.tsx`      |
| New reusable component    | `app/components/<Name>.tsx` |
| New API utility / wrapper | `app/lib/<name>.ts`         |
| New Next.js API route     | `app/api/<name>/route.ts`   |
| New docs                  | `docs/<name>.md`            |

Always use `'use client'` at the top of any file that uses React state, effects, or browser APIs.
Omit it for pure server components or utility modules.

---

## WIP Areas — Proceed with Caution

| Area                       | Status        | Notes                                              |
| -------------------------- | ------------- | -------------------------------------------------- |
| `app/genthum/page.tsx`     | Partial WIP   | AI thumbnail generation works, saves to `/covers/` |
| `AddBookModal` `handleAdd` | Commented out | Aladin integration incomplete; do not refactor yet |
| `app/api/aladin/`          | Partial       | JSONP proxy — do not change response format        |

Do not refactor WIP code unless the task explicitly asks for it.

---

## What Good Output Looks Like

- Minimal diff. Change only what the task requires.
- No reformatting of unrelated code.
- Preserve all existing comments (`// 추가_...`, `// 수정_...`).
- If you discover a bug while working on something else, note it in a comment (`// TODO:`) rather than fixing it silently.
