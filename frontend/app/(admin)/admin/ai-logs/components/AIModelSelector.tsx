"use client";

import { useState, useEffect, useCallback } from "react";
import { Brain, DollarSign, Activity, RefreshCw, Check, Plus, X, Loader2, Trash2 } from "lucide-react";
import * as aiAdminApi from "@/lib/api/ai-admin";
import type { AiModelConfig, AiFeatureModelMapping, AIFeature } from "@/lib/api/ai-admin";
import { extractErrorMessage } from "@/lib/api/client";

const FEATURE_LABELS: Record<AIFeature, string> = {
  sabi_tutor: "Sabi Tutor",
  sabi_explain: "Sabi Explain",
  sabi_solve: "Sabi Solve",
  sabi_quiz: "Sabi Quiz",
  sabi_essay: "Sabi Essay",
  sabi_translate: "Sabi Translate",
  practice_scoring: "Practice Scoring",
  exam_grading: "Exam Grading",
  feedback_generation: "Feedback Generation",
};

const PROVIDER_OPTIONS: { value: AIProvider; label: string; examplePlaceholder: string; hint?: string }[] = [
  { value: "groq", label: "Groq", examplePlaceholder: "llama-3.3-70b-versatile" },
  { value: "google", label: "Google (Gemini)", examplePlaceholder: "gemini-2.0-flash" },
  { value: "openai", label: "OpenAI", examplePlaceholder: "gpt-4o-mini" },
  { value: "anthropic", label: "Anthropic", examplePlaceholder: "claude-3-5-haiku-20241022" },
  { value: "deepseek", label: "DeepSeek", examplePlaceholder: "deepseek-chat", hint: "Very low cost per token" },
  { value: "mistral", label: "Mistral", examplePlaceholder: "mistral-small-latest" },
  {
    value: "openrouter",
    label: "OpenRouter",
    examplePlaceholder: "meta-llama/llama-3.1-8b-instruct:free",
    hint: "Aggregator — many models have a genuinely free tier (look for a \":free\" model id)",
  },
  {
    value: "ollama",
    label: "Ollama (self-hosted)",
    examplePlaceholder: "llama3.1",
    hint: "Zero per-request cost — runs on your own server. Set OLLAMA_BASE_URL in backend env.",
  },
];

const EMPTY_NEW_MODEL = {
  provider: "groq" as AIProvider,
  modelId: "",
  name: "",
  description: "",
  costInputPerMillion: "0",
  costOutputPerMillion: "0",
  avgLatencyMs: "",
  tags: "",
};

interface Props {
  onUpdate?: (config: any) => void;
}

