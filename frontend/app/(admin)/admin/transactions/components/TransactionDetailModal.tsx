"use client";

import { useState } from "react";
import {
  X,
  Copy,
  ExternalLink,
  RotateCcw,
  Flag,
  BadgeCheck,
  CreditCard,
  MapPin,
  Monitor,
  Calendar,
  Hash,
  Receipt,
} from "lucide-react";
import type { Transaction } from "../types";
import { gatewayLabel } from "@/lib/billing/gateways";
import { TX_STATUS_CONFIG, CHANNEL_CONFIG, REVENUE_TYPE_CONFIG, PLAN_CONFIG } from "../constants";
import { StatusPill, Badge, fmt } from "./Primitives";

interface Props {
  tx: Transaction;
  onClose: () => void;
  onRefund: (
    id: string,
    amount?: number,
    reason?: string,
  ) => Promise<{ success: boolean; refundReference: string }>;
  onFlag: (id: string) => Promise<void>;
}

export function TransactionDetailModal({ tx, onClose, onRefund, onFlag }: Props) {
  const [showRefundForm, setShowRefundForm] = useState(false);
  const [refundAmount, setRefundAmount] = useState(String(tx.amount));
  const [refundReason, setRefundReason] = useState("");
  const [processing, setProcessing] = useState(false);
  const [refundSuccess, setRefundSuccess] = useState<string | null>(null);

  const statusCfg = TX_STATUS_CONFIG[tx.status];
  const channelCfg = CHANNEL_CONFIG[tx.channel];
  const copy = (val: string) => navigator.clipboard?.writeText(val);

  const handleRefund = async () => {
    if (!refundReason.trim()) return;
    setProcessing(true);
    const res = await onRefund(tx.id, parseFloat(refundAmount), refundReason);
    setProcessing(false);
    if (res.success) {
      setRefundSuccess(res.refundReference);
      setShowRefundForm(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
      onClick={onClose}>
      <div
        className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div
          className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between rounded-t-2xl z-10"
          style={{ borderColor: "rgba(30,80,50,0.08)" }}>
          <div>
            <h3 className="font-serif text-xl text-green-900">Transaction Details</h3>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="font-mono text-[12px] text-text-muted">{tx.reference}</span>
              <button
                title="refrence"
                onClick={() => copy(tx.reference)}
                className="text-text-muted hover:text-green-700">
                <Copy size={12} />
              </button>
            </div>
          </div>
          <button title='close' onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Amount hero */}
          <div className="p-5 rounded-2xl bg-green-800 text-white">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-[13px] text-white/70 mb-1">{tx.description}</div>
                <div className="text-3xl font-bold">{fmt(tx.amount)}</div>
                <div className="flex items-center gap-4 mt-2 text-[12px] text-white/70">
                  <span>Fee: {fmt(tx.fee)}</span>
                  <span>
                    Net: <span className="text-white font-semibold">{fmt(tx.netAmount)}</span>
                  </span>
                </div>
              </div>
              <StatusPill label={statusCfg.label} bg="rgba(255,255,255,0.15)" text="#fff" />
            </div>
          </div>

          {/* Refund success banner */}
          {refundSuccess && (
            <div className="p-4 rounded-xl bg-green-50 border border-green-200 flex items-center gap-3">
              <BadgeCheck size={20} className="text-green-600 shrink-0" />
              <div>
                <div className="text-[13px] font-semibold text-green-900">
                  Refund processed successfully
                </div>
                <div className="text-[12px] text-text-muted font-mono">{refundSuccess}</div>
              </div>
            </div>
          )}

          {/* Two-col detail grid */}
          <div className="grid grid-cols-2 gap-4">
            <DetailCard title="Customer">
              <DetailRow label="Name" value={tx.userName} />
              <DetailRow label="Email" value={tx.userEmail} />
              <DetailRow label="Role" value={tx.userRole.replace("_", " ")} capitalize />
            </DetailCard>

            <DetailCard title="Payment">
              <DetailRow label="Channel" value={channelCfg.label} />
              <DetailRow label="Card" value={tx.cardUsed ?? "—"} />
              <DetailRow label="Bank" value={tx.bankName ?? "—"} />
              {tx.planType && (
                <DetailRow label="Plan" value={PLAN_CONFIG[tx.planType]?.label ?? tx.planType} />
              )}
            </DetailCard>

            <DetailCard title="References">
              <DetailRowCopy label="Reference" value={tx.reference} onCopy={copy} />
              <DetailRowCopy
                label={`${gatewayLabel(tx.gateway)} Ref`}
                value={tx.gatewayReference ?? tx.paystackReference ?? "—"}
                onCopy={copy}
              />
              {tx.flutterwaveReference && (
                <DetailRowCopy label="Flutterwave" value={tx.flutterwaveReference} onCopy={copy} />
              )}
            </DetailCard>

            <DetailCard title="Session">
              <DetailRow label="Date" value={tx.date} />
              <DetailRow label="IP" value={tx.ipAddress ?? "—"} mono />
              <DetailRow label="Location" value={tx.location ?? "—"} />
              <DetailRow label="Device" value={tx.deviceInfo ?? "—"} />
            </DetailCard>
          </div>

          {/* Risk flags */}
          {(tx.isFraudulent || tx.isDisputed) && (
            <div className="p-4 rounded-xl bg-red-50 border border-red-200 space-y-1">
              {tx.isFraudulent && (
                <div className="text-[13px] font-semibold text-red-600">
                  ⚠ Flagged as potentially fraudulent
                </div>
              )}
              {tx.isDisputed && (
                <div className="text-[13px] font-semibold text-yellow-700">
                  ⚠ Transaction is disputed
                </div>
              )}
            </div>
          )}

          {/* Refund info */}
          {tx.refundStatus !== "none" && (
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200">
              <div className="text-[13px] font-semibold text-amber-800 mb-2">
                Refund Information
              </div>
              <div className="grid grid-cols-2 gap-2 text-[12px]">
                <span className="text-text-muted">Status</span>
                <span className="font-semibold text-amber-800 capitalize">{tx.refundStatus}</span>
                {tx.refundAmount && (
                  <>
                    <span className="text-text-muted">Amount</span>
                    <span className="font-semibold">{fmt(tx.refundAmount)}</span>
                  </>
                )}
                {tx.refundDate && (
                  <>
                    <span className="text-text-muted">Date</span>
                    <span>{tx.refundDate}</span>
                  </>
                )}
                {tx.refundReason && (
                  <>
                    <span className="text-text-muted">Reason</span>
                    <span>{tx.refundReason}</span>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Refund form */}
          {showRefundForm && (
            <div
              className="p-4 rounded-xl bg-cream border"
              style={{ borderColor: "rgba(30,80,50,0.1)" }}>
              <h4 className="text-[14px] font-semibold text-green-900 mb-4">Issue Refund</h4>
              <div className="space-y-3">
                <div>
                  <label className="block text-[12px] font-semibold text-green-900 mb-1">
                    Amount (₦)
                  </label>
                  <input title='refound'
                    type="number"
                    value={refundAmount}
                    onChange={(e) => setRefundAmount(e.target.value)}
                    max={tx.amount}
                    min={1}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-[14px] focus:outline-none focus:ring-2 focus:ring-green-500/30"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-semibold text-green-900 mb-1">
                    Reason *
                  </label>
                  <select  title='refound reason'
                    value={refundReason}
                    onChange={(e) => setRefundReason(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-[13px] focus:outline-none focus:ring-2 focus:ring-green-500/30">
                    <option value="">Select reason…</option>
                    <option value="Customer request">Customer request</option>
                    <option value="Duplicate charge">Duplicate charge</option>
                    <option value="Service not delivered">Service not delivered</option>
                    <option value="Card dispute">Card dispute</option>
                    <option value="Admin correction">Admin correction</option>
                  </select>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowRefundForm(false)}
                    className="flex-1 py-2.5 rounded-xl border border-gray-200 text-[13px] font-semibold text-text-muted hover:bg-gray-50 transition-all">
                    Cancel
                  </button>
                  <button
                    onClick={handleRefund}
                    disabled={processing || !refundReason}
                    className="flex-1 py-2.5 rounded-xl bg-amber-500 text-white font-semibold hover:bg-amber-600 transition-all text-[13px] disabled:opacity-50">
                    {processing ? "Processing…" : "Confirm Refund"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 flex-wrap">
            {tx.invoiceUrl && (
              <a
                href={tx.invoiceUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-gray-200 text-[13px] text-text-muted hover:bg-cream transition-colors">
                <Receipt size={14} /> Invoice
              </a>
            )}
            {tx.status === "paid" && !showRefundForm && tx.refundStatus === "none" && (
              <button
                onClick={() => setShowRefundForm(true)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-amber-50 border border-amber-200 text-[13px] text-amber-700 hover:bg-amber-100 transition-colors">
                <RotateCcw size={14} /> Refund
              </button>
            )}
            <button
              onClick={() => onFlag(tx.id)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg border text-[13px] transition-colors ${
                tx.isFraudulent
                  ? "bg-red-50 border-red-200 text-red-600"
                  : "border-gray-200 text-text-muted hover:bg-red-50"
              }`}>
              <Flag size={14} />
              {tx.isFraudulent ? "Unflag" : "Flag Fraud"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function DetailCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="p-4 rounded-xl bg-cream/40">
      <h4 className="text-[12px] font-bold text-green-900 uppercase tracking-wide mb-3">{title}</h4>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function DetailRow({
  label,
  value,
  mono = false,
  capitalize = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
  capitalize?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-[11px] text-text-muted shrink-0">{label}</span>
      <span
        className={`text-[12px] font-semibold text-green-900 text-right truncate ${mono ? "font-mono" : ""} ${capitalize ? "capitalize" : ""}`}>
        {value}
      </span>
    </div>
  );
}

function DetailRowCopy({
  label,
  value,
  onCopy,
}: {
  label: string;
  value: string;
  onCopy: (v: string) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-[11px] text-text-muted shrink-0">{label}</span>
      <div className="flex items-center gap-1">
        <span className="font-mono text-[11px] text-green-900 truncate max-w-[140px]">{value}</span>
        {value !== "—" && (
          <button title='copy'
            onClick={() => onCopy(value)}
            className="text-text-muted hover:text-green-700 transition-colors shrink-0">
            <Copy size={10} />
          </button>
        )}
      </div>
    </div>
  );
}
