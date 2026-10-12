/* ─────────────────────────────────────────────────────────
   STATUS BADGE
───────────────────────────────────────────────────────── */
export default function StatusBadge({ status }: { status: "new" | "updated" }) {
  if (status === "new") {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide bg-green-500/10 text-green-600 ml-2 shrink-0">
        New
      </span>
    );
  }
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ml-2 shrink-0"
      style={{ background: "rgba(245,200,66,0.15)", color: "#d4a017" }}>
      Updated
    </span>
  );
}
