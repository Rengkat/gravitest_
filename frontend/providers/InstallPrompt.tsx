"use client";

import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";

const DISMISS_KEY = "gravitest_install_prompt_dismissed_at";
const DISMISS_COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000; // don't re-nag for a week

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const dismissedAt = Number(localStorage.getItem(DISMISS_KEY) ?? 0);
    if (Date.now() - dismissedAt < DISMISS_COOLDOWN_MS) return;

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setVisible(true);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    await deferredPrompt.userChoice; // outcome is 'accepted' | 'dismissed' — either way, don't ask again immediately
    setDeferredPrompt(null);
    setVisible(false);
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
  };

  const handleDismiss = () => {
    setVisible(false);
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
  };

  if (!visible || !deferredPrompt) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-80 z-50 bg-white rounded-2xl shadow-xl border border-gray-100 p-4 flex items-start gap-3 animate-in fade-in slide-in-from-bottom-4">
      <div className="w-10 h-10 rounded-xl bg-green-800 flex items-center justify-center shrink-0">
        <Download size={18} className="text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-semibold text-gray-900">Install Gravitest</p>
        <p className="text-[12px] text-gray-500 mt-0.5">
          Add to your home screen for faster access and a full-screen experience.
        </p>
        <div className="flex gap-2 mt-3">
          <button
            onClick={handleInstall}
            className="px-3 py-1.5 rounded-lg bg-green-800 text-white text-[12px] font-semibold hover:bg-green-700 transition-colors">
            Install
          </button>
          <button
            onClick={handleDismiss}
            className="px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 text-[12px] font-medium hover:bg-gray-50 transition-colors">
            Not now
          </button>
        </div>
      </div>
      <button
        onClick={handleDismiss}
        title="Dismiss"
        className="p-1 text-gray-400 hover:text-gray-600 shrink-0">
        <X size={14} />
      </button>
    </div>
  );
}
