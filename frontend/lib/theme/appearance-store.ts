import { create } from "zustand";
import { persist } from "zustand/middleware";

export type ThemeMode = "light" | "dark" | "system";
// Same four values the backend's FontSize enum stores.
export type FontSizeKey = "small" | "medium" | "large" | "extra_large";

export const FONT_SCALE: Record<FontSizeKey, number> = {
  small: 0.9,
  medium: 1,
  large: 1.125,
  extra_large: 1.25,
};

export const FONT_SIZE_LABELS: Record<FontSizeKey, string> = {
  small: "Small",
  medium: "Medium",
  large: "Large",
  extra_large: "Extra large",
};

// The inline no-flash script in app/layout.tsx reads this exact key.
export const APPEARANCE_STORAGE_KEY = "gravitest-appearance";

interface Values {
  theme: ThemeMode;
  fontSize: FontSizeKey;
}

interface AppearanceState extends Values {
  /** Unsaved values shown while the user is still choosing in Settings. Never persisted. */
  preview: Partial<Values> | null;
  /** Record what the server has saved for this user (also persisted on this device). */
  commit: (v: Partial<Values>) => void;
  setPreview: (v: Partial<Values> | null) => void;
}

export const useAppearanceStore = create<AppearanceState>()(
  persist(
    (set) => ({
      theme: "light",
      fontSize: "medium",
      preview: null,
      commit: (v) => set((s) => ({ ...s, ...v })),
      setPreview: (preview) => set({ preview }),
    }),
    {
      name: APPEARANCE_STORAGE_KEY,
      partialize: (s) => ({ theme: s.theme, fontSize: s.fontSize }),
    },
  ),
);

/** What should actually be on screen: unsaved preview first, then the saved value. */
export function effectiveAppearance(s: Pick<AppearanceState, "theme" | "fontSize" | "preview">): Values {
  return { theme: s.preview?.theme ?? s.theme, fontSize: s.preview?.fontSize ?? s.fontSize };
}
