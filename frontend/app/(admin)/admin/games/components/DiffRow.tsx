import type { Difficulty } from "../types";
import { DifficultyChip, Label } from "./Primitives";
export function DiffRow({
  value,
  onChange,
  levels,
}: {
  value: Difficulty;
  onChange: (d: Difficulty) => void;
  levels: Difficulty[];
}) {
  return (
    <div>
      <Label>Difficulty</Label>
      <div className="flex gap-2 flex-wrap">
        {levels.map((d) => (
          <DifficultyChip key={d} level={d} selected={value === d} onClick={() => onChange(d)} />
        ))}
      </div>
    </div>
  );
}
