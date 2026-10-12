"use client";

import { useState } from "react";
import { BadgePercent } from "lucide-react";
import PlansAdmin from "@/Components/admin/billing/PlansAdmin";
import GatewaysAdmin from "@/Components/admin/billing/GatewaysAdmin";
import FeatureRulesAdmin from "@/Components/admin/billing/FeatureRulesAdmin";

const TABS = [
  {
    id: "plans",
    label: "Plans & promos",
    help: "Create and re-price plans, and run timed promotions.",
  },
  {
    id: "access",
    label: "Free vs paid",
    help: "Decide which features are free, paid, or switched off.",
  },
  {
    id: "payments",
    label: "Payment methods",
    help: "Choose which payment options customers see at checkout.",
  },
] as const;

type TabId = (typeof TABS)[number]["id"];

/** One screen for everything an admin controls about money: what plans exist, what each feature costs, how people pay. */
export default function BillingAdminClient() {
  const [tab, setTab] = useState<TabId>("plans");
  const active = TABS.find((t) => t.id === tab)!;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-500 flex items-center justify-center shadow-sm">
          <BadgePercent size={20} className="text-white" />
        </div>
        <div>
          <h1 className="font-serif text-2xl text-green-900">Plans &amp; Access</h1>
          <p className="text-text-muted text-[13px] -mt-0.5">
            Pricing, promotions, free vs paid features and payment methods
          </p>
        </div>
      </div>

      <div role="tablist" aria-label="Billing settings" className="flex flex-wrap gap-2 border-b border-cream-border">
        {TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            id={`billing-tab-${t.id}`}
            aria-selected={tab === t.id}
            aria-controls={`billing-panel-${t.id}`}
            onClick={() => setTab(t.id)}
            className={`-mb-px border-b-2 px-4 py-2.5 text-sm font-semibold transition-colors ${
              tab === t.id
                ? "border-green-700 text-green-900"
                : "border-transparent text-text-muted hover:text-green-800"
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      <p className="text-[13px] text-text-muted">{active.help}</p>

      <div role="tabpanel" id={`billing-panel-${tab}`} aria-labelledby={`billing-tab-${tab}`}>
        {tab === "plans" && <PlansAdmin />}
        {tab === "access" && <FeatureRulesAdmin />}
        {tab === "payments" && <GatewaysAdmin />}
      </div>
    </div>
  );
}
