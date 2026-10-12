import { Library as LibraryIcon } from "lucide-react";

interface EmptyStateProps {
  onReset: () => void;
}

export default function EmptyState({ onReset }: EmptyStateProps) {
  return (
    <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
      <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
        <LibraryIcon size={28} className="text-gray-400" />
      </div>
      <h3 className="text-[16px] font-bold text-gray-700 mb-2">No resources found</h3>
      <p className="text-[13px] text-gray-400 mb-4">
        Try adjusting your filters or search query
      </p>
      <button
        onClick={onReset}
        className="px-5 py-2 rounded-xl bg-green-800 text-white text-[13px] font-semibold hover:bg-green-700 transition-colors"
      >
        Reset filters
      </button>
    </div>
  );
}
