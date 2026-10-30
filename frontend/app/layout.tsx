import type { Metadata, Viewport } from "next";
import "@fontsource-variable/sora";
import "@fontsource/dm-serif-display/400.css";
import "@fontsource/dm-serif-display/400-italic.css";
import "@fontsource-variable/jetbrains-mono";
import Script from "next/script";
import { Toaster } from "react-hot-toast";
import { QueryProvider } from "@/providers/QueryProvider";
import { ServiceWorkerRegister } from "@/providers/ServiceWorkerRegister";
import { InstallPrompt } from "@/providers/InstallPrompt";
import { NetworkStatusToast } from "@/providers/NetworkStatusToast";
import { ThemeProvider } from "@/providers/ThemeProvider";
import { accentCss } from "@/lib/theme/accent";
import { NO_FLASH_SCRIPT, ACCENT_STYLE_ID } from "@/lib/theme/apply";
import { getServerAccent } from "@/lib/theme/server";
import { JsonLd, organizationJsonLd, websiteJsonLd } from "@/lib/seo/jsonld";
import {
  SITE_URL,
  SITE_NAME,
  SITE_DESCRIPTION,
  TWITTER_HANDLE,
  DEFAULT_OG_IMAGE,
} from "@/lib/seo/site";
import "./globals.css";

// Fonts are self-hosted via @fontsource (see imports above) instead of
// next/font/google. next/font/google's Turbopack loader fetches the font
// files from fonts.googleapis.com/fonts.gstatic.com at build/dev time —
// on this machine that fetch was failing (blocked port, proxy, DNS, or
// just Google being slow), and Turbopack surfaces that as a confusing
// "Module not found" / "queries have exactly one entry" error that has
// nothing to do with your code. @fontsource ships the actual woff2 files
// inside node_modules, so there's no runtime/build-time network
// dependency at all — the build can't fail this way again, in dev, CI,
// Docker, or production. The actual font-family strings are wired to
// --font-sora / --font-dm-serif / --font-jetbrains-mono in globals.css,
// so nothing downstream (Tailwind config, component classes) needs to
// change.

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),

  title: {
    default: "Gravitest - Pass JAMB, WAEC & Every Nigerian Exam",
    template: "%s | Gravitest",
  },
  description: SITE_DESCRIPTION,

  keywords: [
    "JAMB 2025",
    "WAEC preparation",
    "CBT practice Nigeria",
    "Post-UTME prep",
    "NECO past questions",
    "ICAN exam",
    "Nursing Council exam",
    "Nigerian exam prep",
    "AI tutor Nigeria",
    "Sabi-Explain",
    "exam preparation app Nigeria",
    "UTME score",
  ],

  authors: [{ name: "Gravitest Technologies Ltd", url: SITE_URL }],
  creator: "Gravitest Technologies Ltd",
  publisher: "Gravitest Technologies Ltd",

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },

  openGraph: {
    type: "website",
    locale: "en_NG",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: "Gravitest — Pass JAMB, WAEC & Every Nigerian Exam",
    description: "AI-powered CBT simulation for JAMB, WAEC, Post-UTME & professional exams.",
    images: [DEFAULT_OG_IMAGE],
  },

  twitter: {
    card: "summary_large_image",
    site: TWITTER_HANDLE,
    creator: TWITTER_HANDLE,
    title: "Gravitest — Pass JAMB, WAEC, ICAN & Every Nigerian Exam",
    description: "AI-powered CBT simulation. Works offline. Explains in Pidgin.",
    images: [DEFAULT_OG_IMAGE.url],
  },

  icons: {
    icon: [
      { url: "/icon.svg", sizes: "any" },
      { url: "/icons/icon-32.png", type: "image/png", sizes: "32x32" },
      { url: "/icons/icon-192.png", type: "image/png", sizes: "192x192" },
    ],
    apple: "/icons/apple-touch-icon.png",
    shortcut: "/favicon.ico",
  },

  manifest: "/manifest.json",
  applicationName: "Gravitest",
  category: "education",

  // Set NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION once you've added the
  // property in Google Search Console (Settings > Ownership verification
  // > HTML tag — copy just the content="..." value, not the whole tag).
  // Left unset rather than a fake placeholder so this section simply
  // doesn't render until it's real; a placeholder string here would
  // actually get shipped into <head> and fail verification confusingly.
  verification: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION
    ? { google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION }
    : undefined,

  alternates: {
    canonical: SITE_URL,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#1a4a2e" },
    { media: "(prefers-color-scheme: dark)", color: "#0d2b1a" },
  ],
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  // The admin-chosen accent colour, resolved on the server so the first paint
  // is already the right colour (cached for 60s; falls back to the default).
  const accent = await getServerAccent();

  return (
    // suppressHydrationWarning: the inline script below adds `dark` and sets
    // --font-scale on <html> before React hydrates, on purpose.
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <head>
        <style id={ACCENT_STYLE_ID} dangerouslySetInnerHTML={{ __html: accentCss(accent) }} />
      </head>
      <body className="min-h-full flex flex-col">
        {/* Theme/font "no flash" script. next/script (not a raw <script>) avoids React 19's
            "script tag while rendering" warning; beforeInteractive still runs it before hydration. */}
        <Script
          id="no-flash-theme"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: NO_FLASH_SCRIPT }}
        />
        <ThemeProvider />
        <JsonLd data={organizationJsonLd()} />
        <JsonLd data={websiteJsonLd()} />
        <QueryProvider>
          {children}
          <Toaster position="top-right" toastOptions={{ duration: 4000 }} />
        </QueryProvider>
        <ServiceWorkerRegister />
        <InstallPrompt />
        <NetworkStatusToast />
      </body>
    </html>
  );
}
