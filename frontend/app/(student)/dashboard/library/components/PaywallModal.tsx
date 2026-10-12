"use client";

import { useState } from "react";
import { X, Crown, Lock, Check } from "lucide-react";
import { LibraryItem } from "@/types/library";
import { formatPrice } from "@/lib/constants/helpers";
import type { PaymentGatewayCode } from "@/lib/api/billing";
import { usePaymentGateways, usePlans } from "@/lib/hooks/useBilling";
import { lowestPerMonthKobo } from "@/lib/billing/pricing-page";
import { formatKobo } from "@/lib/billing/pricing";
import GatewayPicker, { defaultGateway } from "@/Components/billing/GatewayPicker";

interface PaywallModalProps {
  item: LibraryItem;
  onClose: () => void;
  onUpgrade: () => void;
  /** Receives the payment method the buyer chose (undefined = server default). */
  onBuySingle?: (gateway?: PaymentGatewayCode) => void;
}

const PLAN_PERKS = [
  "Unlimited access to all premium resources",
  "Download PDFs for offline study",
  "HD masterclass video tutorials",
  "Exclusive past question banks with solutions",
  "New content added weekly",
];

/**
 * Only offers what can ACTUALLY unlock this item:
 *  - "purchase" items are sold one by one — a subscription does not include
 *    them, so no "Upgrade" button (that would take money and still leave it locked).
 *  - "subscription" items are unlocked by a plan — no "Buy this resource".
 */
export default function PaywallModal({ item, onClose, onUpgrade, onBuySingle }: PaywallModalProps) {
  // The "from ₦X/mo" figure and the payment methods come from what the admin
  // has configured — never hardcoded, so a promo or price change shows up here.
  const { data: plans } = usePlans();
  const { data: gatewayList } = usePaymentGateways();
  const gateways = gatewayList ?? [];
  const [picked, setPicked] = useState<PaymentGatewayCode | null>(null);
  const gateway = picked && gateways.some((g) => g.code === picked) ? picked : defaultGateway(gateways);
  const fromKobo = plans ? lowestPerMonthKobo(plans) : null;

  // accessModel is set by the server. If an older server didn't send it, offer
  // both routes rather than guess wrong.
  const model = item.accessModel;
  const sold = model === "purchase";
  const canBuy = model !== "subscription" && !!item.price && !!onBuySingle;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md relative overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-br from-amber-500 to-orange-500 p-6 text-white relative overflow-hidden">
          <div className="absolute -top-6 -right-6 w-32 h-32 bg-white/10 rounded-full" />
          <button
            title="close"
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-white/20 hover:bg-white/30 transition-colors">
            <X size={16} />
          </button>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <Lock size={20} />
            </div>
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider opacity-80">
                {sold ? "Sold separately" : "Premium Content"}
              </div>
              <div className="text-lg font-bold">Unlock Required</div>
            </div>
          </div>
          <p className="text-[13px] text-amber-100 line-clamp-2 font-medium">{item.title}</p>
        </div>

        {/* Body */}
        <div className="p-6">
          {sold ? (
            <p className="text-[13px] text-gray-600 mb-6">
              This resource is bought individually, so a subscription doesn&apos;t include it. Pay once to keep it.
            </p>
          ) : (
            <>
              <p className="text-[13px] text-gray-600 mb-4">
                This resource is included with a premium subscription.
              </p>
              <ul className="space-y-2 mb-6">
                {PLAN_PERKS.map((perk) => (
                  <li key={perk} className="flex items-start gap-2 text-[12px] text-gray-700">
                    <Check size={14} className="text-green-600 mt-0.5 shrink-0" />
                    {perk}
                  </li>
                ))}
              </ul>
            </>
          )}

          {/* CTA buttons */}
          <div className="space-y-3">
            {!sold && (
              <button
                onClick={onUpgrade}
                className="w-full py-3 bg-green-800 text-white font-bold text-sm rounded-xl hover:bg-green-700 transition-colors flex items-center justify-center gap-2 shadow-md">
                <Crown size={16} className="text-amber-400" />
                {fromKobo ? `Upgrade to Premium — from ${formatKobo(fromKobo)}/mo` : "Upgrade to Premium"}
              </button>
            )}

            {canBuy && (
              <>
                <GatewayPicker gateways={gateways} value={gateway} onChange={setPicked} />
                <button
                  onClick={() => onBuySingle?.(gateway ?? undefined)}
                  className="w-full py-3 bg-amber-50 text-amber-800 font-bold text-sm rounded-xl hover:bg-amber-100 transition-colors border border-amber-200 flex items-center justify-center gap-2">
                  Buy this resource — {formatPrice(item.price!)}
                </button>
              </>
            )}

            <button
              onClick={onClose}
              className="w-full py-2.5 text-gray-500 text-[13px] font-semibold hover:text-gray-700 transition-colors">
              {item.previewAvailable ? "View Free Preview Instead" : "Maybe Later"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
