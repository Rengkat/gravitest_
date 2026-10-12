import { DEFAULT_ACCENT, normalizeHex } from "./accent";

// Server-side read of the platform accent, used by the root layout so the very
// first byte of HTML is already the right colour (no green → blue flash).
// Deliberately does not import lib/api/client (axios + the auth store are
// client-only). Falls back to the default rather than ever breaking a page
// render if the API is slow or down, including during `next build`.
export async function getServerAccent(): Promise<string> {
  const base = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api/v1";
  try {
    const res = await fetch(`${base}/platform/appearance`, {
      next: { revalidate: 60 },
      signal: AbortSignal.timeout(2500),
    });
    if (!res.ok) return DEFAULT_ACCENT;
    const data = (await res.json()) as { accentColor?: string };
    return normalizeHex(data.accentColor ?? "") ?? DEFAULT_ACCENT;
  } catch {
    return DEFAULT_ACCENT;
  }
}
