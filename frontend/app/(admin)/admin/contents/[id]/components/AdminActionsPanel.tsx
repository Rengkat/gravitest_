"use client";

import {
  Globe,
  EyeOff,
  Star,
  StarOff,
  Pencil,
  Lock,
  Trash2,
  Download,
  ExternalLink,
} from "lucide-react";
import type { ContentItem } from "@/types/admin-contents";
import type { AdminAction } from "../Usecontentdetail";
import Link from "next/link";

interface ActionDef {
  type: AdminAction;
  label: string;
  hint: string;
  icon: any;
  variant: "primary" | "warning" | "danger" | "ghost";
}

function buildActions(item: ContentItem): ActionDef[] {
  const actions: ActionDef[] = [];

  // Publish / unpublish
  if (item.status === "draft" || item.status === "archived") {
    actions.push({
      type: "publish",
      label: "Publish Content",
      hint: "Make visible to eligible students.",
      icon: Globe,
      variant: "primary",
    });
  } else {
    actions.push({
      type: "unpublish",
      label: "Unpublish",
      hint: "Hide from students. Keeps the file.",
      icon: EyeOff,
      variant: "warning",
    });
  }

  // Feature / unfeature
  actions.push(
    item.isFeatured
      ? {
          type: "unfeature",
          label: "Remove from Featured",
          hint: "Remove from library homepage.",
          icon: StarOff,
          variant: "ghost",
        }
      : {
          type: "feature",
          label: "Mark as Featured",
          hint: "Pin to the library homepage.",
          icon: Star,
          variant: "ghost",
        },
  );

  // Always-available
  actions.push(
    {
      type: "edit",
      label: "Edit Details",
      hint: "Update title, description, tags.",
      icon: Pencil,
      variant: "ghost",
    },
    {
      type: "change_access",
      label: "Change Access / Price",
      hint: "Update access level or price.",
      icon: Lock,
      variant: "ghost",
    },
  );

  // Danger last
  actions.push({
    type: "delete",
    label: "Delete Content",
    hint: "Soft-delete. Requires title confirmation.",
    icon: Trash2,
    variant: "danger",
  });

  return actions;
}

const VARIANT_CLS: Record<string, string> = {
  primary:
    "w-full flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-green-800 text-white hover:bg-green-700 transition-all text-[13px] font-semibold shadow-sm",
  warning:
    "w-full flex items-center gap-2.5 px-4 py-2.5 rounded-xl border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 transition-all text-[13px] font-semibold",
  danger:
    "w-full flex items-center gap-2.5 px-4 py-2.5 rounded-xl border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 transition-all text-[13px] font-semibold",
  ghost:
    "w-full flex items-center gap-2.5 px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-green-900 hover:bg-cream transition-all text-[13px] font-medium",
};

export function AdminActionsPanel({
  item,
  onAction,
}: {
  item: ContentItem;
  onAction: (a: AdminAction) => void;
}) {
  return (
    <aside aria-label="Admin Actions">
      <div
        className="rounded-2xl bg-white border p-5 sticky top-6"
        style={{ borderColor: "rgba(30,80,50,0.08)" }}>
        <h2 className="text-[11px] font-bold uppercase tracking-wider text-text-muted mb-4">
          Admin Actions
        </h2>

        <ul className="space-y-2.5 mb-5">
          {buildActions(item).map((a) => (
            <li key={a.type}>
              <button
                className={VARIANT_CLS[a.variant]}
                onClick={() => onAction(a.type)}
                aria-describedby={`hint-${a.type}`}>
                <a.icon size={14} className="shrink-0" />
                {a.label}
              </button>
              <p id={`hint-${a.type}`} className="text-[10px] text-text-muted mt-0.5 pl-1">
                {a.hint}
              </p>
            </li>
          ))}
        </ul>

        {/* Divider + quick links */}
        <div className="border-t pt-4 space-y-2" style={{ borderColor: "rgba(30,80,50,0.08)" }}>
          <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted mb-2">
            Quick Links
          </p>
          <Link
            href={`/library/${item.id}`}
            target="_blank"
            className="flex items-center gap-2 text-[12px] text-green-700 hover:underline">
            <ExternalLink size={12} /> Student view ↗
          </Link>
          {item.isDownloadable && (
            <a
              href={item?.fileUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 text-[12px] text-green-700 hover:underline">
              <Download size={12} /> Download file ↗
            </a>
          )}
        </div>
      </div>
    </aside>
  );
}
