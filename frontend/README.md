<div align="center">

<img src="public/logo.svg" alt="Gravitest Logo" width="80" height="80" />

# Gravitest

### Nigeria's AI-Powered Exam Preparation Platform

Pass JAMB. Conquer WAEC. Own your future.

[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square&logo=typescript)](https://typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.0-38bdf8?style=flat-square&logo=tailwindcss)](https://tailwindcss.com)
[![License](https://img.shields.io/badge/License-Private-red?style=flat-square)]()
[![Status](https://img.shields.io/badge/Status-In%20Development-yellow?style=flat-square)]()

[Live Demo](#) · [Report Bug](#) · [Request Feature](#) · [API Docs](#)

</div>

---

## 📋 Table of Contents

- [About The Project](#about-the-project)
- [Product Architecture](#product-architecture)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Development Guide](#development-guide)
- [Key Features Deep Dive](#key-features-deep-dive)
- [AI Integration](#ai-integration)
- [Nigerian Context](#nigerian-context)
- [Testing](#testing)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [Roadmap](#roadmap)

---

## About The Project

Gravitest is a unified educational operating system for Nigerian students — from
SS1 through university entrance and professional certifications (ICAN, Nursing
Council of Nigeria).

**The core problem it solves:**

Nigerian students preparing for JAMB, WAEC, and Post-UTME have no single platform
that mirrors the exact exam interfaces they will face, provides AI-powered
explanations grounded in the Nigerian curriculum, and works reliably on the 2G/3G
networks that most students use. Gravitest fixes all three.

**The single promise:**
Every Nigerian student, regardless of location or income, gets access to exam
preparation that actually works.

### What Makes Gravitest Different

| Feature                            | Gravitest           | Ulessons | PrepClass | Exampulse |
| ---------------------------------- | ------------------- | -------- | --------- | --------- |
| Exact CBT interface replication    | ✅ JAMB + WAEC 2026 | ❌       | ❌        | Partial   |
| Theory/Essay smart mode            | ✅                  | ❌       | ❌        | ❌        |
| AI explanations (Nigerian context) | ✅ Sabi-Explain     | ❌       | ❌        | ❌        |
| Professional exams (ICAN, Nursing) | ✅                  | ❌       | ❌        | ❌        |
| School white-label portal          | ✅                  | ❌       | ❌        | ❌        |
| Parent dashboard + WhatsApp report | ✅                  | ❌       | ❌        | ❌        |
| In-person tutor location matching  | ✅ LGA-level        | ❌       | Partial   | ❌        |
| Offline content + PWA              | ✅                  | ✅       | ❌        | ❌        |
| Pidgin AI support                  | ✅                  | ❌       | ❌        | ❌        |

> **This repository** is the Next.js 15 frontend only.
> The NestJS backend (which also powers the mobile app) lives in a
> separate repository: `Gravitest-api`.

---

## Product Architecture

Gravitest is built in tiers — each tier is independently valuable and monetizable:

```
TIER 1 — CBT Exam Engine          ← MVP. Ship this first.
├── JAMB CBT Simulator            (pixel-perfect interface replication)
├── WAEC / NECO / NABTEB CBT      (objective + theory/essay modes)
├── Post-UTME Suite               (40+ universities)
└── ICAN & Nursing Professional   (2025/26 syllabus)

TIER 2 — School White-Label Portal   ← B2B revenue stream
├── Branded school subdomain
├── Custom CBT test builder       (Class → Subject → Topic)
├── Auto-grading + PDF report cards
├── Attendance + announcements
└── Parent WhatsApp weekly reports

TIER 3 — AI Sabi-Tutor Layer     ← Embedded across everything
├── Sabi-Explain (wrong answer AI breakdown)
├── Post-exam post-mortem analysis
├── Endless practice question generation
├── Voice input support
└── Pidgin language support

TIER 4 — Tutoring Marketplace    ← Network effect builder
├── Online live tutoring (whiteboard + video)
├── In-person tutor matching (LGA-level)
└── Booking + escrow payment system

TIER 5 — Content Library         ← Daily retention engine
├── Short video lessons per topic
├── PDF resources + formula sheets
├── Offline download mode
└── Streaks, XP, leaderboards
```

---

## Tech Stack

### Frontend (This Repository)

| Category       | Technology              | Purpose                                |
| -------------- | ----------------------- | -------------------------------------- |
| Framework      | Next.js 15 (App Router) | Full-stack React framework             |
| Language       | TypeScript (strict)     | Type safety across the entire codebase |
| Styling        | Tailwind CSS v3         | Utility-first styling                  |
| Components     | shadcn/ui + Radix UI    | Accessible, unstyled UI primitives     |
| Animation      | Framer Motion           | Page transitions + micro-interactions  |
| Icons          | lucide-react            | Consistent SVG icon set                |
| State (client) | Zustand + immer         | CBT session, auth, UI global state     |
| State (server) | TanStack Query v5       | API data fetching, caching, sync       |
| Forms          | React Hook Form + Zod   | Validation with shared schemas         |
| Date/Time      | date-fns                | Timer formatting, scheduling           |
| Charts         | Recharts                | Score analytics, performance radar     |
| Rich Text      | Tiptap                  | WAEC/ICAN essay interface              |
| Math           | KaTeX + react-katex     | Physics, Chemistry, Maths equations    |
| Video          | Video.js + hls.js       | Adaptive bitrate streaming             |
| Whiteboard     | @tldraw/tldraw          | Live tutoring collaborative board      |
| Offline        | next-pwa + Dexie.js     | Service worker + IndexedDB cache       |
| HTTP           | Axios                   | API communication with interceptors    |
| Realtime       | socket.io-client        | Whiteboard sync, live leaderboards     |
| Payments       | @paystack/inline-js     | Nigerian payment processing            |
| Notifications  | react-hot-toast         | Global flash notifications             |

### Backend (Separate Repository — `Gravitest-api`)

| Category        | Technology                     |
| --------------- | ------------------------------ |
| Framework       | NestJS                         |
| Language        | TypeScript                     |
| Database        | PostgreSQL (Supabase)          |
| ORM             | Prisma                         |
| Cache           | Redis (Upstash)                |
| Auth            | Better Auth                    |
| AI (Primary)    | Groq (llama-3.3-70b-versatile) |
| AI (Secondary)  | Gemini Flash                   |
| Vector DB       | Qdrant                         |
| Storage         | Cloudflare R2                  |
| Email           | Resend                         |
| SMS/OTP         | Termii                         |
| Video Calls     | Livekit                        |
| Background Jobs | BullMQ                         |
| Search          | Meilisearch                    |
| Automation      | n8n (WhatsApp reports)         |

---

## Project Structure

```
Gravitest-web/
│
├── app/                           ← All routes (Next.js App Router)
│   ├── (marketing)/               ← Public pages — no auth required
│   │   ├── page.tsx               ← Homepage
│   │   ├── pricing/page.tsx
│   │   ├── about/page.tsx
│   │   ├── blog/
│   │   │   ├── page.tsx
│   │   │   └── [slug]/page.tsx
│   │   └── schools/page.tsx
│   │
│   ├── (auth)/                    ← Authentication flow
│   │   ├── login/page.tsx
│   │   ├── signup/page.tsx
│   │   ├── verify/page.tsx        ← OTP verification
│   │   └── reset-password/page.tsx
│   │
│   ├── (dashboard)/               ← Protected — student role
│   │   ├── page.tsx               ← Student home dashboard
│   │   ├── practice/              ← CBT exam engine
│   │   │   ├── page.tsx           ← Exam type selection
│   │   │   ├── [examType]/page.tsx
│   │   │   └── session/
│   │   │       └── [sessionId]/
│   │   │           ├── page.tsx   ← LIVE EXAM INTERFACE
│   │   │           └── results/page.tsx
│   │   ├── library/               ← Video + PDF content
│   │   ├── reports/               ← Score analytics
│   │   ├── tutors/                ← Tutor marketplace + live room
│   │   ├── leaderboard/page.tsx
│   │   ├── ai-tutor/page.tsx      ← Dedicated Sabi-Tutor chat
│   │   └── settings/
│   │
│   ├── (school)/                  ← Protected — school_admin role
│   │   ├── page.tsx               ← School dashboard
│   │   ├── students/              ← Student management + CSV upload
│   │   ├── tests/                 ← CBT test builder
│   │   ├── classes/
│   │   ├── reports/
│   │   └── settings/page.tsx      ← Branding, WhatsApp webhook
│   │
│   ├── (tutor)/                   ← Protected — tutor role
│   │   ├── page.tsx               ← Tutor dashboard
│   │   ├── sessions/
│   │   ├── availability/page.tsx
│   │   └── earnings/page.tsx
│   │
│   └── api/                       ← Minimal route handlers
│       ├── auth/[...nextauth]/route.ts
│       ├── payments/webhook/route.ts
│       └── revalidate/route.ts
│
├── components/
│   ├── ui/                        ← shadcn/ui (never hand-edit)
│   ├── cbt/                       ← CBT exam engine components
│   │   ├── exam-interface.tsx     ← Main exam wrapper (Client Component)
│   │   ├── question-card.tsx      ← Question + diagram + A/B/C/D options
│   │   ├── question-navigator.tsx ← Color-coded question grid
│   │   ├── exam-timer.tsx         ← Countdown (red under 5 minutes)
│   │   ├── subject-tabs.tsx       ← JAMB subject switching
│   │   ├── sabi-explain.tsx       ← AI explanation (hidden in school-exam mode)
│   │   ├── essay-interface.tsx    ← Tiptap + word count + navigator
│   │   ├── exam-submit-dialog.tsx
│   │   ├── results-screen.tsx
│   │   └── post-mortem.tsx        ← AI weak area analysis
│   ├── ai-tutor/                  ← Sabi-Tutor chat components
│   ├── tutoring/                  ← Live tutoring room + whiteboard
│   ├── library/                   ← Video player, content cards
│   ├── dashboard/                 ← Score charts, streak card, widgets
│   ├── school/                    ← School admin components
│   ├── layout/                    ← Navbar, sidebars, footer, topbar
│   └── shared/                    ← Reusable across all features
│
├── lib/
│   ├── utils.ts                   ← cn() — always use for Tailwind merging
│   ├── api.ts                     ← Axios instance — always import this
│   ├── query-client.ts            ← TanStack Query config
│   ├── constants.ts               ← Exam types, subjects, routes, enums
│   ├── validations.ts             ← Shared Zod schemas
│   └── offline/
│       ├── db.ts                  ← Dexie IndexedDB schema
│       └── sync.ts                ← Offline answer sync queue
│
├── stores/
│   ├── exam-store.ts              ← Active CBT session (Zustand + immer)
│   ├── auth-store.ts              ← Current user + role + subscription
│   └── ui-store.ts                ← Sidebar, modals, UI state
│
├── hooks/
│   ├── use-exam-timer.ts          ← CBT countdown + Redis sync
│   ├── use-offline-sync.ts        ← Offline detection + queue
│   ├── use-paystack.ts            ← Payment popup trigger
│   ├── use-socket.ts              ← Socket.io connection
│   └── use-debounce.ts
│
├── types/
│   ├── exam.ts                    ← Question, Answer, ExamSession, ExamMode
│   ├── user.ts                    ← User, Role, Subscription
│   ├── school.ts                  ← School, Class, Test, Student
│   └── tutor.ts                   ← TutorProfile, Session, Booking
│
├── config/
│   ├── site.ts                    ← Site metadata
│   ├── nav.ts                     ← Navigation definitions
│   └── exam-config.ts             ← JAMB subjects, time limits, exam rules
│
├── public/
│   ├── logo.svg
│   ├── manifest.json              ← PWA manifest
│   └── icons/                     ← PWA icons
│
├── middleware.ts                  ← Route protection + role redirects
├── next.config.ts                 ← Next.js + PWA config
├── tailwind.config.ts             ← Brand tokens + custom config
├── tsconfig.json                  ← Strict TypeScript
├── AGENTS.md                      ← AI coding agent context
├── CLAUDE.md                      ← Symlink → AGENTS.md
└── .env.example                   ← Environment variable template
```

---

## Getting Started

### Prerequisites

Make sure you have these installed before cloning:

- **Node.js** — v20 LTS or higher
- **npm** — v10 or higher
- **Git**

Check your versions:

```bash
node --version    # should be v20+
npm --version     # should be v10+
```

### Installation

**1. Clone the repository**

```bash
git clone https://github.com/your-org/Gravitest-web.git
cd Gravitest-web
```

**2. Install dependencies**

```bash
npm install
```

**3. Set up environment variables**

```bash
cp .env.example .env.local
```

Then fill in your values — see [Environment Variables](#environment-variables) below.

**4. Initialize shadcn/ui** (first time only)

```bash
npx shadcn@latest init
```

**5. Start the development server**

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — you should see the Gravitest homepage.

> **Note:** The frontend will work in isolation for static pages.
> For authenticated features (CBT, dashboard, school portal), you need
> the `Gravitest-api` NestJS backend running on port 5000.

---

## Environment Variables

Copy `.env.example` to `.env.local` and fill in the values:

```bash
# ── API ──────────────────────────────────────────────
# URL of the NestJS backend API
NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1

# ── APP ──────────────────────────────────────────────
NEXT_PUBLIC_APP_URL=http://localhost:3000

# ── PAYMENTS ─────────────────────────────────────────
# Paystack public key (get from dashboard.paystack.com)
NEXT_PUBLIC_PAYSTACK_KEY=pk_test_xxxxxxxxxxxxxxxxxxxx

# ── REALTIME ─────────────────────────────────────────
# Socket.io server URL (same as API server)
NEXT_PUBLIC_SOCKET_URL=http://localhost:5000

# ── AUTOMATION ───────────────────────────────────────
# n8n webhook for WhatsApp parent reports
NEXT_PUBLIC_N8N_WEBHOOK_URL=https://your-n8n-instance.com/webhook/xxx

# ── ANALYTICS ────────────────────────────────────────
NEXT_PUBLIC_POSTHOG_KEY=phc_xxxxxxxxxxxxxxxxxxxx
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com
```

> ⚠️ Never commit `.env.local` to version control.
> Never put secret or server-side keys in `NEXT_PUBLIC_` variables —
> these are exposed to the browser.

---

## Development Guide

### Available Scripts

```bash
# Start development server with hot reload
npm run dev

# Build for production
npm run build

# Start production server (after build)
npm run start

# TypeScript type checking (no emit)
npm run typecheck

# ESLint
npm run lint

# ESLint with auto-fix
npm run lint:fix

# Prettier format
npm run format

# Check formatting without writing
npm run format:check

# Run unit tests (Vitest)
npm run test

# Run unit tests in watch mode
npm run test:watch

# Run unit tests with UI
npm run test:ui

# Run E2E tests (Playwright)
npm run test:e2e

# Run E2E tests in UI mode
npm run test:e2e:ui

# Analyze bundle size
npm run analyze
```

### Adding shadcn Components

```bash
# Add a specific component
npx shadcn@latest add button
npx shadcn@latest add dialog
npx shadcn@latest add tabs

# Components are added to components/ui/
# Never hand-edit these files
```

### Code Style Rules

**TypeScript — non-negotiables:**

```typescript
// ❌ Never use any
const data: any = response;

// ✅ Use unknown + Zod parsing
const data: unknown = response;
const parsed = MySchema.parse(data);
```

**Components — Server vs Client:**

```tsx
// ✅ Server Component by default (no directive needed)
export default function LibraryPage() {
  return <div>...</div>
}

// ✅ Only add 'use client' when you actually need it
'use client'
import { useState } from 'react'
export default function ExamTimer() {
  const [time, setTime] = useState(3600)
  ...
}
```

**Styling — always use cn():**

```tsx
import { cn } from '@/lib/utils'

// ✅ Correct
<div className={cn('base-class', isActive && 'active-class', className)}>

// ❌ Never string concatenate Tailwind classes
<div className={`base-class ${isActive ? 'active-class' : ''}`}>
```

**Data fetching — always TanStack Query:**

```tsx
// ✅ Correct
const { data, isLoading } = useQuery({
  queryKey: ['questions', examType, subjectId],
  queryFn: () => api.get(`/cbt/questions/${examType}/${subjectId}`)
})

// ❌ Never useEffect for data fetching
useEffect(() => {
  fetch('/api/questions').then(...)
}, [])
```

**API calls — always use the Axios instance:**

```typescript
// ✅ Correct — uses interceptors, auth cookies, error handling
import api from "@/lib/api";
const { data } = await api.get("/cbt/questions");

// ❌ Never use raw axios or fetch for API calls
import axios from "axios";
const { data } = await axios.get("...");
```

---

## Key Features Deep Dive

### CBT Exam Engine

The most critical feature. The exam interface replicates the exact JAMB, WAEC,
and ICAN interfaces pixel-for-pixel so students feel zero surprise on exam day.

**Exam modes and their behavior:**

| Mode          | Sabi-Explain    | Analyse Button  | AI Score        | Timer   |
| ------------- | --------------- | --------------- | --------------- | ------- |
| `practice`    | ✅ Visible      | ✅ Visible      | ✅ Visible      | Relaxed |
| `mock`        | ✅ Visible      | ❌ Hidden       | ❌ Hidden       | Strict  |
| `school-exam` | ❌ Never render | ❌ Never render | ❌ Never render | Strict  |

> In `school-exam` mode, AI features are **removed from the DOM entirely**
> — not just hidden with CSS. This prevents cheating.

**Question navigator color system:**

```
⬜ White      → Unanswered
🟩 Green      → Answered
🟨 Gold       → Flagged for review
🟦 Dark green → Currently active question
```

**Timer behavior:**

- Synced to backend Redis every 30 seconds
- Resumes from last synced value on page refresh — never resets
- Turns red (`text-red-500`) when under 5 minutes remaining
- Always displayed in `JetBrains Mono` font

### Essay / Theory Interface (WAEC Smart Mode)

The essay interface adapts based on context:

**Practice mode** — student gets full AI assistance:

- Rich text editor (Tiptap) with formatting toolbar
- Word count tracker with minimum word requirement
- `ANALYSE` button triggers AI grading (Sabi-Score)
- AI breakdown shows: Content score, Structure score, Language score
- "Ask Sabi-Tutor →" CTA appears after AI feedback

**School exam mode** — fully locked down:

- `ANALYSE` button removed from DOM
- AI score section removed from DOM
- Bottom banner: `⚠️ Official Exam Mode — AI features disabled`
- Student only sees "Submit Paper"

### School Portal

Schools get a fully branded portal on a subdomain. Key capabilities:

- **Test builder:** Class → Subject → Topic hierarchy
- **Bulk onboarding:** CSV upload via papaparse (max 500 students)
- **Auto-grading:** Exam submitted → scored → PDF report generated instantly
- **WhatsApp reports:** Weekly summary sent to parent numbers via n8n + Termii
- **Parent dashboard:** Parents track child performance — since parents pay,
  giving them visibility turns them into word-of-mouth advocates

### Offline Support

Built for Nigerian network realities:

```
Download question bank → stored in IndexedDB (Dexie.js)
Go offline → exam still works from cached questions
Submit answers offline → queued in Dexie
Come online → Background Sync API fires, answers submitted
```

The `useOfflineSync` hook handles detection and queuing transparently.

---

## AI Integration

### Providers

| Provider     | Model                   | Used For                                                              |
| ------------ | ----------------------- | --------------------------------------------------------------------- |
| Groq         | llama-3.3-70b-versatile | Sabi-Explain, Sabi-Tutor chat, post-mortem analysis, Pidgin responses |
| Gemini Flash | gemini-1.5-flash        | Image questions, PDF extraction, multimodal tasks                     |

> AI providers are **never called directly from the frontend.**
> All AI requests go through the NestJS backend API.
> The frontend uses Vercel AI SDK hooks to consume streaming responses.

### Vercel AI SDK Hooks

```typescript
// Sabi-Tutor conversational chat
import { useChat } from "ai/react";
const { messages, input, handleSubmit } = useChat({
  api: `${process.env.NEXT_PUBLIC_API_URL}/ai/chat`,
});

// Sabi-Explain single-shot explanation
import { useCompletion } from "ai/react";
const { completion, complete } = useCompletion({
  api: `${process.env.NEXT_PUBLIC_API_URL}/ai/explain`,
});
```

Always stream — never wait for full response before displaying.

### Sabi-Tutor System Personality

The Sabi-Tutor AI is instructed on the backend to:

- Use Nigerian curriculum context in all explanations
- Use local examples (garri, danfo, market prices, NEPA light)
- Respond in Pidgin when the student writes in Pidgin
- Always tie explanations back to the WAEC/JAMB syllabus
- Offer a follow-up practice question after every explanation

---

## Nigerian Context

This section matters. Gravitest is built _for_ Nigeria, not adapted _to_ Nigeria.

### Currency

```typescript
// ✅ Correct
"₦2,500";

// ❌ Wrong
"NGN 2500";
"N2,500";
```

### Payments

- **Paystack only** — best Nigerian card/bank support, USSD payments
- Never add Stripe — poor Nigerian card acceptance rates

### Network Reality

- Significant portion of users on 2G/3G
- All images use `next/image` with proper sizing
- Videos use HLS adaptive bitrate (hls.js) — auto-downgrades on slow connection
- Question banks downloadable for offline use
- Avoid heavy animations on mobile (`prefers-reduced-motion` respected)

### Exam Bodies Supported

```
JAMB (Joint Admissions and Matriculation Board)
WAEC (West African Examinations Council)
NECO (National Examinations Council)
NABTEB (National Business and Technical Examinations Board)
ICAN (Institute of Chartered Accountants of Nigeria)
Nursing Council of Nigeria
```

### Universities in Post-UTME Module

```
UNILAG · UI · OAU · ABU · UNIBEN · FUTA · LAUTECH
UNIPORT · UNICAL · UNILORIN · EKSU · FUNAAB · ATBU · MAUTECH
+ 30 more institutions
```

---

## Testing

### Unit Tests (Vitest + Testing Library)

```bash
npm run test
```

Key areas covered:

- CBT scoring logic — correct answer calculation, partial scores
- Exam timer — Redis sync, resume on refresh, red state trigger
- Mode enforcement — AI features absent in school-exam mode
- Form validation — Zod schemas for all form inputs
- Offline queue — answers queued and synced correctly

```bash
# Run specific test file
npm run test exam-store.test.ts

# Coverage report
npm run test -- --coverage
```

### E2E Tests (Playwright)

```bash
npm run test:e2e
```

Critical flows tested end-to-end:

- Complete a full JAMB mock exam from start to results
- Submit an essay in practice mode and receive AI marking
- School admin creates a test and student takes it
- Student books a tutor session and enters the tutoring room
- Paystack subscription upgrade flow

```bash
# Run specific E2E test
npx playwright test exam-flow.spec.ts

# Open Playwright UI
npm run test:e2e:ui
```

---

## Deployment

### Frontend — Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy preview
vercel

# Deploy to production
vercel --prod
```

**Vercel project settings:**

- Framework: Next.js
- Build command: `npm run build`
- Output directory: `.next`
- Node.js version: 20.x

Set all environment variables from `.env.example` in the Vercel dashboard
under Project Settings → Environment Variables.

### Environment-Specific URLs

| Environment | Frontend                       | API                                |
| ----------- | ------------------------------ | ---------------------------------- |
| Development | `http://localhost:3000`        | `http://localhost:5000`            |
| Staging     | `https://staging.Gravitest.ng` | `https://staging-api.Gravitest.ng` |
| Production  | `https://Gravitest.ng`         | `https://api.Gravitest.ng`         |

### PWA Build Check

After building, verify the service worker and manifest are generated:

```bash
npm run build
ls .next/static/   # should contain workbox files
cat public/manifest.json   # verify PWA manifest is correct
```

---

## Contributing

This is a private repository. All contributors must be approved by the
project lead before receiving access.

### Branch Strategy

```
main          ← production — protected, PR only
staging       ← pre-production testing
develop       ← active development branch
feature/*     ← new features (branch from develop)
fix/*         ← bug fixes (branch from develop)
hotfix/*      ← urgent production fixes (branch from main)
```

### Commit Convention

```
feat(scope):     new feature
fix(scope):      bug fix
style(scope):    UI/CSS only, no logic change
refactor(scope): code restructure, no behavior change
test(scope):     tests only
chore(scope):    deps, config, tooling
docs(scope):     documentation only

Examples:
feat(cbt): add flag question to navigator with gold highlight
fix(timer): resume from Redis sync value on page refresh
style(hero): update homepage CTA gradient animation
feat(school): bulk student CSV upload with papaparse validation
fix(sabi-explain): remove from DOM entirely in school-exam mode
```

### Pull Request Checklist

Before opening a PR, confirm:

- [ ] TypeScript compiles with no errors (`npm run typecheck`)
- [ ] ESLint passes with no warnings (`npm run lint`)
- [ ] All existing tests pass (`npm run test`)
- [ ] New features have unit tests written
- [ ] No `any` types introduced
- [ ] No hardcoded hex colors — CSS variables or Tailwind only
- [ ] No `moment.js`, `lodash` (non-es), or `react-icons` imported
- [ ] `school-exam` mode hides all AI features from DOM (not just CSS)
- [ ] Responsive — tested on 375px mobile width minimum
- [ ] PR description explains what changed and why

---

## Roadmap

### Phase 1 — MVP (Current)

- [x] Homepage and marketing pages
- [ ] Authentication (email, Google OAuth, phone OTP)
- [ ] JAMB CBT simulator (objective mode)
- [ ] Question navigator with color coding
- [ ] Sabi-Explain AI popup
- [ ] Basic performance analytics dashboard
- [ ] Paystack subscription integration

### Phase 2 — Core Platform

- [ ] WAEC/NECO CBT (objective + essay/theory mode)
- [ ] Post-UTME module (40+ universities)
- [ ] School white-label portal
- [ ] CSV bulk student onboarding
- [ ] Auto-grading + PDF report cards
- [ ] Parent WhatsApp reports (n8n integration)

### Phase 3 — AI & Tutoring

- [ ] Sabi-Tutor dedicated chat interface
- [ ] Post-exam AI post-mortem
- [ ] Endless practice question generation
- [ ] Voice input support
- [ ] Tutor marketplace (online + in-person)
- [ ] Live tutoring room (Livekit + tldraw)

### Phase 4 — Scale

- [ ] ICAN & Nursing professional modules
- [ ] Content library (video lessons + PDFs)
- [ ] Full offline mode (PWA + Dexie sync)
- [ ] Streaks, XP, national leaderboards
- [ ] Inter-school CBT competitions
- [ ] University module (100L–400L students)
- [ ] Mobile app (React Native — separate repo)

---

## License

Private and proprietary. All rights reserved.
© 2025 Gravitest Technologies Ltd. Made with ❤️ in Nigeria.

---

<div align="center">

**Built for Nigerian students. By Nigerians.**

[Gravitest.ng](https://Gravitest.ng) · [support@Gravitest.ng](mailto:support@Gravitest.ng)

</div>
