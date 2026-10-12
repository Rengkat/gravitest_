"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useAuthStore } from "@/lib/store/authStore";
import { effectiveAppearance, useAppearanceStore } from "@/lib/theme/appearance-store";
import { applyAccent, applyAppearance } from "@/lib/theme/apply";
import { normalizeHex } from "@/lib/theme/accent";
import { getSettings } from "@/lib/api/settings";
import { getPlatformAppearance } from "@/lib/api/platform";

const ACCENT_REFRESH_MS = 60_000;

export function ThemeProvider() {
  const pathname = usePathname();
  const theme = useAppearanceStore((s) => effectiveAppearance(s).theme);
  const fontSize = useAppearanceStore((s) => effectiveAppearance(s).fontSize);
  const userId = useAuthStore((s) => s.user?.id);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  // Put the current preference on <html>. Re-runs on every route change
  // because dark mode only applies inside the signed-in app (see apply.ts).
  useEffect(() => {
    applyAppearance({ theme, fontSize, pathname });
    if (theme !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => applyAppearance({ theme, fontSize, pathname });
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [theme, fontSize, pathname]);

  // The server copy wins across devices: after sign-in, pull this user's saved
  // theme and font size. getSettings() commits them into the store.
  useEffect(() => {
    if (!isAuthenticated || !userId) return;
    getSettings().catch(() => {
      /* keep whatever this device already had */
    });
  }, [isAuthenticated, userId]);

  // Pick up an admin's accent change in already-open tabs without a reload.
  useEffect(() => {
    let last = 0;
    const refresh = () => {
      if (Date.now() - last < ACCENT_REFRESH_MS) return;
      last = Date.now();
      getPlatformAppearance()
        .then((a) => {
          const hex = normalizeHex(a.accentColor);
          if (hex) applyAccent(hex);
        })
        .catch(() => {});
    };
    refresh();
    const onVisible = () => document.visibilityState === "visible" && refresh();
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, []);

  return null;
}
