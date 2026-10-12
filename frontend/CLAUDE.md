# Project Context: Gravitest — Nigerian EdTech SaaS (Frontend)

Gravitest is a unified educational operating system for Nigerian students —
from SS1 through university entrance and professional certifications (ICAN, Nursing).
Core product: AI-powered CBT exam prep mirroring exact JAMB, WAEC 2026 Digital,
and ICAN interfaces. Built for low-bandwidth, mobile-first Nigerian realities.

> This is the FRONTEND ONLY (Next.js).
> The backend (NestJS) is a separate repository and also powers the mobile app.
> Never write backend logic here. All data goes through the API.

---

## 🏗 Tech Stack

- **Framework:** Next.js 16.2 (App Router)
- **Language:** TypeScript (strict mode — no `any` ever)
- **Styling:** Tailwind CSS v3
- **Components:** shadcn/ui + Radix UI
- **Animation:** Framer Motion
- **Icons:** lucide-react (only this — never react-icons or heroicons)
- **State (client):** Zustand + immer
- **State (server):** TanStack Query v5
- **Forms:** React Hook Form + Zod + @hookform/resolvers
- **Date/Time:** date-fns (never moment.js or dayjs)
- **Charts:** Recharts
- **Rich Text (Essays):** Tiptap
- **Math Equations:** KaTeX + react-katex
- **Video Player:** Video.js + hls.js
- **Whiteboard:** @tldraw/tldraw
- **Offline:** next-pwa + Dexie.js (IndexedDB)
- **HTTP Client:** Axios (custom instance in lib/api.ts — never raw fetch or axios)
- **Realtime:** socket.io-client
- **Payments:** @paystack/inline-js (never Stripe — poor Nigerian support)
- **Notifications:** react-hot-toast
- **Utilities:** nanoid, lodash-es

---

## 🤖 AI Instructions

<!-- BEGIN:nextjs-agent-rules -->

# Next.js: ALWAYS read docs before coding

Before writing any Next.js code, find and read the relevant documentation in:
`node_modules/next/dist/docs/`
This ensures you use the correct version-matched APIs for this project.

<!-- END:nextjs-agent-rules -->

### Additional Gravitest-Specific Rules for AI Agents

- This frontend communicates with a **NestJS REST API** in a separate repository.
  Never generate Express, NestJS, or Prisma code here.
- The NestJS backend also powers a mobile app — do not replicate backend logic
  or duplicate data transformation that should live in the API.
- All AI features (Gravitest-Explain, Gravitest-Tutor chat) call the backend API.
  Never call Groq or Gemini directly from the frontend.
- Always stream AI responses using Vercel AI SDK hooks (`useChat`, `useCompletion`).
- The CBT exam interface must be fully Client Component — no SSR.
  Timer and answer state cannot hydrate from the server.

---

## 🛠 Useful Commands

- **Development:** `npm run dev`
- **Build:** `npm run build`
- **Lint:** `npm run lint`
- **Type Check:** `npx tsc --noEmit`
- **Unit Tests:** `npm run test` (Vitest)
- **E2E Tests:** `npm run test:e2e` (Playwright)
- **Format:** `npm run format` (Prettier)
- **Bundle Analysis:** `npm run analyze`

---

## 🎨 Coding Standards

### Preferred Patterns

- Use **Server Components by default** — only add `"use client"` when needed:
  - Component uses `useState`, `useReducer`, or `useEffect`
  - Component has event handlers (`onClick`, `onChange`)
  - Component uses browser APIs (`window`, `localStorage`)
  - Component uses third-party hooks
- Use **TanStack Query** for all data fetching — never `useEffect` + `fetch`
- Use **React Hook Form** for all forms — never raw HTML `<form>` elements
- Use **Zustand** for global client state — never React Context for shared state
- Use **Server Actions** only for simple mutations with no complex auth logic

### Naming Conventions

- Folders and files: `kebab-case` → `exam-interface/`, `question-card.tsx`
- Components: `PascalCase` → `ExamInterface.tsx`, `QuestionCard.tsx`
- Hooks: `camelCase` with `use` prefix → `useExamTimer.ts`
- Stores: `camelCase` with `Store` suffix → `examStore.ts`
- Pages and layouts: `lowercase` → `page.tsx`, `layout.tsx`

### Import Order

```ts
// 1. React
import { useState } from "react";
// 2. Next.js
import { useRouter } from "next/navigation";
// 3. Third-party libraries
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
// 4. Internal absolute imports
import { useExamStore } from "@/stores/exam-store";
import { cn } from "@/lib/utils";
// 5. Relative imports
import { QuestionCard } from "./question-card";
```

````

### Banned Patterns

```ts
import moment from 'moment'            // ❌ use date-fns
import _ from 'lodash'                 // ❌ use named imports from lodash-es
style={{ color: '#1a4a2e' }}           // ❌ use Tailwind classes
const x: any = response               // ❌ use proper types or unknown + Zod
useEffect(() => { fetchData() }, [])   // ❌ use TanStack Query
import axios from 'axios'             // ❌ use lib/api.ts instance only
```

---

## 📂 Project Structure

