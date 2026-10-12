"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import type { AdminPlan } from "@/lib/api/billing-admin";
import { buildCreatePlan, buildPriceUpdate, buildPromoInput, type NewPlanForm } from "@/lib/billing/admin-forms";
import { cadenceLabel, formatKobo, koboToNaira, promoCountdown } from "@/lib/billing/pricing";
import {
  useAdminPlans, useArchivePlan, useClearPlanPromo, useCreatePlan, useSetPlanPromo, useUpdatePlan,
} from "@/lib/hooks/useBillingAdmin";

type Editing = { id: string; mode: "price" | "promo" } | null;

/** Admin: create/re-price plans, run timed promos, retire plans. Nothing about a plan is hardcoded. */
export default function PlansAdmin() {
  const { data, isLoading, isError } = useAdminPlans();
  const [editing, setEditing] = useState<Editing>(null);
  const [creating, setCreating] = useState(false);

  if (isLoading) return <p role="status">Loading plans…</p>;
  if (isError || !data) return <p role="alert">Couldn&apos;t load plans.</p>;

  return (
    <section aria-labelledby="plans-h" className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 id="plans-h" className="font-serif text-xl text-green-900">Plans &amp; promos</h2>
        <button type="button" onClick={() => setCreating((c) => !c)} className="rounded-full bg-green-800 px-4 py-2 text-sm font-semibold text-white">
          {creating ? "Cancel" : "New plan"}
        </button>
      </div>

      {creating && <NewPlanForm onDone={() => setCreating(false)} />}

      <ul className="space-y-3">
        {data.map((p) => (
          <li key={p.id} className={`rounded-2xl border bg-white p-4 ${p.isActive ? "border-cream-border" : "border-dashed border-cream-border opacity-70"}`}>
            <PlanRow plan={p} editing={editing?.id === p.id ? editing.mode : null} setEditing={(mode) => setEditing(mode ? { id: p.id, mode } : null)} />
          </li>
        ))}
      </ul>
    </section>
  );
}

function PlanRow({ plan: p, editing, setEditing }: { plan: AdminPlan; editing: "price" | "promo" | null; setEditing: (m: "price" | "promo" | null) => void }) {
  const clearPromo = useClearPlanPromo();
  const archive = useArchivePlan();
  const eff = p.effective;
  const countdown = eff.isPromo ? promoCountdown(eff.promoEndsAt) : null;
  const isFree = p.tier === "free";

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-green-900">
            {p.name} <span className="font-mono text-xs text-green-800/60">{p.code}</span>
          </p>
          <p className="text-xs text-green-800/70">
            {p.tier}{p.interval ? ` · ${p.interval}` : ""}
            {!p.isActive && " · Retired"}
            {p.isActive && !p.isPublic && " · Unlisted"}
            {!p.isSelfServe && " · Contact sales"}
          </p>
        </div>
        <div className="text-right">
          <p className="font-serif text-lg text-green-900">
            {isFree ? "Free" : p.isSelfServe ? formatKobo(eff.amountKobo) : "Custom"}
            <span className="ml-1 text-xs text-green-800/60">{cadenceLabel(p.interval)}</span>
          </p>
          {eff.isPromo && (
            <p className="text-xs font-semibold text-green-800">
              {p.promoLabel ?? "Promo"}: {eff.discountPercent}% off (list {formatKobo(eff.listAmountKobo)}){countdown ? ` · ${countdown.label}` : ""}
            </p>
          )}
        </div>
      </div>

      {p.isActive && !isFree && p.isSelfServe && (
        <div className="mt-3 flex flex-wrap gap-2">
          <Btn onClick={() => setEditing(editing === "price" ? null : "price")}>Change price</Btn>
          {eff.isPromo ? (
            <Btn disabled={clearPromo.isPending} onClick={() => clearPromo.mutate(p.id)}>End promo now</Btn>
          ) : (
            <Btn onClick={() => setEditing(editing === "promo" ? null : "promo")}>Run a promo</Btn>
          )}
          <Btn danger disabled={archive.isPending} onClick={() => { if (window.confirm(`Retire "${p.name}"? Existing subscribers keep it; nobody new can buy it.`)) archive.mutate(p.id); }}>
            Retire
          </Btn>
        </div>
      )}

      {editing === "price" && <PriceEditor plan={p} onDone={() => setEditing(null)} />}
      {editing === "promo" && <PromoEditor plan={p} onDone={() => setEditing(null)} />}
    </>
  );
}

