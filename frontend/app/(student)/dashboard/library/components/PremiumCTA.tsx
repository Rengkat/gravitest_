"use client";

import Link from "next/link";
import { Crown, Check } from "lucide-react";
import { usePlans } from "@/lib/hooks/useBilling";
import { lowestPerMonthKobo } from "@/lib/billing/pricing-page";
import { formatKobo } from "@/lib/billing/pricing";

const UPGRADE_HREF = "/dashboard/billing?upgrade=1";

const PERKS = [
  "Unlimited downloads",
  "HD video tutorials",
  "Exclusive past question banks",
  "Offline access",
  "Priority support",
];

export default function PremiumCTA() {
  // "Starting from" is whatever the cheapest plan costs right now (promo-aware).
  const { data: plans } = usePlans();
  const fromKobo = plans ? lowestPerMonthKobo(plans) : null;

  return (
    <div className="mt-12 bg-green-900 rounded-3xl p-8 text-white relative overflow-hidden">
      {/* Texture */}
      <div
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1px)",
          backgroundSize: "20px 20px",
        }}
      />
      <div className="absolute -top-10 -right-10 w-64 h-64 bg-emerald-500 rounded-full blur-3xl opacity-20" />

      <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
        <div className="flex-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 mb-3">
            <Crown size={13} className="text-amber-400" />
            <span className="text-[12px] font-semibold">Premium Access</span>
          </div>
          <h2 className="text-2xl font-bold mb-2">Unlock All Resources</h2>
          <p className="text-green-200 text-sm max-w-md mb-4">
            Get unlimited access to all premium eBooks, masterclass videos, and exclusive study
            materials. One subscription, everything you need to pass.
          </p>

          {/* Perks list */}
          <ul className="space-y-1.5 mb-5">
            {PERKS.map((perk) => (
              <li key={perk} className="flex items-center gap-2 text-[13px] text-green-100">
                <Check size={14} className="text-emerald-400 shrink-0" />
                {perk}
              </li>
            ))}
          </ul>

          <div className="flex flex-wrap gap-3">
            <Link href={UPGRADE_HREF} className="px-6 py-2.5 bg-white text-green-900 font-bold text-sm rounded-xl hover:bg-green-50 transition-all shadow-lg">
              Upgrade to Premium
            </Link>
            <Link href={UPGRADE_HREF} className="px-6 py-2.5 bg-white/10 border border-white/20 text-white font-semibold text-sm rounded-xl hover:bg-white/20 transition-all">
              View Plans
            </Link>
          </div>
        </div>

        {/* Price callout: hidden rather than wrong when no price is known */}
        {fromKobo !== null && (
          <div className="bg-white/10 border border-white/20 rounded-2xl p-6 text-center shrink-0 min-w-[160px]">
            <div className="text-[12px] text-green-300 mb-1">Starting from</div>
            <div className="text-4xl font-black text-white mb-1">{formatKobo(fromKobo)}</div>
            <div className="text-[12px] text-green-300 mb-3">per month</div>
            <div className="text-[11px] text-green-200 bg-white/10 rounded-lg px-2 py-1">
              ✓ Cancel anytime
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