```
app/
├── (marketing)/        → Public pages (homepage, pricing, about)
├── (auth)/             → Login, signup, OTP verification
├── (dashboard)/        → Protected student-facing pages
│   ├── practice/       → CBT exam engine
│   ├── library/        → Video + PDF content
│   ├── reports/        → Score history and analytics
│   └── tutors/         → Tutor discovery and booking
├── (school)/           → Protected school admin portal
│   ├── dashboard/
│   ├── tests/          → Create and manage CBT tests
│   └── students/       → Student management
└── layout.tsx

components/
├── ui/                 → shadcn auto-generated (never hand-edit)
├── cbt/                → CBT engine components
│   ├── exam-interface.tsx
│   ├── question-card.tsx
│   ├── question-navigator.tsx
│   ├── exam-timer.tsx
│   ├── sabi-explain.tsx   → AI explanation popup
│   └── essay-interface.tsx
├── dashboard/          → Student dashboard components
├── school/             → School portal components
├── tutoring/           → Live session + whiteboard components
├── layout/             → Navbar, footer, sidebar
└── shared/             → Reusable across all features

lib/
├── utils.ts            → cn() helper — always use for merging Tailwind classes
├── api.ts              → Axios instance with auth interceptors
├── query-client.ts     → TanStack Query client config
└── constants.ts        → App-wide constants

stores/
├── exam-store.ts       → Active CBT session state (Zustand + immer)
├── auth-store.ts       → Current user and role
└── ui-store.ts         → Sidebar, modal, drawer state

hooks/
├── use-exam-timer.ts
├── use-offline-sync.ts
└── use-media-query.ts
```

---

## 🧪 CBT Exam Engine Rules

This is the core product. Read before touching anything in `components/cbt/`.

### Exam Mode Behavior — Never Override

| Mode          | Sabi-Explain    | Analyse Button  | AI Score        | Timer            |
| ------------- | --------------- | --------------- | --------------- | ---------------- |
| `practice`    | ✅ Show         | ✅ Show         | ✅ Show         | Relaxed          |
| `mock`        | ✅ Show         | ❌ Hide         | ❌ Hide         | Strict countdown |
| `school-exam` | ❌ Never render | ❌ Never render | ❌ Never render | Strict countdown |

`school-exam` mode hides all AI features to prevent cheating.
Never conditionally show them — remove from the DOM entirely.

### Timer Rules

- Timer state lives in `exam-store.ts` — synced to backend every 30 seconds
- On page refresh: resumes from last synced value, never resets to full
- Under 5 minutes remaining: apply `text-red-500` to timer display
- Timer font: always `JetBrains Mono` — never change this

### Question Navigator Colors

```
Unanswered  → white cell
Answered    → green  (var --green-500)
Flagged     → gold   (var --gold)
Current     → dark green (var --green-800)
```

Always render the color legend below the grid. Never remove it.

### Essay Interface Rules

- Editor: Tiptap
- Word count: `editor.storage.characterCount.words()`
- Show minimum: "Minimum: X words" next to word counter
- Question navigation: large block buttons `[1] [2] [3] [4]`
- Never use the 1–50 number grid for essay — MCQ only

### JAMB Subject Tab Labels — Use Exactly As Written

```
USE OF ENGLISH · MATHEMATICS · PHYSICS · CHEMISTRY · BIOLOGY
COMMERCE · GOVERNMENT · LITERATURE · ECONOMICS · GEOGRAPHY
AGRICULTURAL SCIENCE · CHRISTIAN RELIGIOUS STUDIES · ISLAMIC RELIGIOUS STUDIES
```

---

## 🎨 Brand Design Tokens

```css
/* Always use these variables — never hardcode hex values */
--green-900: #0d2b1a /* hero backgrounds, deep sections      */ --green-800: #1a4a2e
  /* primary brand — buttons, navbar       */ --green-700: #1f5c38
  /* hover states                          */ --green-500: #2e8b57
  /* answered states, accents              */ --green-400: #3aab6a
  /* online indicators                     */ --green-300: #5dc98a
  /* light accents on dark backgrounds     */ --gold: #f5c842
  /* CTAs, Sabi-Explain label, badges      */ --gold-dark: #d4a017
  /* gold hover states                     */ --cream: #fdfaf4
  /* main page background                  */ --cream-dark: #f5f0e8
  /* alternate section background          */;
```

### Fonts — Never Substitute

```
DM Serif Display  → headings and display text (italic for emphasis)
Sora              → all body and UI text
JetBrains Mono    → exam timers and code blocks only
```

---

## 🌍 Nigerian Context — Always Apply

- Currency: `₦2,500` — never `NGN`, never `N2500`
- Payments: Paystack only — never Stripe
- SMS/OTP: Termii — never Twilio (lower delivery rate in Nigeria)
- Phone numbers: `+234XXXXXXXXXX` format
- Network: significant 2G/3G user base — keep bundles lean,
  lazy-load aggressively, avoid heavy animations on low-end Android
- AI language: English primary, Pidgin supported in Sabi-Tutor responses
- Exam bodies: JAMB, WAEC, NECO, NABTEB, ICAN, Nursing Council of Nigeria
- Key universities: UNILAG, UI, OAU, ABU, UNIBEN, FUTA, LAUTECH,
  UNIPORT, UNICAL, UNILORIN, EKSU, FUNAAB, ATBU

---

## 🚫 Out of Scope — Do Not Build

- Dark mode — not in this phase, do not add `dark:` classes
- React Native / Expo — mobile is a separate repo
- Stripe — Paystack only
- i18n — English only for now
- Backend logic — NestJS handles this in its own repo
- SSR for the CBT exam interface — Client Component only, no exceptions

```

```
````
