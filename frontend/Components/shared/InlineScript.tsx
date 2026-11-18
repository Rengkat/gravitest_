"use client";

/**
 * THE one place in the app allowed to emit an inline <script> element.
 *
 * Why this exists: React 19 logs "Encountered a script tag while rendering React component. Scripts inside
 * React components are never executed when rendering on the client" whenever the CLIENT creates a <script>
 * element (Fast Refresh, router refresh, error recovery...). That includes next/script's beforeInteractive
 * inline mode and plain <script type="application/ld+json">.
 *
 * Inline scripts only ever need to exist in the server-rendered HTML: the browser runs them while parsing, and
 * React never has to recreate them. So we render the element on the server and nothing on the client. React 19
 * tolerates a server-rendered <script> that is a direct child of <head>/<body> that the client doesn't render,
 * and `suppressHydrationWarning` covers the contents.
 *
 * Do NOT put <script> or <Script dangerouslySetInnerHTML> anywhere else — eslint (no-restricted-syntax) and
 * Components/shared/__test__/InlineScript.test.tsx enforce this.
 *
 * It MUST stay a client component: a server component's <script> is serialised to the browser and re-created
 * there, which is the very thing that triggers the warning. The window check only works client-side.
 *
 * Keep it a direct child of <head> or <body> in the root layout (don't nest it inside other elements).
 */
export function InlineScript({ id, type, code }: { id?: string; type?: string; code: string }) {
  if (typeof window !== "undefined") return null;
  return (
    <script
      id={id}
      type={type}
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: code }}
    />
  );
}
