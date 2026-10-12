"use client";

import { Fragment, useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  FileDown,
  Printer,
  Mail,
  Filter,
  X,
} from "lucide-react";
import { Transaction, TransactionStatus } from "@/types/billing";
import {
  TX_STATUS_CONFIG,
  CHANNEL_CONFIG,
  formatDate,
  formatCurrency,
  downloadInvoice,
} from "@/lib/constants/billing";
import { gatewayLabel } from "@/lib/billing/gateways";

interface TransactionHistoryProps {
  transactions: Transaction[];
  onResendReceipt: (id: string) => Promise<unknown>;
}

export default function TransactionHistory({ transactions, onResendReceipt }: TransactionHistoryProps) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [copiedRef, setCopiedRef] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<TransactionStatus | "all">("all");
  const [showFilter, setShowFilter] = useState(false);
  const [emailingId, setEmailingId] = useState<string | null>(null);
  const [emailSentId, setEmailSentId] = useState<string | null>(null);

  const filtered =
    filterStatus === "all" ? transactions : transactions.filter((t) => t.status === filterStatus);

  const copyRef = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedRef(id);
    setTimeout(() => setCopiedRef(null), 2000);
  };

  const emailReceipt = async (id: string) => {
    setEmailingId(id);
    try {
      await onResendReceipt(id);
      setEmailSentId(id);
      setTimeout(() => setEmailSentId(null), 3000);
    } catch {
      // silently fail — the button reverts to its normal state
    } finally {
      setEmailingId(null);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
        <h3 className="text-[16px] font-bold text-gray-900">Transaction History</h3>
        <div className="flex items-center gap-3">
          {filterStatus !== "all" && (
            <button
              onClick={() => setFilterStatus("all")}
              className="flex items-center gap-1 text-[12px] text-red-500 hover:text-red-600 font-semibold">
              <X size={12} /> Clear filter
            </button>
          )}
          <button
            onClick={() => setShowFilter((v) => !v)}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-[13px] font-semibold border transition-all ${
              showFilter || filterStatus !== "all"
                ? "bg-green-50 border-green-300 text-green-700"
                : "border-gray-200 text-gray-600 hover:bg-gray-50"
            }`}>
            <Filter size={14} /> Filter
          </button>
        </div>
      </div>

      {/* Filter panel */}
      {showFilter && (
        <div className="px-6 py-3 bg-gray-50 border-b border-gray-100 flex flex-wrap gap-2">
          {(["all", "paid", "failed", "refunded", "pending"] as const).map((s) => {
            const active = filterStatus === s;
            return (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className={`px-3.5 py-1.5 rounded-full text-[12px] font-bold border transition-all ${
                  active
                    ? "bg-green-600 text-white border-green-600"
                    : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
                }`}>
                {s === "all" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            );
          })}
        </div>
      )}

      {/* Table — desktop */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              {["Date", "Description", "Amount", "Status", ""].map((h) => (
                <th
                  key={h}
                  className={`px-6 py-3 text-[11px] font-bold text-gray-400 uppercase tracking-wider ${
                    h === "Amount" ? "text-right" : h === "Status" ? "text-center" : "text-left"
                  }`}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((tx) => {
              const cfg = TX_STATUS_CONFIG[tx.status];
              const StatusIcon = cfg.icon;
              const isExpanded = expanded === tx.id;

              return (
                <Fragment key={tx.id}>
                  <tr
                    className="border-b border-gray-50 hover:bg-gray-50/60 transition-colors cursor-pointer"
                    onClick={() => setExpanded(isExpanded ? null : tx.id)}>
                    <td className="px-6 py-4 text-[13px] text-gray-500 whitespace-nowrap">
                      {formatDate(tx.date)}
                    </td>
                    <td className="px-6 py-4 text-[14px] font-medium text-gray-800">
                      {tx.description}
                    </td>
                    <td className="px-6 py-4 text-[14px] font-bold text-gray-900 text-right whitespace-nowrap">
                      {formatCurrency(tx.amount)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${cfg.bgColor} ${cfg.textColor} ${cfg.borderColor}`}>
                        <StatusIcon size={11} />
                        {cfg.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="p-1.5 text-gray-400 hover:text-gray-700 transition-colors rounded-lg hover:bg-gray-100">
                        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </button>
                    </td>
                  </tr>

                  {isExpanded && (
                    <tr key={`${tx.id}-detail`} className="bg-gray-50">
                      <td colSpan={5} className="px-6 py-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                          {/* Reference */}
                          <div className="bg-white rounded-xl p-3.5 border border-gray-200">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                              {gatewayLabel(tx.gateway)} Reference
                            </p>
                            <div className="flex items-center gap-2">
                              <p className="text-[13px] font-mono text-gray-800 flex-1 truncate">
                                {tx.paystackReference}
                              </p>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  copyRef(tx.paystackReference, tx.id);
                                }}
                                className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-all">
                                {copiedRef === tx.id ? (
                                  <Check size={13} className="text-green-600" />
                                ) : (
                                  <Copy size={13} />
                                )}
                              </button>
                            </div>
                          </div>

                          {/* Card used */}
                          <div className="bg-white rounded-xl p-3.5 border border-gray-200">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                              Card Used
                            </p>
                            <p className="text-[13px] font-semibold text-gray-800">{tx.cardUsed}</p>
                          </div>

                          {/* Channel */}
                          <div className="bg-white rounded-xl p-3.5 border border-gray-200">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                              Channel
                            </p>
                            <div className="flex items-center gap-2">
                              {(() => {
                                const C = CHANNEL_CONFIG[tx.channel];
                                return <C.icon size={13} className="text-gray-500" />;
                              })()}
                              <p className="text-[13px] font-semibold text-gray-800">
                                {CHANNEL_CONFIG[tx.channel].label}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-wrap gap-3">
                          {tx.status === "paid" && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                downloadInvoice(tx);
                              }}
                              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl text-[13px] font-semibold hover:bg-green-700 transition-colors shadow-sm">
                              <FileDown size={14} /> Download Invoice
                            </button>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              window.print();
                            }}
                            className="flex items-center gap-2 px-4 py-2 border border-gray-200 text-gray-600 rounded-xl text-[13px] font-semibold hover:bg-gray-50 transition-colors">
                            <Printer size={14} /> Print
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              emailReceipt(tx.id);
                            }}
                            disabled={emailingId === tx.id}
                            className="flex items-center gap-2 px-4 py-2 border border-gray-200 text-gray-600 rounded-xl text-[13px] font-semibold hover:bg-gray-50 transition-colors disabled:opacity-60">
                            {emailingId === tx.id ? (
                              <span className="w-3.5 h-3.5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
                            ) : (
                              <Mail size={14} />
                            )}
                            {emailSentId === tx.id ? "Sent!" : "Email Receipt"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden divide-y divide-gray-100">
        {filtered.map((tx) => {
          const cfg = TX_STATUS_CONFIG[tx.status];
          const StatusIcon = cfg.icon;
          return (
            <div key={tx.id} className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-bold text-gray-800 truncate">{tx.description}</p>
                  <p className="text-[12px] text-gray-500 mt-0.5">{formatDate(tx.date)}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[15px] font-black text-gray-900">
                    {formatCurrency(tx.amount)}
                  </p>
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border mt-1 ${cfg.bgColor} ${cfg.textColor} ${cfg.borderColor}`}>
                    <StatusIcon size={9} /> {cfg.label}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <p className="text-[14px] font-semibold">No transactions found</p>
        </div>
      )}
    </div>
  );
}
