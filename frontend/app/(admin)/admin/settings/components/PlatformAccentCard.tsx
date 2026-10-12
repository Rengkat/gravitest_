"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Loader2, RotateCcw } from "lucide-react";
import { SettingsCard } from "./ui";
import { getPlatformAppearance, updatePlatformAppearance } from "@/lib/api/platform";
import {
  ACCENT_PRESETS,
  ACCENT_STEPS,
  DEFAULT_ACCENT,
  buildAccentScale,
  normalizeHex,
} from "@/lib/theme/accent";
import { applyAccent } from "@/lib/theme/apply";

// The platform-wide accent colour. Unlike theme and font size (personal),
// this one is owned by admins and changes the colour every user sees.
export default function PlatformAccentCard() {
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(DEFAULT_ACCENT);
  const [draft, setDraft] = useState(DEFAULT_ACCENT);
  const [text, setText] = useState(DEFAULT_ACCENT);
  const [saving, setSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // What is really saved, readable from the unmount cleanup below.
  const savedRef = useRef(saved);
  savedRef.current = saved;

  useEffect(() => {
    let cancelled = false;
    getPlatformAppearance()
      .then((a) => {
        if (cancelled) return;
        const hex = normalizeHex(a.accentColor) ?? DEFAULT_ACCENT;
        setSaved(hex);
        setDraft(hex);
        setText(hex);
      })
      .catch(() => {
        if (!cancelled) setError("Couldn't load the current accent colour.");
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  // Leaving the page without saving must not leave a half-picked colour on screen.
  useEffect(() => () => applyAccent(savedRef.current), []);

  const choose = (hex: string) => {
    const n = normalizeHex(hex);
    if (!n) return;
    setDraft(n);
    setText(n);
    setJustSaved(false);
    setError(null);
    applyAccent(n); // live preview: the whole admin panel recolours as you pick
  };

  const onText = (v: string) => {
    setText(v);
    const n = normalizeHex(v);
    if (n) {
      setDraft(n);
      setJustSaved(false);
      setError(null);
      applyAccent(n);
    }
  };

  const dirty = draft !== saved;
  const textValid = normalizeHex(text) !== null;
  const scale = buildAccentScale(draft);

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await updatePlatformAppearance(draft);
      const hex = normalizeHex(res.accentColor) ?? draft;
      setSaved(hex);
      setDraft(hex);
      setText(hex);
      applyAccent(hex);
      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 2500);
    } catch {
      setError("Couldn't save — check your connection and try again.");
    } finally {
      setSaving(false);
    }
  };

  const discard = () => choose(saved);

  return (
    <SettingsCard
      title="Platform Accent Colour"
      description="Recolours the app for every user — students and admins. Only admins can change this.">
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 size={20} className="animate-spin text-green-700" />
        </div>
      ) : (
        <div className="space-y-5">
          <div role="radiogroup" aria-label="Accent colour presets" className="flex flex-wrap gap-3">
            {ACCENT_PRESETS.map(({ id, label, hex }) => {
              const active = draft === hex;
              return (
                <button
                  key={id}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  aria-label={label}
                  onClick={() => choose(hex)}
                  className="flex flex-col items-center gap-2">
                  <span
                    style={{ background: hex }}
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                      active ? "ring-2 ring-offset-2 ring-gray-400 scale-110 shadow-lg" : "hover:scale-105"
                    }`}>
                    {active && <Check size={16} className="text-white" />}
                  </span>
                  <span className={`text-[10px] font-semibold ${active ? "text-gray-800" : "text-gray-400"}`}>
                    {label}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap items-end gap-3">
            <div>
              <label htmlFor="platform-accent-hex" className="block text-[12px] font-bold text-gray-600 uppercase tracking-wider mb-1.5">
                Custom colour
              </label>
              <div className="flex items-center gap-2">
                <input
                  id="platform-accent-hex"
                  value={text}
                  onChange={(e) => onText(e.target.value)}
                  spellCheck={false}
                  maxLength={7}
                  aria-invalid={!textValid}
                  placeholder="#2E8B57"
                  className={`w-32 px-3.5 py-2.5 rounded-xl border text-[14px] font-mono bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-500/20 ${
                    textValid ? "border-gray-200 focus:border-green-400" : "border-red-300"
                  }`}
                />
                <input
                  type="color"
                  aria-label="Pick a custom colour"
                  value={draft.toLowerCase()}
                  onChange={(e) => choose(e.target.value)}
                  className="h-10 w-12 cursor-pointer rounded-lg border border-gray-200 bg-transparent p-1"
                />
              </div>
              {!textValid && (
                <p className="text-[11px] text-red-600 mt-1">Use a hex colour like #2563EB.</p>
              )}
            </div>
          </div>

          <div>
            <p className="text-[12px] font-bold text-gray-600 uppercase tracking-wider mb-1.5">
              Generated shades
            </p>
            <div className="flex overflow-hidden rounded-xl border border-gray-100" aria-hidden="true">
              {ACCENT_STEPS.map((s) => (
                <div key={s} style={{ background: scale[s] }} className="h-9 flex-1" title={`${s}`} />
              ))}
            </div>
            <p className="text-[11px] text-gray-400 mt-2">
              Only the hue and saturation of your colour are used. Lightness is fixed so buttons and
              text stay readable, in light and dark mode.
            </p>
          </div>

          {error && <p className="text-[12px] text-red-600">{error}</p>}

          <div className="flex flex-wrap items-center gap-2 pt-1">
            <button
              type="button"
              onClick={save}
              disabled={!dirty || saving}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-green-800 text-white text-[13px] font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed">
              {saving && <Loader2 size={14} className="animate-spin" />}
              Apply to everyone
            </button>
            {dirty && (
              <button
                type="button"
                onClick={discard}
                disabled={saving}
                className="px-4 py-2 rounded-xl border border-gray-200 text-gray-600 text-[13px] font-semibold hover:bg-gray-50">
                Discard
              </button>
            )}
            {draft !== DEFAULT_ACCENT && (
              <button
                type="button"
                onClick={() => choose(DEFAULT_ACCENT)}
                disabled={saving}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-gray-500 text-[13px] font-semibold hover:text-green-700">
                <RotateCcw size={13} /> Reset to default
              </button>
            )}
            {justSaved && <span className="text-[12px] font-semibold text-green-700">Saved — live for all users</span>}
          </div>
        </div>
      )}
    </SettingsCard>
  );
}
