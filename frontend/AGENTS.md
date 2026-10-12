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

<!-- NEXT-AGENTS-MD-START -->[Next.js Docs Index]|root: ./.next-docs|STOP. What you remember about Next.js is WRONG for this project. Always search docs and read before any task.|If docs missing, run this command first: npx @next/codemod agents-md --output AGENTS.md|01-app:{04-glossary.mdx}|01-app/01-getting-started:{01-installation.mdx,02-project-structure.mdx,03-layouts-and-pages.mdx,04-linking-and-navigating.mdx,05-server-and-client-components.mdx,06-fetching-data.mdx,07-mutating-data.mdx,08-caching.mdx,09-revalidating.mdx,10-error-handling.mdx,11-css.mdx,12-images.mdx,13-fonts.mdx,14-metadata-and-og-images.mdx,15-route-handlers.mdx,16-proxy.mdx,17-deploying.mdx,18-upgrading.mdx}|01-app/02-guides:{ai-agents.mdx,analytics.mdx,authentication.mdx,backend-for-frontend.mdx,caching-without-cache-components.mdx,ci-build-caching.mdx,content-security-policy.mdx,css-in-js.mdx,custom-server.mdx,data-security.mdx,debugging.mdx,draft-mode.mdx,environment-variables.mdx,forms.mdx,incremental-static-regeneration.mdx,instant-navigation.mdx,instrumentation.mdx,internationalization.mdx,json-ld.mdx,lazy-loading.mdx,local-development.mdx,mcp.mdx,mdx.mdx,memory-usage.mdx,migrating-to-cache-components.mdx,multi-tenant.mdx,multi-zones.mdx,open-telemetry.mdx,package-bundling.mdx,prefetching.mdx,preserving-ui-state.mdx,production-checklist.mdx,progressive-web-apps.mdx,public-static-pages.mdx,redirecting.mdx,sass.mdx,scripts.mdx,self-hosting.mdx,single-page-applications.mdx,static-exports.mdx,streaming.mdx,tailwind-v3-css.mdx,third-party-libraries.mdx,videos.mdx}|01-app/02-guides/migrating:{app-router-migration.mdx,from-create-react-app.mdx,from-vite.mdx}|01-app/02-guides/testing:{cypress.mdx,jest.mdx,playwright.mdx,vitest.mdx}|01-app/02-guides/upgrading:{codemods.mdx,version-14.mdx,version-15.mdx,version-16.mdx}|01-app/03-api-reference:{07-edge.mdx,08-turbopack.mdx}|01-app/03-api-reference/01-directives:{use-cache-private.mdx,use-cache-remote.mdx,use-cache.mdx,use-client.mdx,use-server.mdx}|01-app/03-api-reference/02-components:{font.mdx,form.mdx,image.mdx,link.mdx,script.mdx}|01-app/03-api-reference/03-file-conventions/01-metadata:{app-icons.mdx,manifest.mdx,opengraph-image.mdx,robots.mdx,sitemap.mdx}|01-app/03-api-reference/03-file-conventions/02-route-segment-config:{dynamicParams.mdx,instant.mdx,maxDuration.mdx,preferredRegion.mdx,runtime.mdx}|01-app/03-api-reference/03-file-conventions:{default.mdx,dynamic-routes.mdx,error.mdx,forbidden.mdx,instrumentation-client.mdx,instrumentation.mdx,intercepting-routes.mdx,layout.mdx,loading.mdx,mdx-components.mdx,not-found.mdx,page.mdx,parallel-routes.mdx,proxy.mdx,public-folder.mdx,route-groups.mdx,route.mdx,src-folder.mdx,template.mdx,unauthorized.mdx}|01-app/03-api-reference/04-functions:{after.mdx,cacheLife.mdx,cacheTag.mdx,catchError.mdx,connection.mdx,cookies.mdx,draft-mode.mdx,fetch.mdx,forbidden.mdx,generate-image-metadata.mdx,generate-metadata.mdx,generate-sitemaps.mdx,generate-static-params.mdx,generate-viewport.mdx,headers.mdx,image-response.mdx,next-request.mdx,next-response.mdx,not-found.mdx,permanentRedirect.mdx,redirect.mdx,refresh.mdx,revalidatePath.mdx,revalidateTag.mdx,unauthorized.mdx,unstable_cache.mdx,unstable_noStore.mdx,unstable_rethrow.mdx,updateTag.mdx,use-link-status.mdx,use-params.mdx,use-pathname.mdx,use-report-web-vitals.mdx,use-router.mdx,use-search-params.mdx,use-selected-layout-segment.mdx,use-selected-layout-segments.mdx,userAgent.mdx}|01-app/03-api-reference/05-config/01-next-config-js:{adapterPath.mdx,allowedDevOrigins.mdx,appDir.mdx,assetPrefix.mdx,authInterrupts.mdx,basePath.mdx,cacheComponents.mdx,cacheHandlers.mdx,cacheLife.mdx,compress.mdx,crossOrigin.mdx,cssChunking.mdx,deploymentId.mdx,devIndicators.mdx,distDir.mdx,env.mdx,expireTime.mdx,exportPathMap.mdx,generateBuildId.mdx,generateEtags.mdx,headers.mdx,htmlLimitedBots.mdx,httpAgentOptions.mdx,images.mdx,incrementalCacheHandlerPath.mdx,inlineCss.mdx,logging.mdx,mdxRs.mdx,onDemandEntries.mdx,optimizePackageImports.mdx,output.mdx,pageExtensions.mdx,poweredByHeader.mdx,productionBrowserSourceMaps.mdx,proxyClientMaxBodySize.mdx,reactCompiler.mdx,reactMaxHeadersLength.mdx,reactStrictMode.mdx,redirects.mdx,rewrites.mdx,sassOptions.mdx,serverActions.mdx,serverComponentsHmrCache.mdx,serverExternalPackages.mdx,staleTimes.mdx,staticGeneration.mdx,taint.mdx,trailingSlash.mdx,transpilePackages.mdx,turbopack.mdx,turbopackFileSystemCache.mdx,turbopackIgnoreIssue.mdx,typedRoutes.mdx,typescript.mdx,urlImports.mdx,useLightningcss.mdx,viewTransition.mdx,webVitalsAttribution.mdx,webpack.mdx}|01-app/03-api-reference/05-config:{02-typescript.mdx,03-eslint.mdx}|01-app/03-api-reference/06-cli:{create-next-app.mdx,next.mdx}|02-pages/01-getting-started:{01-installation.mdx,02-project-structure.mdx,04-images.mdx,05-fonts.mdx,06-css.mdx,11-deploying.mdx}|02-pages/02-guides:{analytics.mdx,authentication.mdx,babel.mdx,ci-build-caching.mdx,content-security-policy.mdx,css-in-js.mdx,custom-server.mdx,debugging.mdx,draft-mode.mdx,environment-variables.mdx,forms.mdx,incremental-static-regeneration.mdx,instrumentation.mdx,internationalization.mdx,lazy-loading.mdx,mdx.mdx,multi-zones.mdx,open-telemetry.mdx,package-bundling.mdx,post-css.mdx,preview-mode.mdx,production-checklist.mdx,redirecting.mdx,sass.mdx,scripts.mdx,self-hosting.mdx,static-exports.mdx,tailwind-v3-css.mdx,third-party-libraries.mdx}|02-pages/02-guides/migrating:{app-router-migration.mdx,from-create-react-app.mdx,from-vite.mdx}|02-pages/02-guides/testing:{cypress.mdx,jest.mdx,playwright.mdx,vitest.mdx}|02-pages/02-guides/upgrading:{codemods.mdx,version-10.mdx,version-11.mdx,version-12.mdx,version-13.mdx,version-14.mdx,version-9.mdx}|02-pages/03-building-your-application/01-routing:{01-pages-and-layouts.mdx,02-dynamic-routes.mdx,03-linking-and-navigating.mdx,05-custom-app.mdx,06-custom-document.mdx,07-api-routes.mdx,08-custom-error.mdx}|02-pages/03-building-your-application/02-rendering:{01-server-side-rendering.mdx,02-static-site-generation.mdx,04-automatic-static-optimization.mdx,05-client-side-rendering.mdx}|02-pages/03-building-your-application/03-data-fetching:{01-get-static-props.mdx,02-get-static-paths.mdx,03-forms-and-mutations.mdx,03-get-server-side-props.mdx,05-client-side.mdx}|02-pages/03-building-your-application/06-configuring:{12-error-handling.mdx}|02-pages/04-api-reference:{06-edge.mdx,08-turbopack.mdx}|02-pages/04-api-reference/01-components:{font.mdx,form.mdx,head.mdx,image-legacy.mdx,image.mdx,link.mdx,script.mdx}|02-pages/04-api-reference/02-file-conventions:{instrumentation.mdx,proxy.mdx,public-folder.mdx,src-folder.mdx}|02-pages/04-api-reference/03-functions:{get-initial-props.mdx,get-server-side-props.mdx,get-static-paths.mdx,get-static-props.mdx,next-request.mdx,next-response.mdx,use-params.mdx,use-report-web-vitals.mdx,use-router.mdx,use-search-params.mdx,userAgent.mdx}|02-pages/04-api-reference/04-config/01-next-config-js:{adapterPath.mdx,allowedDevOrigins.mdx,assetPrefix.mdx,basePath.mdx,bundlePagesRouterDependencies.mdx,compress.mdx,crossOrigin.mdx,deploymentId.mdx,devIndicators.mdx,distDir.mdx,env.mdx,exportPathMap.mdx,generateBuildId.mdx,generateEtags.mdx,headers.mdx,httpAgentOptions.mdx,images.mdx,logging.mdx,onDemandEntries.mdx,optimizePackageImports.mdx,output.mdx,pageExtensions.mdx,poweredByHeader.mdx,productionBrowserSourceMaps.mdx,proxyClientMaxBodySize.mdx,reactStrictMode.mdx,redirects.mdx,rewrites.mdx,serverExternalPackages.mdx,trailingSlash.mdx,transpilePackages.mdx,turbopack.mdx,typescript.mdx,urlImports.mdx,useLightningcss.mdx,webVitalsAttribution.mdx,webpack.mdx}|02-pages/04-api-reference/04-config:{01-typescript.mdx,02-eslint.mdx}|02-pages/04-api-reference/05-cli:{create-next-app.mdx,next.mdx}|03-architecture:{accessibility.mdx,fast-refresh.mdx,nextjs-compiler.mdx,supported-browsers.mdx}|04-community:{01-contribution-guide.mdx,02-rspack.mdx}<!-- NEXT-AGENTS-MD-END -->