function PriceEditor({ plan, onDone }: { plan: AdminPlan; onDone: () => void }) {
  const update = useUpdatePlan();
  const [naira, setNaira] = useState(koboToNaira(plan.amountKobo));
  const submit = () => {
    const b = buildPriceUpdate(naira);
    if (!b.ok) return void toast.error(b.error);
    update.mutate({ id: plan.id, input: b.value }, { onSuccess: onDone });
  };
  return (
    <div className="mt-3 rounded-xl bg-cream/40 p-3">
      <label className="text-sm">
        <span className="mb-1 block font-medium">New regular price (₦)</span>
        <input aria-label="New price in naira" value={naira} onChange={(e) => setNaira(e.target.value)} inputMode="decimal" className="w-32 rounded-lg border border-cream-border px-3 py-2" />
      </label>
      <p className="mt-2 text-xs text-green-800/70">Existing subscribers keep the price they signed up at; this applies to new sign-ups.</p>
      <div className="mt-2 flex gap-2"><Btn primary onClick={submit} disabled={update.isPending}>Save price</Btn><Btn onClick={onDone}>Cancel</Btn></div>
    </div>
  );
}

function PromoEditor({ plan, onDone }: { plan: AdminPlan; onDone: () => void }) {
  const setPromo = useSetPlanPromo();
  const [f, setF] = useState({ priceNaira: "", label: "", endsAtLocal: "" });
  const submit = () => {
    const b = buildPromoInput(f, plan.amountKobo);
    if (!b.ok) return void toast.error(b.error);
    setPromo.mutate({ id: plan.id, input: b.value }, { onSuccess: onDone });
  };
  return (
    <div className="mt-3 rounded-xl bg-cream/40 p-3">
      <div className="flex flex-wrap gap-3">
        <label className="text-sm"><span className="mb-1 block font-medium">Promo price (₦)</span>
          <input aria-label="Promo price in naira" value={f.priceNaira} onChange={(e) => setF({ ...f, priceNaira: e.target.value })} inputMode="decimal" className="w-32 rounded-lg border border-cream-border px-3 py-2" /></label>
        <label className="text-sm"><span className="mb-1 block font-medium">Label (shown to customers)</span>
          <input aria-label="Promo label" value={f.label} onChange={(e) => setF({ ...f, label: e.target.value })} placeholder="Back to school" className="rounded-lg border border-cream-border px-3 py-2" /></label>
        <label className="text-sm"><span className="mb-1 block font-medium">Ends</span>
          <input aria-label="Promo ends" type="datetime-local" value={f.endsAtLocal} onChange={(e) => setF({ ...f, endsAtLocal: e.target.value })} className="rounded-lg border border-cream-border px-3 py-2" /></label>
      </div>
      <p className="mt-2 text-xs text-green-800/70">
        Regular price is {formatKobo(plan.amountKobo)}. The promo applies to a customer&apos;s <strong>first payment</strong> only; renewals
        are at the regular price. It ends by itself at the time above.
      </p>
      <div className="mt-2 flex gap-2"><Btn primary onClick={submit} disabled={setPromo.isPending}>Start promo</Btn><Btn onClick={onDone}>Cancel</Btn></div>
    </div>
  );
}

const EMPTY: NewPlanForm = { code: "", name: "", tier: "standard", interval: "monthly", priceNaira: "", featuresText: "", badge: "", isSelfServe: true, isPublic: true };

