"use client";

import { Check, X, UserCheck, Trash2, Download } from "lucide-react";

interface Props {
  count: number;
  onActivate: () => void;
  onDelete: () => void;
  onExport: () => void;
  onClear: () => void;
}

export function BulkActionsBar({ count, onActivate, onDelete, onExport, onClear }: Props) {
  return (
    <div className="mb-4 p-4 rounded-2xl bg-green-800 text-white flex items-center justify-between flex-wrap gap-3">
      <div className="flex items-center gap-3">
        <Check size={18} />
        <span className="text-[14px] font-semibold">
          {count} item{count > 1 ? "s" : ""} selected
        </span>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <BulkBtn Icon={UserCheck} label="Publish" onClick={onActivate} />
        <BulkBtn Icon={Download} label="Export" onClick={onExport} />
        <BulkBtn Icon={Trash2} label="Delete" onClick={onDelete} danger />
        <button
          onClick={onClear}
          className="ml-2 flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-[13px] font-medium">
          <X size={14} /> Clear
        </button>
      </div>
    </div>
  );
}

function BulkBtn({
  Icon,
  label,
  onClick,
  danger = false,
}: {
  Icon: any;
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-[13px] font-medium ${
        danger ? "bg-red-500/30 hover:bg-red-500/50" : "bg-white/10 hover:bg-white/20"
      }`}>
      <Icon size={14} />
      {label}
    </button>
  );
}
