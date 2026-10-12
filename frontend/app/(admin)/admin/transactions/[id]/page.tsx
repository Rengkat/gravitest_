"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  RotateCcw,
  Loader2,
  AlertTriangle,
  CreditCard,
  User,
  Clock,
  Receipt,
} from "lucide-react";
import * as adminApi from "@/lib/api/admin-dashboard";
import { extractErrorMessage } from "@/lib/api/client";
import { gatewayLabel } from "@/lib/billing/gateways";
import { TX_STATUS_CONFIG, CHANNEL_CONFIG, TYPE_CONFIG } from "../constants";

// This used to be 11 separate components (fraud risk score, webhook
// retry log, admin activity log, a refund panel that called a fake API)
// — none of that has any backend support: no fraud scoring anywhere in
// the codebase, no webhook-attempt history stored, no admin-action audit
// log, and no refund-initiation endpoint (refunds go through the
// Paystack dashboard directly today). Consolidated into one page
// showing what's real: the transaction record, the paying customer, and
// the one working action — re-verifying a stuck transaction against
// Paystack.
export default function TransactionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [txn, setTxn] = useState<Awaited<ReturnType<typeof adminApi.getTransaction>> | null>(null);
  const [customer, setCustomer] = useState<adminApi.AdminUserDetail | null>(null);
  const [related, setRelated] = useState<adminApi.AdminTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    adminApi
      .getTransaction(id)
      .then(async (t) => {
        if (cancelled) return;
        setTxn(t);
        const [cust, relatedTxns] = await Promise.allSettled([
          adminApi.getUser(t.userId),
          adminApi.listTransactions({ search: t.userId, limit: 6, sortBy: "createdAt", sortOrder: "DESC" }),
        ]);
        if (cancelled) return;
        if (cust.status === "fulfilled") setCustomer(cust.value);
        if (relatedTxns.status === "fulfilled") {
          setRelated(relatedTxns.value.data.filter((r) => r.id !== t.id));
        }
      })
      .catch((err) => setError(extractErrorMessage(err)))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [id]);

  async function handleVerify() {
    setVerifying(true);
    setVerifyError(null);
    try {
      const updated = await adminApi.reverifyTransaction(id);
      setTxn((prev) => (prev ? { ...prev, ...updated } : prev));
    } catch (err) {
      setVerifyError(extractErrorMessage(err));
    } finally {
      setVerifying(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 size={28} className="animate-spin text-green-800" />
      </div>
    );
  }

  if (error || !txn) {
    return (
      <div className="max-w-2xl mx-auto py-24 text-center">
        <AlertTriangle size={32} className="mx-auto mb-3 text-red-400" />
        <p className="text-text-muted mb-4">
          Couldn&apos;t load this transaction{error ? ` (${error})` : ""}.
        </p>
        <button
          onClick={() => router.push("/admin/transactions")}
          className="px-4 py-2 bg-green-800 text-white rounded-lg hover:bg-green-700">
          Back to Transactions
        </button>
      </div>
    );
  }

  const statusCfg = TX_STATUS_CONFIG[txn.status as keyof typeof TX_STATUS_CONFIG] ?? TX_STATUS_CONFIG.pending;
  const channelCfg = txn.channel ? CHANNEL_CONFIG[txn.channel as keyof typeof CHANNEL_CONFIG] : null;
  const typeCfg = TYPE_CONFIG[txn.type as keyof typeof TYPE_CONFIG];
  const StatusIcon = statusCfg.icon;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <button
        onClick={() => router.push("/admin/transactions")}
        className="flex items-center gap-2 text-text-muted hover:text-green-800 transition-colors">
        <ArrowLeft size={18} />
        <span className="text-[14px] font-medium">Back to Transactions</span>
      </button>

      {/* Header */}
      <div className="bg-white rounded-2xl border p-6" style={{ borderColor: "rgba(30,80,50,0.08)" }}>
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: statusCfg.bg }}>
              <StatusIcon size={26} style={{ color: statusCfg.color }} />
            </div>
            <div>
              <h1 className="font-serif text-2xl text-green-900">{txn.reference}</h1>
              <p className="text-[13px] text-text-muted">{typeCfg?.label ?? txn.type}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-green-900">₦{(txn.amountKobo / 100).toLocaleString()}</p>
            <span
              className="inline-block px-2.5 py-1 rounded-full text-[11px] font-semibold mt-1"
              style={{ background: statusCfg.bg, color: statusCfg.color }}>
              {statusCfg.label}
            </span>
          </div>
        </div>

        {(txn.status === "pending" || txn.status === "failed") && (
          <div className="mt-5 pt-5 border-t" style={{ borderColor: "rgba(30,80,50,0.08)" }}>
            {verifyError && <p className="text-[13px] text-red-600 font-medium mb-3">{verifyError}</p>}
            <button
              onClick={handleVerify}
              disabled={verifying}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-green-800 text-white text-[13px] font-semibold hover:bg-green-700 transition-all disabled:opacity-50">
              {verifying ? <Loader2 size={15} className="animate-spin" /> : <RotateCcw size={15} />}
              {verifying ? `Checking with ${gatewayLabel(txn.gateway)}…` : `Re-verify with ${gatewayLabel(txn.gateway)}`}
            </button>
            <p className="text-[11px] text-text-muted mt-2">
              Manually re-checks this transaction against {gatewayLabel(txn.gateway)} in case a webhook was missed.
            </p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Payment details */}
          <div className="bg-white rounded-2xl border p-6" style={{ borderColor: "rgba(30,80,50,0.08)" }}>
            <div className="flex items-center gap-2 mb-4">
              <CreditCard size={18} className="text-green-700" />
              <h3 className="font-serif text-lg text-green-900">Payment Details</h3>
            </div>
            <div className="grid grid-cols-2 gap-4 text-[13px]">
              <Field label="Reference" value={txn.reference} />
              {(txn.gatewayReference ?? txn.paystackReference) && (
                <Field label={`${gatewayLabel(txn.gateway)} Reference`} value={(txn.gatewayReference ?? txn.paystackReference) as string} />
              )}
              <Field label="Channel" value={channelCfg?.label ?? "—"} />
              {txn.cardType && <Field label="Card" value={`${txn.cardType} •••• ${txn.cardLast4}`} />}
              {txn.bank && <Field label="Bank" value={txn.bank} />}
              <Field label="Currency" value={txn.currency} />
              {txn.purpose && <Field label="Purpose" value={txn.purpose} />}
              {txn.gatewayMessage && <Field label="Gateway Message" value={txn.gatewayMessage} />}
            </div>
          </div>

          {/* Timeline */}
          <div className="bg-white rounded-2xl border p-6" style={{ borderColor: "rgba(30,80,50,0.08)" }}>
            <div className="flex items-center gap-2 mb-4">
              <Clock size={18} className="text-green-700" />
              <h3 className="font-serif text-lg text-green-900">Timeline</h3>
            </div>
            <div className="space-y-3">
              <TimelineRow label="Created" date={txn.createdAt} />
              {txn.paidAt && <TimelineRow label="Paid" date={txn.paidAt} />}
            </div>
          </div>

          {/* Related transactions */}
          {related.length > 0 && (
            <div className="bg-white rounded-2xl border p-6" style={{ borderColor: "rgba(30,80,50,0.08)" }}>
              <div className="flex items-center gap-2 mb-4">
                <Receipt size={18} className="text-green-700" />
                <h3 className="font-serif text-lg text-green-900">This Customer&apos;s Other Transactions</h3>
              </div>
              <div className="space-y-2">
                {related.map((r) => {
                  const cfg = TX_STATUS_CONFIG[r.status as keyof typeof TX_STATUS_CONFIG] ?? TX_STATUS_CONFIG.pending;
                  return (
                    <button
                      key={r.id}
                      onClick={() => router.push(`/admin/transactions/${r.id}`)}
                      className="w-full flex items-center justify-between p-3 rounded-xl bg-cream/30 hover:bg-cream/60 transition-colors text-left">
                      <div>
                        <p className="text-[13px] font-semibold text-green-900">{r.reference}</p>
                        <p className="text-[11px] text-text-muted">
                          {new Date(r.createdAt).toLocaleDateString("en-NG")}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[13px] font-bold text-green-900">
                          ₦{(r.amountKobo / 100).toLocaleString()}
                        </p>
                        <span className="text-[10px] font-semibold" style={{ color: cfg.color }}>
                          {cfg.label}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Customer */}
        <div>
          <div className="bg-white rounded-2xl border p-6" style={{ borderColor: "rgba(30,80,50,0.08)" }}>
            <div className="flex items-center gap-2 mb-4">
              <User size={18} className="text-green-700" />
              <h3 className="font-serif text-lg text-green-900">Customer</h3>
            </div>
            {customer ? (
              <div className="space-y-3 text-[13px]">
                <Field label="Name" value={customer.fullName} />
                <Field label="Email" value={customer.email} />
                {customer.phoneNumber && <Field label="Phone" value={customer.phoneNumber} />}
                <Field label="Role" value={customer.role.replace("_", " ")} />
                <button
                  onClick={() => router.push(`/admin/users/${customer.id}`)}
                  className="w-full mt-2 py-2 rounded-lg bg-green-800 text-white text-[12px] font-semibold hover:bg-green-700 transition-all">
                  View Full Profile →
                </button>
              </div>
            ) : (
              <p className="text-[13px] text-text-muted">Customer details unavailable.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] text-text-muted uppercase tracking-wide mb-0.5">{label}</p>
      <p className="font-semibold text-green-900 break-words">{value}</p>
    </div>
  );
}

function TimelineRow({ label, date }: { label: string; date: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-2 h-2 rounded-full bg-green-600 shrink-0" />
      <div>
        <p className="text-[13px] font-semibold text-green-900">{label}</p>
        <p className="text-[11px] text-text-muted">
          {new Date(date).toLocaleString("en-NG")}
        </p>
      </div>
    </div>
  );
}