export function AIModelSelector({ onUpdate }: Props) {
  const [models, setModels] = useState<AiModelConfig[]>([]);
  const [mappings, setMappings] = useState<AiFeatureModelMapping[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [showAddModel, setShowAddModel] = useState(false);
  const [newModel, setNewModel] = useState(EMPTY_NEW_MODEL);
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [modelList, mappingList] = await Promise.all([
        aiAdminApi.listModels(),
        aiAdminApi.listMappings(),
      ]);
      setModels(modelList);
      setMappings(mappingList);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const toggleActive = async (model: AiModelConfig) => {
    setSavingId(model.id);
    try {
      const updated = await aiAdminApi.updateModel(model.id, { isActive: !model.isActive });
      setModels((prev) => prev.map((m) => (m.id === model.id ? updated : m)));
      onUpdate?.(updated);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setSavingId(null);
    }
  };

  const setPrimaryForFeature = async (feature: AIFeature, modelId: string) => {
    const existing = mappings.find((m) => m.feature === feature);
    setSavingId(`mapping-${feature}`);
    try {
      const updated = await aiAdminApi.upsertMapping(feature, {
        primaryModelId: modelId,
        fallbackModelId: existing?.fallbackModelId ?? undefined,
        isEnabled: existing?.isEnabled ?? true,
      });
      setMappings((prev) => {
        const idx = prev.findIndex((m) => m.feature === feature);
        if (idx === -1) return [...prev, updated];
        const next = [...prev];
        next[idx] = updated;
        return next;
      });
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setSavingId(null);
    }
  };

  const handleCreateModel = async () => {
    if (!newModel.modelId.trim() || !newModel.name.trim()) {
      setError("Model ID and display name are required.");
      return;
    }
    setCreating(true);
    setError(null);
    try {
      const created = await aiAdminApi.createModel({
        provider: newModel.provider,
        modelId: newModel.modelId.trim(),
        name: newModel.name.trim(),
        description: newModel.description.trim() || undefined,
        costInputPerMillion: parseFloat(newModel.costInputPerMillion) || 0,
        costOutputPerMillion: parseFloat(newModel.costOutputPerMillion) || 0,
        avgLatencyMs: newModel.avgLatencyMs ? parseInt(newModel.avgLatencyMs, 10) : undefined,
        tags: newModel.tags
          ? newModel.tags.split(",").map((t) => t.trim()).filter(Boolean)
          : undefined,
        isActive: true,
      });
      setModels((prev) => [...prev, created]);
      setNewModel(EMPTY_NEW_MODEL);
      setShowAddModel(false);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteModel = async (model: AiModelConfig) => {
    if (!confirm(`Remove "${model.name}"? Any feature currently routed to it will need reassigning.`)) {
      return;
    }
    setDeletingId(model.id);
    setError(null);
    try {
      await aiAdminApi.deleteModel(model.id);
      setModels((prev) => prev.filter((m) => m.id !== model.id));
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 size={28} className="animate-spin text-green-700" />
      </div>
    );
  }

  const activeModels = models.filter((m) => m.isActive);

  return (
    <div className="space-y-6">
      {error && (
        <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-100 text-[13px] text-red-600">
          {error}
        </div>
      )}

      {/* Registered models */}
      <div className="bg-white rounded-2xl border p-6" style={{ borderColor: "rgba(30,80,50,0.08)" }}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-serif text-lg text-green-900">Registered Models</h3>
          <div className="flex items-center gap-3">
            <span className="text-[12px] text-text-muted">
              {activeModels.length} active of {models.length}
            </span>
            <button
              onClick={() => setShowAddModel((v) => !v)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold bg-green-800 text-white hover:bg-green-700 transition-all">
              {showAddModel ? <X size={13} /> : <Plus size={13} />}
              {showAddModel ? "Cancel" : "Add Model"}
            </button>
          </div>
        </div>

        {showAddModel && (
          <div className="mb-5 p-4 rounded-xl border border-green-200 bg-cream/30 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-green-900 mb-1">Provider</label>
                <select
                  title="Provider"
                  value={newModel.provider}
                  onChange={(e) => setNewModel((n) => ({ ...n, provider: e.target.value as AIProvider }))}
                  className="w-full text-[12px] border border-gray-200 rounded-lg px-2.5 py-2 bg-white focus:outline-none focus:border-green-400">
                  {PROVIDER_OPTIONS.map((p) => (
                    <option key={p.value} value={p.value}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-green-900 mb-1">Model ID (sent to API)</label>
                <input
                  value={newModel.modelId}
                  onChange={(e) => setNewModel((n) => ({ ...n, modelId: e.target.value }))}
                  placeholder={PROVIDER_OPTIONS.find((p) => p.value === newModel.provider)?.examplePlaceholder}
                  className="w-full text-[12px] border border-gray-200 rounded-lg px-2.5 py-2 focus:outline-none focus:border-green-400 font-mono"
                />
              </div>
            </div>

            {PROVIDER_OPTIONS.find((p) => p.value === newModel.provider)?.hint && (
              <p className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-1.5">
                {PROVIDER_OPTIONS.find((p) => p.value === newModel.provider)?.hint}
              </p>
            )}

            <div>
              <label className="block text-[11px] font-semibold text-green-900 mb-1">Display Name</label>
              <input
                value={newModel.name}
                onChange={(e) => setNewModel((n) => ({ ...n, name: e.target.value }))}
                placeholder="e.g. Llama 3.1 8B (Free)"
                className="w-full text-[12px] border border-gray-200 rounded-lg px-2.5 py-2 focus:outline-none focus:border-green-400"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-green-900 mb-1">Description (optional)</label>
              <input
                value={newModel.description}
                onChange={(e) => setNewModel((n) => ({ ...n, description: e.target.value }))}
                placeholder="What this model is good for, any caveats..."
                className="w-full text-[12px] border border-gray-200 rounded-lg px-2.5 py-2 focus:outline-none focus:border-green-400"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-green-900 mb-1">Cost In ($/1M tok)</label>
                <input
                  type="number"
                  step="0.0001"
                  min="0"
                  value={newModel.costInputPerMillion}
                  onChange={(e) => setNewModel((n) => ({ ...n, costInputPerMillion: e.target.value }))}
                  className="w-full text-[12px] border border-gray-200 rounded-lg px-2.5 py-2 focus:outline-none focus:border-green-400"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-green-900 mb-1">Cost Out ($/1M tok)</label>
                <input
                  type="number"
                  step="0.0001"
                  min="0"
                  value={newModel.costOutputPerMillion}
                  onChange={(e) => setNewModel((n) => ({ ...n, costOutputPerMillion: e.target.value }))}
                  className="w-full text-[12px] border border-gray-200 rounded-lg px-2.5 py-2 focus:outline-none focus:border-green-400"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-green-900 mb-1">Avg Latency (ms)</label>
                <input
                  type="number"
                  min="0"
                  value={newModel.avgLatencyMs}
                  onChange={(e) => setNewModel((n) => ({ ...n, avgLatencyMs: e.target.value }))}
                  placeholder="optional"
                  className="w-full text-[12px] border border-gray-200 rounded-lg px-2.5 py-2 focus:outline-none focus:border-green-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-green-900 mb-1">Tags (comma-separated, optional)</label>
              <input
                value={newModel.tags}
                onChange={(e) => setNewModel((n) => ({ ...n, tags: e.target.value }))}
                placeholder="free, cheap, fallback"
                className="w-full text-[12px] border border-gray-200 rounded-lg px-2.5 py-2 focus:outline-none focus:border-green-400"
              />
            </div>

            <button
              onClick={handleCreateModel}
              disabled={creating}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-[12px] font-semibold bg-green-800 text-white hover:bg-green-700 transition-all disabled:opacity-50">
              {creating ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
              Save Model
            </button>
          </div>
        )}

        {models.length === 0 && (
          <p className="text-[13px] text-text-muted py-6 text-center">
            No models registered yet — click &quot;Add Model&quot; above to register your first one.
          </p>
        )}

        <div className="space-y-3">
          {models.map((model) => (
            <div
              key={model.id}
              className={`p-4 rounded-xl border transition-all ${
                model.isActive ? "border-green-200 bg-cream/20" : "border-gray-200 opacity-70"
              }`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <Brain size={16} className="text-green-800" />
                    <span className="font-semibold text-green-900">{model.name}</span>
                    <span className="text-[10px] text-text-muted uppercase">{model.provider}</span>
                    <span className="text-[10px] text-gray-400 font-mono">{model.modelId}</span>
                  </div>
                  {model.description && (
                    <p className="text-[12px] text-text-muted mb-3">{model.description}</p>
                  )}
                  <div className="flex items-center gap-4 text-[11px] flex-wrap">
                    <span className="flex items-center gap-1">
                      <DollarSign size={10} />
                      In: ${model.costInputPerMillion}/1M
                    </span>
                    <span className="flex items-center gap-1">
                      <DollarSign size={10} />
                      Out: ${model.costOutputPerMillion}/1M
                    </span>
                    <span className="flex items-center gap-1">
                      <Activity size={10} />
                      {model.avgLatencyMs}ms
                    </span>
                  </div>
                  {model.tags && model.tags.length > 0 && (
                    <div className="flex gap-1 mt-2">
                      {model.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-1.5 py-0.5 rounded bg-gray-100 text-[9px] text-text-muted">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => toggleActive(model)}
                    disabled={savingId === model.id}
                    className={`px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all flex items-center gap-1.5 ${
                      model.isActive
                        ? "bg-green-800 text-white"
                        : "bg-gray-100 text-text-muted hover:bg-gray-200"
                    }`}>
                    {savingId === model.id && <RefreshCw size={11} className="animate-spin" />}
                    {model.isActive ? "Active" : "Inactive"}
                  </button>
                  <button
                    title={`Remove ${model.name}`}
                    onClick={() => handleDeleteModel(model)}
                    disabled={deletingId === model.id}
                    className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-all disabled:opacity-50">
                    {deletingId === model.id ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Trash2 size={14} />
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Feature -> model routing */}
      <div className="bg-white rounded-2xl border p-6" style={{ borderColor: "rgba(30,80,50,0.08)" }}>
        <h3 className="font-serif text-lg text-green-900 mb-1">Feature-Specific Model Mapping</h3>
        <p className="text-[12px] text-text-muted mb-4">
          Choose which model handles each AI feature. Takes effect immediately, no redeploy.
        </p>

        {activeModels.length === 0 ? (
          <p className="text-[13px] text-text-muted py-4">
            Activate at least one model above to configure routing.
          </p>
        ) : (
          <div className="space-y-3">
            {(Object.keys(FEATURE_LABELS) as AIFeature[]).map((feature) => {
              const mapping = mappings.find((m) => m.feature === feature);
              const isSaving = savingId === `mapping-${feature}`;
              return (
                <div
                  key={feature}
                  className="flex items-center justify-between p-3 rounded-xl bg-cream/30 gap-4">
                  <div className="min-w-0">
                    <div className="text-[13px] font-semibold text-green-900">
                      {FEATURE_LABELS[feature]}
                    </div>
                    <div className="text-[11px] text-text-muted">
                      {mapping
                        ? `Routing to ${models.find((m) => m.modelId === mapping.primaryModelId)?.name ?? mapping.primaryModelId}`
                        : "Not configured — using feature default"}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {isSaving && <Loader2 size={13} className="animate-spin text-green-700" />}
                    <select
                      title="model select"
                      value={mapping?.primaryModelId ?? ""}
                      onChange={(e) => setPrimaryForFeature(feature, e.target.value)}
                      disabled={isSaving}
                      className="text-[12px] border border-gray-200 rounded-lg px-2.5 py-1.5 bg-white focus:outline-none focus:border-green-400">
                      <option value="" disabled>
                        Select model
                      </option>
                      {activeModels.map((m) => (
                        <option key={m.id} value={m.modelId}>
                          {m.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default AIModelSelector;
