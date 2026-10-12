"use client";

import { useState } from "react";
import { FileDown, Download, Printer, Mail } from "lucide-react";
import { formatDate, formatCurrency, downloadInvoice } from "@/lib/constants/billing";
import type { Transaction } from "@/types/billing";

interface InvoicesSectionProps {
  transactions: Transaction[];
  onResendReceipt: (id: string) => Promise<unknown>;
}

export default function InvoicesSection({ transactions, onResendReceipt }: InvoicesSectionProps) {
  const paid = transactions.filter((t) => t.status === "paid");
  const [emailingId, setEmailingId] = useState<string | null>(null);

  const emailReceipt = async (id: string) => {
    setEmailingId(id);
    try {
      await onResendReceipt(id);
    } finally {
      setEmailingId(null);
    }
  };

  if (paid.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center">
            <FileDown size={18} className="text-amber-600" />
          </div>
          <div>
            <h3 className="text-[16px] font-bold text-gray-900">Invoices & Receipts</h3>
            <p className="text-[12px] text-gray-500">
              {paid.length} invoice{paid.length !== 1 ? "s" : ""} available
            </p>
          </div>
        </div>
        <button
          onClick={() => paid.forEach(downloadInvoice)}
          className="flex items-center gap-2 px-4 py-2 border border-gray-200 text-gray-600 rounded-xl text-[13px] font-semibold hover:bg-gray-50 transition-colors">
          <Download size={14} /> Download All
        </button>
      </div>

      <div className="space-y-2">
        {paid.map((tx) => (
          <div
            key={tx.id}
            className="flex items-center justify-between py-3 px-4 bg-gray-50 rounded-xl border border-gray-100 hover:bg-white hover:border-gray-200 transition-all group">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center shrink-0">
                <FileDown size={14} className="text-gray-500" />
              </div>
              <div className="min-w-0">
                <p className="text-[13px] font-semibold text-gray-800 truncate">{tx.description}</p>
                <p className="text-[11px] text-gray-400">
                  {tx.paystackReference} · {formatDate(tx.date)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 shrink-0 ml-4">
              <p className="text-[14px] font-bold text-gray-900">{formatCurrency(tx.amount)}</p>
              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => downloadInvoice(tx)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white rounded-lg text-[12px] font-semibold hover:bg-green-700 transition-colors">
                  <Download size={12} /> PDF
                </button>
                <button
                  onClick={() => window.print()}
                  className="p-1.5 border border-gray-200 text-gray-500 rounded-lg hover:bg-gray-100 transition-colors"
                  title="Print">
                  <Printer size={13} />
                </button>
                <button
                  onClick={() => emailReceipt(tx.id)}
                  disabled={emailingId === tx.id}
                  className="p-1.5 border border-gray-200 text-gray-500 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-60"
                  title="Email receipt">
                  <Mail size={13} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
