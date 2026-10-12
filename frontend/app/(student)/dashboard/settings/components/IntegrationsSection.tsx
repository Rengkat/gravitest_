"use client";

import { Sparkles } from "lucide-react";
import { INTEGRATIONS } from "@/lib/constants/settings";
import { Integration } from "@/types/settings";
import { SettingsCard } from "./ui";

const CATEGORY_LABELS: Record<Integration["category"], string> = {
  calendar: "Calendar",
  communication: "Communication",
  storage: "Cloud Storage",
  learning: "Learning Tools",
};

// There's no backend support for connecting/disconnecting any integration
// yet — UpdateUserSettingsDto doesn't expose connectedIntegrations at all,
// so there's nothing for a "Connect" button here to actually call. Rather
// than ship toggles that flip local state and silently do nothing, this
// is an honest "coming soon" list of what's planned.
export default function IntegrationsSection() {
  const categories = Array.from(new Set(INTEGRATIONS.map((i) => i.category)));

  return (
    <div className="space-y-5">
      <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3">
        <Sparkles size={18} className="text-amber-600 shrink-0 mt-0.5" />
        <p className="text-[13px] text-amber-800">
          <span className="font-bold">Integrations are coming soon.</span> Connecting external
          tools like Calendar, Zoom, and Drive isn't available yet — here's what's planned.
        </p>
      </div>

      {categories.map((category) => {
        const items = INTEGRATIONS.filter((i) => i.category === category);
        return (
          <SettingsCard key={category} title={CATEGORY_LABELS[category]}>
            <div className="space-y-3">
              {items.map((integration) => (
                <div
                  key={integration.id}
                  className="flex items-center justify-between p-4 rounded-xl border border-gray-100 bg-gray-50">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-11 h-11 rounded-full bg-white border border-gray-200 flex items-center justify-center shadow-sm text-2xl shrink-0 opacity-60">
                      {integration.icon}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[14px] font-bold text-gray-500">{integration.name}</p>
                      <p className="text-[12px] text-gray-400 truncate">{integration.description}</p>
                    </div>
                  </div>
                  <span className="px-3 py-1.5 rounded-xl text-[12px] font-semibold text-gray-400 bg-white border border-gray-200 shrink-0 ml-3">
                    Coming soon
                  </span>
                </div>
              ))}
            </div>
          </SettingsCard>
        );
      })}

      <div className="text-center py-6">
        <p className="text-[13px] text-gray-500">
          Want to see an integration prioritised?{" "}
          <a
            href="mailto:support@gravitest.ng?subject=Integration Request"
            className="text-green-600 font-semibold hover:text-green-700 underline underline-offset-2">
            Let us know →
          </a>
        </p>
      </div>
    </div>
  );
}
