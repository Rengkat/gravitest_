"use client";

import { useState, useEffect, useCallback } from "react";
import { Save, RefreshCw, AlertTriangle, Loader2, Check } from "lucide-react";
import * as aiAdminApi from "@/lib/api/ai-admin";
import type { AiRateLimitConfig, BackendSubscriptionTier } from "@/lib/api/ai-admin";
import { extractErrorMessage } from "@/lib/api/client";

interface Props {
  onUpdate?: (configs: AiRateLimitConfig[]) => void;
}

const TIER_COLORS: Record<BackendSubscriptionTier, string> = {
  free: "bg-gray-100 text-gray-600",
  basic: "bg-blue-100 text-blue-600",
  standard: "bg-green-100 text-green-600",
  premium: "bg-purple-100 text-purple-600",
  enterprise: "bg-amber-100 text-amber-700",
};

export function RateLimitControls({ onUpdate }: Props) {
  const [limits, setLimits] = useState<AiRateLimitConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingTier, setSavingTier] = useState<string | null>(null);
  const [savedTier, setSavedTier] = useState<string | null>(null);
  // Local edits before save, keyed by tier
  const [drafts, setDrafts] = useState<Record<string, Partial<AiRateLimitConfig>>>({});

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await aiAdminApi.listRateLimits();
      setLimits(result);
      setDrafts({});
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const fieldValue = (limit: AiRateLimitConfig, field: keyof AiRateLimitConfig) =>
    drafts[limit.tier]?.[field] ?? limit[field];

  const handleChange = (tier: string, field: keyof AiRateLimitConfig, value: number) => {
    setDrafts((prev) => ({ ...prev, [tier]: { ...prev[tier], [field]: value } }));
  };

  const handleSave = async (limit: AiRateLimitConfig) => {
    const draft = drafts[limit.tier];
    if (!draft) return;
    setSavingTier(limit.tier);
    setError(null);
    try {
      const updated = await aiAdminApi.updateRateLimits(limit.tier, draft);
      setLimits((prev) => prev.map((l) => (l.tier === limit.tier ? updated : l)));
      setDrafts((prev) => {
        const next = { ...prev };
        delete next[limit.tier];
        return next;
      });
      onUpdate?.(limits);
      setSavedTier(limit.tier);
      setTimeout(() => setSavedTier(null), 2000);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setSavingTier(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 size={28} className="animate-spin text-green-700" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-100 text-[13px] text-red-600">
          {error}
        </div>
      )}

      {/* Info banner */}
      <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-3">
        <AlertTriangle size={20} className="text-amber-600 shrink-0" />
        <div>
          <div className="text-[13px] font-semibold text-amber-800">
            One row per subscription tier
          </div>
          <div className="text-[12px] text-amber-700 mt-1">
            These are the real limits enforced by AiRateLimitService on every AI request — editing a
            row here takes effect immediately, no redeploy.
          </div>
        </div>
      </div>

      {/* Rate limit table */}
      <div className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: "rgba(30,80,50,0.08)" }}>
        <div className="px-6 py-4 bg-cream/30 border-b" style={{ borderColor: "rgba(30,80,50,0.08)" }}>
          <h3 className="font-serif text-lg text-green-900">Rate Limits by Tier</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b" style={{ borderColor: "rgba(30,80,50,0.08)" }}>
                <th className="text-left px-6 py-3 text-[11px] font-semibold text-text-muted uppercase">Tier</th>
                <th className="text-right px-6 py-3 text-[11px] font-semibold text-text-muted uppercase">Requests/Day</th>
                <th className="text-right px-6 py-3 text-[11px] font-semibold text-text-muted uppercase">Requests/Hour</th>
                <th className="text-right px-6 py-3 text-[11px] font-semibold text-text-muted uppercase">Tokens/Day</th>
                <th className="text-right px-6 py-3 text-[11px] font-semibold text-text-muted uppercase">Concurrent</th>
                <th className="px-6 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: "rgba(30,80,50,0.08)" }}>
              {limits.map((limit) => {
                const hasDraft = !!drafts[limit.tier];
                const isSaving = savingTier === limit.tier;
                return (
                  <tr key={limit.tier} className="hover:bg-cream/20">
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-1 rounded-lg text-[11px] font-semibold ${TIER_COLORS[limit.tier]}`}>
                        {limit.tier.toUpperCase()}
                      </span>
                    </td>
                    {(["requestsPerDay", "requestsPerHour", "tokensPerDay", "concurrentSessions"] as const).map(
                      (field) => (
                        <td key={field} className="px-6 py-4">
                          <input
                            title={field}
                            type="number"
                            value={fieldValue(limit, field) as number}
                            onChange={(e) => handleChange(limit.tier, field, parseInt(e.target.value) || 0)}
                            className="w-28 px-3 py-1.5 rounded-lg border border-gray-200 text-right text-[13px] focus:outline-none focus:ring-2 focus:ring-green-500/30"
                          />
                        </td>
                      ),
                    )}
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleSave(limit)}
                        disabled={!hasDraft || isSaving}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-all disabled:opacity-40 ${
                          savedTier === limit.tier
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-green-800 text-white hover:bg-green-700"
                        }`}>
                        {isSaving ? (
                          <RefreshCw size={12} className="animate-spin" />
                        ) : savedTier === limit.tier ? (
                          <Check size={12} />
                        ) : (
                          <Save size={12} />
                        )}
                        {savedTier === limit.tier ? "Saved" : "Save"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default RateLimitControls;
