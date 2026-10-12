"use client";

import { Construction } from "lucide-react";

// Shared placeholder for settings sections with no backend behind them
// yet (Security, Notifications, Integrations, Backup) — these used to
// be full pages of toggles and password-key inputs that saved to local
// React state only and never reached the server. Rather than leave that
// illusion in place, this says so plainly. Wiring these for real means
// building actual backend features first: session/rate-limit config
// storage, a notification-preferences-by-event-type model, encrypted
// storage for third-party API keys, and a backup/restore system — none
// of which exist in the codebase today.
export default function ComingSoon({ title, description }: { title: string; description: string }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
      <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center mx-auto mb-4">
        <Construction size={24} className="text-amber-500" />
      </div>
      <h3 className="text-[16px] font-bold text-gray-900 mb-1.5">{title}</h3>
      <p className="text-[13px] text-gray-500 max-w-md mx-auto">{description}</p>
    </div>
  );
}