function NewPlanForm({ onDone }: { onDone: () => void }) {
  const create = useCreatePlan();
  const [f, setF] = useState<NewPlanForm>(EMPTY);
  const set = (p: Partial<NewPlanForm>) => setF((x) => ({ ...x, ...p }));
  const free = f.tier === "free";
  const submit = () => {
    const b = buildCreatePlan(f);
    if (!b.ok) return void toast.error(b.error);
    create.mutate(b.value, { onSuccess: onDone });
  };
  const input = "rounded-lg border border-cream-border px-3 py-2";
  return (
    <div className="rounded-2xl border border-green-700/30 bg-white p-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-sm"><span className="mb-1 block font-medium">Name</span><input aria-label="Plan name" className={input} value={f.name} onChange={(e) => set({ name: e.target.value })} /></label>
        <label className="text-sm"><span className="mb-1 block font-medium">Code (permanent)</span><input aria-label="Plan code" className={input} value={f.code} onChange={(e) => set({ code: e.target.value })} placeholder="standard-monthly" /></label>
        <label className="text-sm"><span className="mb-1 block font-medium">Access level</span>
          <select aria-label="Plan tier" className={input} value={f.tier} onChange={(e) => set({ tier: e.target.value as NewPlanForm["tier"] })}>
            {["free", "basic", "standard", "premium", "enterprise"].map((t) => <option key={t} value={t}>{t}</option>)}
          </select></label>
        <label className="text-sm"><span className="mb-1 block font-medium">Billing</span>
          <select aria-label="Plan interval" className={input} disabled={free} value={free ? "" : f.interval} onChange={(e) => set({ interval: e.target.value as NewPlanForm["interval"] })}>
            <option value="">—</option><option value="monthly">Monthly</option><option value="quarterly">Quarterly</option><option value="annually">Annually</option>
          </select></label>
        {!free && <label className="text-sm"><span className="mb-1 block font-medium">Price (₦)</span><input aria-label="Plan price in naira" inputMode="decimal" className={input} value={f.priceNaira} onChange={(e) => set({ priceNaira: e.target.value })} /></label>}
        <label className="text-sm"><span className="mb-1 block font-medium">Badge (optional)</span><input aria-label="Plan badge" className={input} value={f.badge} onChange={(e) => set({ badge: e.target.value })} placeholder="Most Popular" /></label>
      </div>
      <label className="mt-3 block text-sm"><span className="mb-1 block font-medium">Feature bullets (one per line)</span>
        <textarea aria-label="Plan features" rows={3} className={`${input} w-full`} value={f.featuresText} onChange={(e) => set({ featuresText: e.target.value })} /></label>
      <div className="mt-3 flex flex-wrap gap-4 text-sm">
        <label className="flex items-center gap-2"><input type="checkbox" checked={f.isSelfServe} onChange={(e) => set({ isSelfServe: e.target.checked })} /> Self-serve checkout</label>
        <label className="flex items-center gap-2"><input type="checkbox" checked={f.isPublic} onChange={(e) => set({ isPublic: e.target.checked })} /> Show on pricing page</label>
      </div>
      <p className="mt-2 text-xs text-green-800/70">The code, access level and billing interval can&apos;t be changed later (subscribers depend on them). Create a new plan instead.</p>
      <div className="mt-3"><Btn primary onClick={submit} disabled={create.isPending}>{create.isPending ? "Creating…" : "Create plan"}</Btn></div>
    </div>
  );
}

function Btn({ children, onClick, disabled, primary, danger }: { children: React.ReactNode; onClick: () => void; disabled?: boolean; primary?: boolean; danger?: boolean }) {
  const tone = primary ? "bg-green-800 text-white" : danger ? "border border-red-500 text-red-700" : "border border-green-800 text-green-800";
  return <button type="button" onClick={onClick} disabled={disabled} className={`rounded-full px-3.5 py-1.5 text-xs font-semibold disabled:opacity-40 ${tone}`}>{children}</button>;
}
