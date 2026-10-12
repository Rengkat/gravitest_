"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import type { AdminFeatureRule } from "@/lib/api/billing-admin";
import { buildFeatureRuleUpdate, freeForHours, isoToLocal, ruleToForm, type FeatureRuleForm } from "@/lib/billing/admin-forms";
import { useAdminFeatureRules, useUpdateFeatureRule } from "@/lib/hooks/useBillingAdmin";

const MODE_LABEL = { free: "Free for everyone", paid: "Paid", disabled: "Turned off" } as const;
const TIERS = ["basic", "standard", "premium", "enterprise"] as const;

/** Admin: decide, per feature, whether it's free, paid (from which plan), or off. */
export default function FeatureRulesAdmin() {
  const { data, isLoading, isError } = useAdminFeatureRules();
  if (isLoading) return <p role="status">Loading access rules…</p>;
  if (isError || !data) return <p role="alert">Couldn&apos;t load access rules.</p>;

  return (
    <section aria-labelledby="fr-h" className="space-y-4">
      <h2 id="fr-h" className="font-serif text-xl text-green-900">What&apos;s free and what&apos;s paid</h2>
      {data.map((r) => (
        <RuleCard key={r.featureKey} rule={r} />
      ))}
    </section>
  );
}

function RuleCard({ rule }: { rule: AdminFeatureRule }) {
  const save = useUpdateFeatureRule();
  const [form, setForm] = useState<FeatureRuleForm>(() => ruleToForm(rule));
  const set = (patch: Partial<FeatureRuleForm>) => setForm((f) => ({ ...f, ...patch }));

  const onSave = () => {
    const built = buildFeatureRuleUpdate(form);
    if (!built.ok) return void toast.error(built.error);
    save.mutate({ key: rule.featureKey, input: built.value });
  };

  return (
    <article className="rounded-2xl border border-cream-border bg-white p-5" aria-label={rule.label}>
      <h3 className="font-semibold text-green-900">{rule.label}</h3>
      <p className="text-sm text-green-800/70">{rule.description}</p>
      <p className="mt-1 text-xs text-green-800/60">{rule.enforcement}</p>

      <div className="mt-4 flex flex-wrap gap-4">
        <label className="text-sm">
          <span className="mb-1 block font-medium">Access</span>
          <select aria-label={`${rule.label} access`} value={form.mode} onChange={(e) => set({ mode: e.target.value as FeatureRuleForm["mode"] })} className="rounded-lg border border-cream-border px-3 py-2">
            {rule.supportedModes.map((m) => (
              <option key={m} value={m}>{MODE_LABEL[m]}</option>
            ))}
          </select>
        </label>

        {form.mode === "paid" && (
          <>
            <label className="text-sm">
              <span className="mb-1 block font-medium">Included from plan</span>
              <select aria-label={`${rule.label} minimum plan`} value={form.minTier} onChange={(e) => set({ minTier: e.target.value as FeatureRuleForm["minTier"] })} className="rounded-lg border border-cream-border px-3 py-2">
                <option value="">Choose…</option>
                {TIERS.map((t) => <option key={t} value={t}>{t[0].toUpperCase() + t.slice(1)} and above</option>)}
              </select>
            </label>

            <label className="text-sm">
              <span className="mb-1 block font-medium">Free uses for others</span>
              <input aria-label={`${rule.label} free uses`} inputMode="numeric" placeholder="none" value={form.freeQuota} onChange={(e) => set({ freeQuota: e.target.value })} className="w-24 rounded-lg border border-cream-border px-3 py-2" />
            </label>
            <label className="text-sm">
              <span className="mb-1 block font-medium">Resets</span>
              <select aria-label={`${rule.label} quota period`} value={form.quotaPeriod} onChange={(e) => set({ quotaPeriod: e.target.value as FeatureRuleForm["quotaPeriod"] })} className="rounded-lg border border-cream-border px-3 py-2">
                <option value="">—</option>
                <option value="daily">Every day</option>
                <option value="monthly">Every month</option>
              </select>
            </label>
          </>
        )}
      </div>

      {form.mode === "paid" && (
        <fieldset className="mt-4 rounded-xl bg-cream/40 p-3">
          <legend className="px-1 text-sm font-medium">Free promo (optional)</legend>
          <p className="mb-2 text-xs text-green-800/70">Open this feature to everyone until a set time. It switches back on its own.</p>
          <div className="flex flex-wrap items-center gap-2">
            {[24, 72, 168].map((h) => (
              <button key={h} type="button" onClick={() => set({ freeUntilLocal: isoToLocal(freeForHours(h)) })} className="rounded-full border border-green-800 px-3 py-1 text-xs font-semibold text-green-800">
                Free for {h === 168 ? "7 days" : `${h / 24} day${h === 24 ? "" : "s"}`}
              </button>
            ))}
            <input type="datetime-local" aria-label={`${rule.label} free until`} value={form.freeUntilLocal} onChange={(e) => set({ freeUntilLocal: e.target.value })} className="rounded-lg border border-cream-border px-2 py-1 text-sm" />
            {form.freeUntilLocal && (
              <button type="button" onClick={() => set({ freeUntilLocal: "" })} className="text-xs underline">Clear</button>
            )}
          </div>
          {rule.promoActive && <p className="mt-2 text-xs font-medium text-green-800">A free promo is running now.</p>}
        </fieldset>
      )}

      <div className="mt-4 flex items-center gap-3">
        <button type="button" onClick={onSave} disabled={save.isPending} className="rounded-full bg-green-800 px-5 py-2 text-sm font-semibold text-white disabled:opacity-50">
          {save.isPending ? "Saving…" : "Save"}
        </button>
        {rule.updatedAt && <span className="text-xs text-green-800/50">Last changed {new Date(rule.updatedAt).toLocaleString("en-NG")}</span>}
      </div>
    </article>
  );
}
