// ─── SHARED FOOTER ────────────────────────────────────────────
export function FormFooter({
  onClose,
  onSubmit,
  disabled,
}: {
  onClose: () => void;
  onSubmit: () => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex gap-3 pt-6 border-t mt-6" style={{ borderColor: "rgba(30,80,50,0.08)" }}>
      <button
        onClick={onClose}
        className="flex-1 py-2.5 rounded-xl border-2 border-gray-200 text-[13px] font-semibold text-text-muted hover:bg-gray-50 transition-all">
        Cancel
      </button>
      <button
        onClick={onSubmit}
        disabled={disabled}
        className="flex-1 py-2.5 rounded-xl bg-green-800 text-white text-[13px] font-semibold hover:bg-green-700 transition-all disabled:opacity-50">
        Add to Bank
      </button>
    </div>
  );
}
