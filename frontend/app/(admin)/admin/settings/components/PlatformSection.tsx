"use client";

import { useEffect, useState } from "react";
import { Loader2, AlertTriangle } from "lucide-react";
import { SettingsCard, ToggleRow, SaveBar } from "./ui";
import * as adminApi from "@/lib/api/admin-dashboard";
import { extractErrorMessage } from "@/lib/api/client";

// This used to be a grid of platform feature toggles (maintenance mode,
// registration on/off, pro-plan enabled, pidgin mode...) with zero
// backend behind any of it. The only real platform-wide config that
// exists anywhere in the backend is AI governance — auto-flag threshold,
// budget alerts, transcript retention — so that's what this section
// actually is now, wired to the real singleton AiSettings row.
export default function PlatformSection() {
  const [settings, setSettings] = useState<adminApi.AiGovernanceSettings | null>(null);
  const [local, setLocal] = useState<adminApi.AiGovernanceSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    adminApi
      .getAiGovernanceSettings()
      .then((s) => {
        setSettings(s);
        setLocal(s);
      })
      .catch((err) => setLoadError(extractErrorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 size={24} className="animate-spin text-green-700" />
      </div>
    );
  }

  if (loadError || !settings || !local) {
    return (
      <SettingsCard title="AI Governance">
        <div className="flex items-center gap-2 text-red-600 text-[13px]">
          <AlertTriangle size={16} /> Couldn&apos;t load settings{loadError ? ` (${loadError})` : ""}.
        </div>
      </SettingsCard>
    );
  }

  const isDirty = JSON.stringify(local) !== JSON.stringify(settings);

  async function handleSave() {
    setIsSaving(true);
    setError(null);
    try {
      const updated = await adminApi.updateAiGovernanceSettings({
        autoFlagThreshold: local!.autoFlagThreshold,
        notifyOnFlagged: local!.notifyOnFlagged,
        monthlyBudgetLimitUsd: local!.monthlyBudgetLimitUsd,
        notifyOnBudgetAlert: local!.notifyOnBudgetAlert,
        notifyEmail: local!.notifyEmail,
        retentionDays: local!.retentionDays,
      });
      setSettings(updated);
      setLocal(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="space-y-5">
      <SettingsCard
        title="AI Essay Grading"
        description="Controls when an AI-graded essay gets flagged for human review">
        <div className="mb-4">
          <label className="block text-[12px] font-semibold text-gray-700 mb-1.5">
            Auto-flag confidence threshold ({local.autoFlagThreshold})
          </label>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={local.autoFlagThreshold}
            onChange={(e) => setLocal({ ...local, autoFlagThreshold: parseFloat(e.target.value) })}
            className="w-full"
          />
          <p className="text-[11px] text-gray-400 mt-1">
            Essays scored below this confidence are marked "needs review" instead of trusted outright.
          </p>
        </div>
        <ToggleRow
          label="Notify admins when flagged"
          description="Send an in-app alert whenever an essay needs review"
          value={local.notifyOnFlagged}
          onChange={(v) => setLocal({ ...local, notifyOnFlagged: v })}
        />
      </SettingsCard>

      <SettingsCard title="Budget Alerts" description="Get warned before AI usage costs run away">
        <div className="mb-4">
          <label className="block text-[12px] font-semibold text-gray-700 mb-1.5">
            Monthly budget limit (USD)
          </label>
          <input
            type="number"
            min={0}
            step={10}
            value={local.monthlyBudgetLimitUsd ?? ""}
            onChange={(e) =>
              setLocal({
                ...local,
                monthlyBudgetLimitUsd: e.target.value === "" ? null : parseFloat(e.target.value),
              })
            }
            placeholder="No limit set"
            className="w-full px-3 py-2 rounded-xl border border-gray-200 text-[13px] focus:outline-none focus:ring-2 focus:ring-green-500/30"
          />
        </div>
        <ToggleRow
          label="Notify on budget alert"
          description="Alert admins when spending approaches the limit above"
          value={local.notifyOnBudgetAlert}
          onChange={(v) => setLocal({ ...local, notifyOnBudgetAlert: v })}
        />
        <div className="mt-4">
          <label className="block text-[12px] font-semibold text-gray-700 mb-1.5">
            Also email alerts to
          </label>
          <input
            type="email"
            value={local.notifyEmail ?? ""}
            onChange={(e) => setLocal({ ...local, notifyEmail: e.target.value || null })}
            placeholder="ops@gravitest.ng (optional — in-app alerts always fire)"
            className="w-full px-3 py-2 rounded-xl border border-gray-200 text-[13px] focus:outline-none focus:ring-2 focus:ring-green-500/30"
          />
        </div>
      </SettingsCard>

      <SettingsCard
        title="Data Retention"
        description="How long AI conversation transcripts are kept before automatic deletion">
        <input
          type="number"
          min={1}
          value={local.retentionDays ?? ""}
          onChange={(e) =>
            setLocal({ ...local, retentionDays: e.target.value === "" ? null : parseInt(e.target.value, 10) })
          }
          placeholder="Keep forever"
          className="w-full px-3 py-2 rounded-xl border border-gray-200 text-[13px] focus:outline-none focus:ring-2 focus:ring-green-500/30"
        />
        <p className="text-[11px] text-gray-400 mt-1.5">Days. Leave blank to keep transcripts indefinitely.</p>

        <SaveBar
          visible={isDirty || saved}
          onSave={handleSave}
          onDiscard={() => {
            setLocal(settings);
            setSaved(false);
            setError(null);
          }}
          isSaving={isSaving}
          saved={saved}
          error={error}
        />
      </SettingsCard>
    </div>
  );
}
