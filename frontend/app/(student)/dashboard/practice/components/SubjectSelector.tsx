import { BookOpen, Check, Info, Search, X } from "lucide-react";
import { useState } from "react";

export default function SubjectSelector({
  // examType,
  subjects,
  isJamb,
  selected,
  onChange,
}: {
  examType: string;
  subjects: string[];
  isJamb: boolean;
  selected: string[];
  onChange: (vals: string[]) => void;
}) {
  const [query, setQuery] = useState("");
  const filtered = subjects.filter((s) => s.toLowerCase().includes(query.toLowerCase()));
  const maxSelect = isJamb ? 4 : 1;

  const toggle = (sub: string) => {
    if (selected.includes(sub)) {
      onChange(selected.filter((s) => s !== sub));
    } else {
      if (selected.length >= maxSelect) {
        // Replace the oldest selection
        const toRemove = selected[selected.length - 1];
        onChange([...selected.filter((s) => s !== toRemove), sub]);
      } else {
        onChange([...selected, sub]);
      }
    }
  };

  const effectiveSelected = selected;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      {/* Header */}
      <div className="flex items-start gap-2.5 mb-4">
        <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center shrink-0">
          <BookOpen size={16} className="text-green-700" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-[15px] font-bold text-gray-800">
            {isJamb ? "Select Subjects" : "Select Subject"}
          </h3>
          <p className="text-[11px] text-gray-400">
            {isJamb
              ? "Choose up to 4 subjects."
              : "Pick one subject to practise"}
          </p>
        </div>
        {effectiveSelected.length > 0 && (
          <span className="shrink-0 text-[11px] font-semibold text-green-700 bg-green-100 px-2.5 py-1 rounded-full">
            {effectiveSelected.length}/{maxSelect}
          </span>
        )}
      </div>

      {/* JAMB: selected subjects chips */}
      {isJamb && effectiveSelected.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4 p-3 bg-green-50 rounded-xl border border-green-100">
          {effectiveSelected.map((sub) => (
            <div
              key={sub}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold bg-white text-green-800 border border-green-200">
              <Check size={11} />
              {sub}
              <button
                title="toggle"
                onClick={() => toggle(sub)}
                className="ml-0.5 hover:text-red-500 transition-colors">
                <X size={11} />
              </button>
            </div>
          ))}
          {effectiveSelected.length < maxSelect && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] text-gray-400 border border-dashed border-gray-300">
              + {maxSelect - effectiveSelected.length} more
            </div>
          )}
        </div>
      )}

      {/* Search */}
      <div className="relative mb-3">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search subjects..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full pl-9 pr-9 py-2.5 rounded-xl border border-gray-200 text-[13px] focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-400 transition-all"
        />
        {query && (
          <button
            title="set query"
            onClick={() => setQuery("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
            <X size={14} />
          </button>
        )}
      </div>

      {/* Subject list — fixed height, scrollable */}
      <div className="max-h-52 overflow-y-auto rounded-xl border border-gray-100 divide-y divide-gray-50">
        {filtered.length === 0 ? (
          <div className="py-8 text-center text-[13px] text-gray-400">
            No subjects match &quot;{query}&quot;
          </div>
        ) : (
          filtered.map((sub) => {
            const active = effectiveSelected.includes(sub);
            return (
              <button
                key={sub}
                onClick={() => toggle(sub)}
                className={`w-full flex items-center justify-between px-4 py-3 text-left text-[13px] transition-all cursor-pointer ${
                  active
                    ? "bg-green-50 text-green-800 font-semibold"
                    : "text-gray-700 hover:bg-gray-50"
                }`}>
                <span>{sub}</span>
                <div className="flex items-center gap-2 shrink-0">
                  <div
                    className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${active ? "bg-green-600 border-green-600" : "border-gray-300"}`}>
                    {active && <Check size={10} className="text-white" />}
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>

      {/* Info note for JAMB */}
      {isJamb && (
        <div className="mt-3 flex items-start gap-2 text-[11px] text-gray-400 bg-gray-50 rounded-lg px-3 py-2.5">
          <Info size={13} className="shrink-0 mt-0.5 text-gray-400" />
          <span>JAMB requires 4 subjects relevant to your intended course, including Use of English.</span>
        </div>
      )}
    </div>
  );
}
