"use client";

import { CheckCircle, XCircle, Clock } from "lucide-react";
import type {
  StudentSessionSummary,
  AdminTransaction,
  UserBilling,
  UserBillingSubscription,
} from "@/lib/api/admin-dashboard";
import { describeService, type ServiceTone } from "@/lib/billing/adminUserBilling";
import { Card } from "../../components/Primitives";

// ─── ACTIVITY TAB ────────────────────────────────────────────
// Built from real exam sessions — there's no unified admin-action audit
// log in the backend (login events, password changes, 2FA toggles etc
// aren't tracked anywhere queryable), so this shows what's genuinely
// recorded: practice/exam session history.
export function ActivityTab({ sessions }: { sessions: StudentSessionSummary[] }) {
  if (sessions.length === 0) {
    return (
      <Card className="p-6 text-center text-text-muted text-[14px]">
        No session activity recorded for this account yet.
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <h3 className="font-serif text-lg text-green-900 mb-4">Recent Sessions</h3>
      <div className="space-y-3">
        {sessions.map((s) => {
          const isCompleted = s.status === "completed";
          const pct = s.totalQuestions > 0 ? Math.round((s.questionsCorrect / s.totalQuestions) * 100) : 0;
          return (
            <div key={s.id} className="flex items-center gap-4 p-3 rounded-xl bg-cream/30">
              <div
                className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                  isCompleted ? "bg-green-100" : "bg-gray-100"
                }`}>
                {isCompleted ? (
                  <CheckCircle size={16} className="text-green-600" />
                ) : (
                  <Clock size={16} className="text-gray-400" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold text-green-900">
                  {s.examType ?? "Practice"} — {s.subjects.join(", ")}
                </p>
                <p className="text-[11px] text-text-muted">
                  {new Date(s.startedAt).toLocaleDateString("en-NG")} ·{" "}
                  {Math.round(s.timeSpentSeconds / 60)} min
                </p>
              </div>
              {isCompleted && (
                <span className="text-[13px] font-bold text-green-900 shrink-0">{pct}%</span>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
}

// ─── BILLING TAB ─────────────────────────────────────────────
// Plan, what each service gives this student (and why), what they bought one by
// one, and their payments — so an admin can answer "why can't they use X?"
// without opening five screens.
const STATUS_STYLE: Record<string, { color: string; bg: string; Icon: any }> = {
  success: { color: "#10b981", bg: "#10b98115", Icon: CheckCircle },
  failed: { color: "#ef4444", bg: "#ef444415", Icon: XCircle },
  pending: { color: "#f59e0b", bg: "#f59e0b15", Icon: Clock },
};

const TONE_STYLE: Record<ServiceTone, { color: string; bg: string }> = {
  good: { color: "#059669", bg: "#05966915" },
  limited: { color: "#d97706", bg: "#d9770615" },
  locked: { color: "#dc2626", bg: "#dc262615" },
  off: { color: "#6b7280", bg: "#6b728015" },
};

const naira = (kobo: number) => `₦${(kobo / 100).toLocaleString()}`;
const day = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString("en-NG") : "—");
const cap = (v: string) => v.charAt(0).toUpperCase() + v.slice(1).replace(/_/g, " ");

function SubscriptionSummary({ sub, tier }: { sub: UserBillingSubscription | null; tier: string }) {
  if (!sub) {
    return (
      <p className="text-[13px] text-text-muted">
        No active paid subscription. Effective plan: <strong className="text-green-900">{cap(tier)}</strong>.
      </p>
    );
  }
  const rows: [string, string][] = [
    ["Plan", `${cap(sub.tier)}${sub.interval ? ` · ${cap(sub.interval)}` : ""}`],
    ["Status", cap(sub.status)],
    ["Price", sub.amountKobo ? naira(sub.amountKobo) : "Free"],
    ["Started", day(sub.startedAt)],
    ["Expires", day(sub.expiresAt)],
    ["Auto-renew", sub.autoRenew ? "On" : "Off"],
    ["Paid via", sub.gateway ? cap(sub.gateway) : "—"],
  ];
  return (
    <dl className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-3">
      {rows.map(([k, v]) => (
        <div key={k}>
          <dt className="text-[11px] uppercase tracking-wide text-text-muted">{k}</dt>
          <dd className="text-[13px] font-semibold text-green-900">{v}</dd>
        </div>
      ))}
    </dl>
  );
}

function TransactionList({ transactions }: { transactions: AdminTransaction[] }) {
  if (transactions.length === 0) {
    return <p className="text-[13px] text-text-muted">No payments recorded for this account.</p>;
  }
  return (
    <div className="space-y-3">
      {transactions.map((t) => {
        const style = STATUS_STYLE[t.status] ?? STATUS_STYLE.pending;
        const Icon = style.Icon;
        return (
          <div key={t.id} className="flex items-center gap-4 p-3 rounded-xl bg-cream/30">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: style.bg }}>
              <Icon size={16} style={{ color: style.color }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold text-green-900 truncate">
                {t.description ?? t.type} · {t.reference}
              </p>
              <p className="text-[11px] text-text-muted">
                {new Date(t.createdAt).toLocaleDateString("en-NG")}
                {t.gateway ? ` · ${cap(t.gateway)}` : ""}
                {t.channel ? ` · ${t.channel}` : ""} · {cap(t.status)}
              </p>
            </div>
            <span className="text-[13px] font-bold text-green-900 shrink-0">{naira(t.amountKobo)}</span>
          </div>
        );
      })}
    </div>
  );
}

export function BillingTab({
  billing,
  billingFailed,
  transactions,
}: {
  billing: UserBilling | null;
  billingFailed: boolean;
  transactions: AdminTransaction[];
}) {
  // The summary endpoint failed: say so, and still show whatever payments we could load.
  if (!billing) {
    return (
      <div className="space-y-4">
        {billingFailed && (
          <Card className="p-4">
            <p role="alert" className="text-[13px] text-amber-700">
              Couldn&apos;t load this student&apos;s plan and access details. Showing payments only.
            </p>
          </Card>
        )}
        <Card className="p-6">
          <h3 className="font-serif text-lg text-green-900 mb-4">Payment History</h3>
          <TransactionList transactions={transactions} />
        </Card>
      </div>
    );
  }

  const previous = billing.history.filter((h) => h.id !== billing.subscription?.id);

  return (
    <div className="space-y-4">
      <Card className="p-6">
        <h3 className="font-serif text-lg text-green-900 mb-4">Subscription</h3>
        <SubscriptionSummary sub={billing.subscription} tier={billing.tier} />
        {previous.length > 0 && (
          <div className="mt-5 border-t border-cream-border pt-4">
            <p className="text-[11px] uppercase tracking-wide text-text-muted mb-2">Previous plans</p>
            <ul className="space-y-1.5">
              {previous.map((h) => (
                <li key={h.id} className="text-[12.5px] text-green-900">
                  {cap(h.tier)}
                  {h.interval ? ` · ${cap(h.interval)}` : ""} — {cap(h.status)} ({day(h.startedAt)} → {day(h.expiresAt)})
                </li>
              ))}
            </ul>
          </div>
        )}
      </Card>

      <Card className="p-6">
        <h3 className="font-serif text-lg text-green-900 mb-1">Access to each service</h3>
        <p className="text-[12px] text-text-muted mb-4">
          What this student can use right now, under the rules set in Plans &amp; Access.
        </p>
        <div className="space-y-2">
          {billing.services.map((s) => {
            const d = describeService(s);
            const tone = TONE_STYLE[d.tone];
            return (
              <div key={s.feature} className="flex items-center justify-between gap-4 p-3 rounded-xl bg-cream/30">
                <span className="text-[13px] font-semibold text-green-900">{s.label}</span>
                <span
                  className="text-[12px] font-semibold px-2.5 py-1 rounded-full shrink-0"
                  style={{ color: tone.color, background: tone.bg }}>
                  {d.text}
                </span>
              </div>
            );
          })}
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="font-serif text-lg text-green-900 mb-1">Library items bought separately</h3>
        <p className="text-[12px] text-text-muted mb-4">Bought one by one — these never depend on their subscription.</p>
        {billing.purchases.length === 0 ? (
          <p className="text-[13px] text-text-muted">Nothing bought individually.</p>
        ) : (
          <ul className="space-y-2">
            {billing.purchases.map((p) => (
              <li key={p.contentId} className="flex items-center justify-between gap-4 p-3 rounded-xl bg-cream/30">
                <div className="min-w-0">
                  <p className="text-[13px] font-semibold text-green-900 truncate">{p.title}</p>
                  <p className="text-[11px] text-text-muted">
                    {cap(p.contentType)} · bought {day(p.purchasedAt)}
                    {p.expiresAt ? ` · ${p.expired ? "expired" : "expires"} ${day(p.expiresAt)}` : ""}
                  </p>
                </div>
                {p.priceKobo ? (
                  <span className="text-[13px] font-bold text-green-900 shrink-0">{naira(p.priceKobo)}</span>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card className="p-6">
        <h3 className="font-serif text-lg text-green-900 mb-4">Payment History</h3>
        <TransactionList transactions={billing.transactions} />
      </Card>
    </div>
  );
}
