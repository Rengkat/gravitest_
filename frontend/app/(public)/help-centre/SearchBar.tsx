import { Search, X } from "lucide-react";

/* ─────────────────────────────────────────────────────────
   SEARCH BAR
───────────────────────────────────────────────────────── */
export default function SearchBar({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="relative max-w-[600px] mx-auto">
      {/* Search icon */}
      <div className="absolute left-5 top-1/2 -translate-y-1/2 pointer-events-none">
        <Search size={18} strokeWidth={2} style={{ color: "#8aab98" }} />
      </div>
      <input
        type="search"
        data-testid="help-search"
        placeholder="Search for help… e.g. reset password, offline mode"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full pl-[50px] pr-5 py-4 rounded-2xl text-[15px] transition-all duration-200 outline-none"
        style={{
          background: "white",
          border: "1.5px solid rgba(30,80,50,0.15)",
          color: "#111a14",
          fontFamily: "'Sora', sans-serif",
          boxShadow: "0 4px 24px rgba(13,43,26,0.06)",
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = "#1a4a2e";
          e.currentTarget.style.boxShadow = "0 0 0 3px rgba(26,74,46,0.1)";
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = "rgba(30,80,50,0.15)";
          e.currentTarget.style.boxShadow = "0 4px 24px rgba(13,43,26,0.06)";
        }}
      />
      {value && (
        <button
          onClick={() => onChange("")}
          className="absolute right-5 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full flex items-center justify-center transition-colors"
          style={{ background: "rgba(26,74,46,0.08)", color: "#4a6357" }}
          aria-label="Clear search">
          <X size={12} />
        </button>
      )}
    </div>
  );
}
