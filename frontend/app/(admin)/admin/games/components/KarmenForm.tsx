import { useState } from "react";
import { NIGERIAN_ZONES } from "../constants";
import { AnyQuestion, Difficulty, Game, KarmenLocation } from "../types";
import { DiffRow } from "./DiffRow";
import { FormFooter } from "./FormFooter";
import { inputCls, Label } from "./Primitives";

export function KarmenForm({
  game,
  onAdd,
  onClose,
}: {
  game: Game;
  onAdd: (q: AnyQuestion) => void;
  onClose: () => void;
}) {
  const [f, setF] = useState({
    name: "",
    capital: "",
    zone: "sw" as (typeof NIGERIAN_ZONES)[number],
    slogan: "",
    minerals: "",
    notable: "",
    clueCulture: "",
    clueFood: "",
    clueNature: "",
    clueLandmark: "",
    artifact: "Mask",
  });
  const [diff, setDiff] = useState<Difficulty>("medium");
  const upd = (k: keyof typeof f, v: string) => setF((p) => ({ ...p, [k]: v }));

  const submit = () => {
    if (!f.name.trim()) return;
    onAdd({ id: "", ...f, difficulty: diff } as KarmenLocation);
    onClose();
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>State Name *</Label>
          <input
            value={f.name}
            onChange={(e) => upd("name", e.target.value)}
            placeholder="e.g. Lagos"
            className={inputCls}
          />
        </div>
        <div>
          <Label>Capital City *</Label>
          <input
            value={f.capital}
            onChange={(e) => upd("capital", e.target.value)}
            placeholder="e.g. Ikeja"
            className={inputCls}
          />
        </div>
        <div>
          <Label>Geopolitical Zone *</Label>
          <select
            title="zone"
            value={f.zone}
            onChange={(e) => upd("zone", e.target.value)}
            className={inputCls}>
            {NIGERIAN_ZONES.map((z) => (
              <option key={z} value={z}>
                {z.toUpperCase()}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label>State Slogan</Label>
          <input
            value={f.slogan}
            onChange={(e) => upd("slogan", e.target.value)}
            placeholder="e.g. Centre of Excellence"
            className={inputCls}
          />
        </div>
      </div>

      <div>
        <Label>Minerals / Natural Resources</Label>
        <input
          value={f.minerals}
          onChange={(e) => upd("minerals", e.target.value)}
          placeholder="e.g. Bitumen, Clay, Silica Sand"
          className={inputCls}
        />
      </div>
      <div>
        <Label>Notable Facts</Label>
        <textarea
          rows={2}
          value={f.notable}
          onChange={(e) => upd("notable", e.target.value)}
          placeholder="What makes this state notable?"
          className={`${inputCls} resize-none`}
        />
      </div>

      <div className="border-t pt-4" style={{ borderColor: "rgba(30,80,50,0.08)" }}>
        <p className="text-[12px] font-bold text-green-900 mb-3 uppercase tracking-wide">
          Clues (shown to player)
        </p>
        <div className="space-y-3">
          {[
            {
              key: "clueCulture" as const,
              label: "Culture Clue",
              placeholder: "Describe the culture without naming the state…",
            },
            {
              key: "clueFood" as const,
              label: "Food Clue",
              placeholder: "Describe a famous local dish or food tradition…",
            },
            {
              key: "clueNature" as const,
              label: "Nature Clue",
              placeholder: "Describe the geography, climate or wildlife…",
            },
            {
              key: "clueLandmark" as const,
              label: "Landmark Clue",
              placeholder: "Describe a famous landmark or monument…",
            },
          ].map(({ key, label, placeholder }) => (
            <div key={key}>
              <Label>{label}</Label>
              <textarea
                rows={2}
                value={f[key]}
                onChange={(e) => upd(key, e.target.value)}
                placeholder={placeholder}
                className={`${inputCls} resize-none`}
              />
            </div>
          ))}
        </div>
      </div>

      <DiffRow value={diff} onChange={setDiff} levels={game.settings.difficultyLevels} />
      <FormFooter onClose={onClose} onSubmit={submit} disabled={!f.name.trim()} />
    </div>
  );
}
