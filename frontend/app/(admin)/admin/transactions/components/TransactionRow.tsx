"use client";

import Link from "next/link";
import { Eye } from "lucide-react";
import { gatewayLabel } from "@/lib/billing/gateways";
import type { AdminTransaction } from "@/lib/api/admin-dashboard";
import { TX_STATUS_CONFIG, CHANNEL_CONFIG, TYPE_CONFIG } from "../constants";

export function TransactionRow({ transaction: t }: { transaction: AdminTransaction }) {
  const statusCfg = TX_STATUS_CONFIG[t.status as keyof typeof TX_STATUS_CONFIG] ?? TX_STATUS_CONFIG.pending;
  const channelCfg = t.channel ? CHANNEL_CONFIG[t.channel as keyof typeof CHANNEL_CONFIG] : null;
  const typeCfg = TYPE_CONFIG[t.type as keyof typeof TYPE_CONFIG];
  const StatusIcon = statusCfg.icon;
  const ChannelIcon = channelCfg?.icon;

  return (
    <div
      className="p-4 rounded-2xl bg-white border flex items-center gap-4 hover:bg-cream/20 transition-colors"
      style={{ borderColor: "rgba(30,80,50,0.08)" }}>
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: statusCfg.bg }}>
        <StatusIcon size={18} style={{ color: statusCfg.color }} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <span className="text-[14px] font-semibold text-green-900 truncate">{t.reference}</span>
          <span
            className="px-2 py-0.5 rounded-full text-[10px] font-semibold"
            style={{ background: statusCfg.bg, color: statusCfg.color }}>
            {statusCfg.label}
          </span>
        </div>
        <div className="flex items-center gap-3 text-[12px] text-text-muted flex-wrap">
          <span>{typeCfg?.label ?? t.type}</span>
          {t.description && (
            <>
              <span>·</span>
              <span className="truncate">{t.description}</span>
            </>
          )}
          {channelCfg && (
            <>
              <span>·</span>
              <span className="flex items-center gap-1">
                {ChannelIcon && <ChannelIcon size={11} />}
                {channelCfg.label}
              </span>
            </>
          )}
          {t.gateway && (
            <>
              <span>·</span>
              <span>{gatewayLabel(t.gateway)}</span>
            </>
          )}
          <span>·</span>
          <span>{new Date(t.createdAt).toLocaleDateString("en-NG")}</span>
        </div>
      </div>

      <div className="text-right shrink-0">
        <p className="text-[15px] font-bold text-green-900">₦{(t.amountKobo / 100).toLocaleString()}</p>
      </div>

      <Link
        href={`/admin/transactions/${t.id}`}
        className="p-2 rounded-lg hover:bg-green-50 transition-colors shrink-0">
        <Eye size={16} className="text-text-muted hover:text-green-600" />
      </Link>
    </div>
  );
}
