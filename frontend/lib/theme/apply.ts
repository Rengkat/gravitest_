import { accentCss } from "./accent";
import { FONT_SCALE, type FontSizeKey, type ThemeMode } from "./appearance-store";

// Dark mode is only switched on inside the signed-in app. The marketing and
// auth pages are designed light-only, so they stay light whatever the user's
// preference is. Font size applies everywhere.
export const APP_ROUTE_PATTERN = /^\/(dashboard|admin|cbt|ai-tutor)(\/|$)/;

export function isAppRoute(pathname: string): boolean {
  return APP_ROUTE_PATTERN.test(pathname);
}

export function systemPrefersDark(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches;
}

export function applyAppearance(opts: { theme: ThemeMode; fontSize: FontSizeKey; pathname: string }) {
  const root = document.documentElement;
  const dark = opts.theme === "dark" || (opts.theme === "system" && systemPrefersDark());
  const on = dark && isAppRoute(opts.pathname);
  root.classList.toggle("dark", on);
  root.dataset.theme = on ? "dark" : "light";
  root.style.setProperty("--font-scale", String(FONT_SCALE[opts.fontSize] ?? 1));
}

export const ACCENT_STYLE_ID = "gt-accent";

/** Recolour the app right now (no reload) by rewriting the <style id="gt-accent"> tag. */
export function applyAccent(hex: string) {
  let el = document.getElementById(ACCENT_STYLE_ID) as HTMLStyleElement | null;
  if (!el) {
    el = document.createElement("style");
    el.id = ACCENT_STYLE_ID;
    document.head.appendChild(el);
  }
  const css = accentCss(hex);
  if (el.textContent !== css) el.textContent = css;
}

// Runs in <head> before first paint so a dark-mode user never sees a white
// flash and a large-text user never sees the layout jump. Keep it dependency
// free and in sync with applyAppearance() above.
export const NO_FLASH_SCRIPT = `(function(){try{var d=document.documentElement;var s=JSON.parse(localStorage.getItem('gravitest-appearance')||'null');var st=(s&&s.state)||{};var t=st.theme||'light';var f=st.fontSize||'medium';var sc=({small:0.9,medium:1,large:1.125,extra_large:1.25})[f]||1;d.style.setProperty('--font-scale',String(sc));var app=${APP_ROUTE_PATTERN.toString()}.test(location.pathname);var dark=t==='dark'||(t==='system'&&window.matchMedia('(prefers-color-scheme: dark)').matches);if(app&&dark){d.classList.add('dark');d.dataset.theme='dark';}}catch(e){}})();`;
