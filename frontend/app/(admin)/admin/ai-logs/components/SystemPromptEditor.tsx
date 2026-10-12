"use client";

import { useState, useEffect, useCallback } from "react";
import { Save, Copy, RefreshCw, History, AlertCircle, FileText, XCircle, Loader2 } from "lucide-react";
import * as aiAdminApi from "@/lib/api/ai-admin";
import type { AiSystemPrompt, AIFeature } from "@/lib/api/ai-admin";
import { extractErrorMessage } from "@/lib/api/client";

const FEATURE_OPTIONS: { value: AIFeature; label: string }[] = [
  { value: "sabi_tutor", label: "Sabi Tutor" },
  { value: "sabi_explain", label: "Sabi Explain" },
  { value: "sabi_solve", label: "Sabi Solve" },
  { value: "sabi_quiz", label: "Sabi Quiz" },
  { value: "sabi_essay", label: "Sabi Essay" },
  { value: "practice_scoring", label: "Practice Scoring" },
  { value: "exam_grading", label: "Exam Grading" },
];

interface Props {
  onSave?: (prompt: string, name: string) => void;
}

export function SystemPromptEditor({ onSave }: Props) {
  const [feature, setFeature] = useState<AIFeature>("sabi_tutor");
  const [versions, setVersions] = useState<AiSystemPrompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [copied, setCopied] = useState(false);

  const [name, setName] = useState("");
  const [prompt, setPrompt] = useState("");

  const load = useCallback(async (f: AIFeature) => {
    setLoading(true);
    setError(null);
    try {
      const list = await aiAdminApi.listPrompts(f);
      setVersions(list);
      const active = list.find((v) => v.isActive) ?? list[0];
      setName(active?.name ?? `${f} prompt v1`);
      setPrompt(active?.prompt ?? "");
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(feature);
  }, [feature, load]);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const created = await aiAdminApi.createPrompt({ name, feature, prompt, activate: true });
      setVersions((prev) => [created, ...prev.map((v) => ({ ...v, isActive: false }))]);
      onSave?.(prompt, name);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleActivate = async (version: AiSystemPrompt) => {
    try {
      await aiAdminApi.activatePrompt(version.id);
      setPrompt(version.prompt);
      setName(version.name);
      setVersions((prev) => prev.map((v) => ({ ...v, isActive: v.id === version.id })));
      setShowHistory(false);
    } catch (err) {
      setError(extractErrorMessage(err));
    }
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-100 text-[13px] text-red-600">
          {error}
        </div>
      )}

      <div className="bg-white rounded-2xl border p-6" style={{ borderColor: "rgba(30,80,50,0.08)" }}>
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <div>
            <h3 className="font-serif text-lg text-green-900">System Prompt Editor</h3>
            <p className="text-[12px] text-text-muted mt-1">
              Define the AI's personality, behavior, and content guidelines — per feature
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 text-[13px] text-text-muted hover:bg-cream">
              <History size={14} />
              Version History ({versions.length})
            </button>
            <button
              onClick={handleCopy}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 text-[13px] text-text-muted hover:bg-cream">
              <Copy size={14} />
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
        </div>

        {/* Feature selector */}
        <div className="mb-4">
          <label className="block text-[12px] font-semibold text-green-900 mb-2">Feature</label>
          <select
            title="feature"
            value={feature}
            onChange={(e) => setFeature(e.target.value as AIFeature)}
            className="w-full px-4 py-2 rounded-xl border border-gray-200 text-[14px] focus:outline-none focus:ring-2 focus:ring-green-500/30 bg-white">
            {FEATURE_OPTIONS.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 size={28} className="animate-spin text-green-700" />
          </div>
        ) : (
          <>
            {/* Version name */}
            <div className="mb-4">
              <label className="block text-[12px] font-semibold text-green-900 mb-2">Version Name</label>
              <input
                title="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2 rounded-xl border border-gray-200 text-[14px] focus:outline-none focus:ring-2 focus:ring-green-500/30"
              />
            </div>

            {/* Prompt editor */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-[12px] font-semibold text-green-900">Prompt Content</label>
                <span className="text-[10px] text-text-muted">
                  {prompt.split(" ").filter(Boolean).length} words
                </span>
              </div>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={18}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 font-mono text-[13px] focus:outline-none focus:ring-2 focus:ring-green-500/30 resize-y"
                placeholder="Enter system prompt..."
              />
            </div>

            <div className="mt-4 p-3 rounded-xl bg-blue-50 border border-blue-200">
              <div className="flex items-start gap-2">
                <AlertCircle size={14} className="text-blue-600 shrink-0 mt-0.5" />
                <div className="text-[11px] text-blue-700">
                  Saving creates a <strong>new version</strong> and activates it immediately — the
                  previous version stays in history and can be reactivated any time.
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t flex justify-end" style={{ borderColor: "rgba(30,80,50,0.08)" }}>
              <button
                onClick={handleSave}
                disabled={saving || !prompt.trim()}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-green-800 text-white font-semibold hover:bg-green-700 transition-all disabled:opacity-50">
                {saving ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />}
                {saving ? "Saving..." : "Save & Activate"}
              </button>
            </div>
          </>
        )}
      </div>

      {/* Version History Modal */}
      {showHistory && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
              <h3 className="font-serif text-lg text-green-900">Version History</h3>
              <button
                title="Close"
                onClick={() => setShowHistory(false)}
                className="p-2 rounded-lg hover:bg-gray-100">
                <XCircle size={20} />
              </button>
            </div>
            <div className="p-6 space-y-3">
              {versions.length === 0 && (
                <p className="text-[13px] text-text-muted text-center py-6">No versions yet.</p>
              )}
              {versions.map((version) => (
                <div
                  key={version.id}
                  className={`p-4 rounded-xl border ${
                    version.isActive ? "border-green-200 bg-green-50" : "border-gray-200"
                  }`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <FileText size={14} className="text-green-800" />
                      <span className="font-semibold text-green-900">{version.name}</span>
                      {version.isActive && (
                        <span className="px-2 py-0.5 rounded-full bg-green-200 text-green-700 text-[9px] font-semibold">
                          Active
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-text-muted">
                      {new Date(version.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <p className="text-[12px] text-text-muted line-clamp-2 mb-3">
                    {version.prompt.substring(0, 200)}...
                  </p>
                  {!version.isActive && (
                    <button
                      onClick={() => handleActivate(version)}
                      className="text-[12px] text-green-700 hover:underline">
                      Activate this version
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SystemPromptEditor;
