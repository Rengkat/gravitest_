"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Power,
  AlertTriangle,
  CheckCircle,
  MessageSquare,
  Brain,
  Target,
  GraduationCap,
  BookOpen,
  Loader2,
  Info,
} from "lucide-react";
import Link from "next/link";
import * as aiAdminApi from "@/lib/api/ai-admin";
import type { AiFeatureModelMapping, AIFeature } from "@/lib/api/ai-admin";
import { extractErrorMessage } from "@/lib/api/client";

// Feature -> icon, purely cosmetic. The enable/disable state and the
// model/temperature/maxTokens values are all real, from
// AiFeatureModelMapping (src/ai/entities/ai-feature-model-mapping.entity.ts).
const FEATURE_META: Record<AIFeature, { name: string; description: string; icon: any }> = {
  sabi_tutor: { name: "Sabi Tutor", description: "Interactive AI tutoring sessions", icon: MessageSquare },
  sabi_explain: { name: "Sabi Explain", description: "On-demand MCQ explanations", icon: Brain },
  sabi_solve: { name: "Sabi Solve", description: "Step-by-step problem solving", icon: Target },
  sabi_quiz: { name: "Sabi Quiz", description: "AI-generated practice quizzes", icon: BookOpen },
  sabi_essay: { name: "Sabi Essay", description: "Essay/theory writing help", icon: GraduationCap },
  sabi_translate: { name: "Sabi Translate", description: "Pidgin/local-language translation", icon: MessageSquare },
  practice_scoring: { name: "Practice Scoring", description: "AI essay/theory scoring in practice mode", icon: CheckCircle },
  exam_grading: { name: "Exam Grading", description: "AI essay/theory scoring in exam mode", icon: CheckCircle },
  feedback_generation: { name: "Feedback Generation", description: "Automated feedback on answers", icon: MessageSquare },
};

export function AIConfigPanel() {
  const [mappings, setMappings] = useState<AiFeatureModelMapping[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingFeature, setSavingFeature] = useState<AIFeature | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setMappings(await aiAdminApi.listMappings());
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const toggle = async (mapping: AiFeatureModelMapping) => {
    setSavingFeature(mapping.feature);
    try {
      const updated = await aiAdminApi.upsertMapping(mapping.feature, {
        primaryModelId: mapping.primaryModelId,
        fallbackModelId: mapping.fallbackModelId ?? undefined,
        isEnabled: !mapping.isEnabled,
        maxTokens: mapping.maxTokens ?? undefined,
        temperature: mapping.temperature ?? undefined,
      });
      setMappings((prev) => prev.map((m) => (m.feature === mapping.feature ? updated : m)));
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setSavingFeature(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 size={28} className="animate-spin text-green-700" />
      </div>
    );
  }

  const configuredFeatures = (Object.keys(FEATURE_META) as AIFeature[]).map((feature) => ({
    feature,
    mapping: mappings.find((m) => m.feature === feature) ?? null,
  }));

  return (
    <div className="space-y-6">
      {error && (
        <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-100 text-[13px] text-red-600">
          {error}
        </div>
      )}

      <div className="px-4 py-3 rounded-xl bg-blue-50 border border-blue-200 flex items-start gap-2.5">
        <Info size={15} className="text-blue-600 shrink-0 mt-0.5" />
        <p className="text-[12px] text-blue-800">
          Model, temperature, and max-token settings for each feature are configured on the{" "}
          <Link href="/admin/ai-logs/models" className="underline font-semibold">
            Model Management
          </Link>{" "}
          page. This page only controls whether a feature is turned on or off platform-wide.
        </p>
      </div>

      <div className="bg-white rounded-2xl border p-6" style={{ borderColor: "rgba(30,80,50,0.08)" }}>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
            <Power size={20} className="text-green-800" />
          </div>
          <div>
            <h3 className="font-serif text-lg text-green-900">Feature Flags</h3>
            <p className="text-[12px] text-text-muted">Enable or disable AI features globally</p>
          </div>
        </div>

        <div className="space-y-3">
          {configuredFeatures.map(({ feature, mapping }) => {
            const meta = FEATURE_META[feature];
            const Icon = meta.icon;
            const enabled = mapping?.isEnabled ?? false;
            const isSaving = savingFeature === feature;

            return (
              <div
                key={feature}
                className="flex items-center justify-between p-3 rounded-xl hover:bg-cream/20 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-green-50">
                    <Icon size={14} className="text-green-700" />
                  </div>
                  <div>
                    <div className="text-[13px] font-semibold text-green-900">{meta.name}</div>
                    <div className="text-[11px] text-text-muted">
                      {mapping ? meta.description : "Not configured — set a model on the Models page first"}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {isSaving && <Loader2 size={13} className="animate-spin text-green-700" />}
                  <button
                    onClick={() => mapping && toggle(mapping)}
                    disabled={!mapping || isSaving}
                    className={`relative w-10 h-5 rounded-full transition-all disabled:opacity-40 ${
                      enabled ? "bg-green-800" : "bg-gray-300"
                    }`}>
                    <div
                      className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${
                        enabled ? "right-0.5" : "left-0.5"
                      }`}
                    />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-3">
        <AlertTriangle size={18} className="text-amber-600 shrink-0 mt-0.5" />
        <div>
          <div className="text-[12px] font-semibold text-amber-800">Changes take effect immediately</div>
          <div className="text-[11px] text-amber-700">
            Disabling a feature affects every user currently using it — no confirmation prompt, no
            rollout delay.
          </div>
        </div>
      </div>
    </div>
  );
}
