"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, Eye, Flag, Star, MessageSquare, ChevronLeft, ChevronRight } from "lucide-react";
import type { AIConversation, AIFeature } from "../../types";
import {
  FEATURE_LABELS,
  FEATURE_COLORS,
  MODEL_LABELS,
  STATUS_CONFIG,
  formatTokens,
  formatCost,
} from "../../components/AISessionDetails";

interface Props {
  conversations: AIConversation[];
  basePath?: string;
}

const PAGE_SIZE = 12;

export function ConversationList({
  conversations,
  basePath = "/admin/ai-logs/conversations",
}: Props) {
  const [search, setSearch] = useState("");
  const [filterFeature, setFilterFeature] = useState<string>("all");
  const [filterFlagged, setFilterFlagged] = useState<"all" | "flagged" | "clean">("all");
  const [page, setPage] = useState(1);

  const features = Array.from(new Set(conversations.map((c) => c.feature)));

  const filtered = conversations.filter((c) => {
    const q = search.toLowerCase();
    const matchQ =
      !q ||
      `${c.userName} ${c.userEmail} ${c.subject ?? ""} ${c.topic ?? ""}`.toLowerCase().includes(q);
    const matchFeature = filterFeature === "all" || c.feature === filterFeature;
    const matchFlag =
      filterFlagged === "all" ? true : filterFlagged === "flagged" ? c.isFlagged : !c.isFlagged;
    return matchQ && matchFeature && matchFlag;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const slice = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            placeholder="Search by user, email, subject…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-200 text-[13px] focus:outline-none focus:ring-2 focus:ring-green-500/30"
          />
        </div>

        <select
          title="Feature filter"
          value={filterFeature}
          onChange={(e) => {
            setFilterFeature(e.target.value);
            setPage(1);
          }}
          className="px-3 py-2 rounded-lg border border-gray-200 text-[13px] focus:outline-none">
          <option value="all">All Features</option>
          {features.map((f) => (
            <option key={f} value={f}>
              {FEATURE_LABELS[f as AIFeature] ?? f}
            </option>
          ))}
        </select>

        <div className="flex gap-1">
          {(["all", "flagged", "clean"] as const).map((f) => (
            <button
              key={f}
              onClick={() => {
                setFilterFlagged(f);
                setPage(1);
              }}
              className={`px-3 py-2 rounded-lg text-[12px] font-medium transition-all border ${
                filterFlagged === f
                  ? f === "flagged"
                    ? "bg-red-600 text-white border-red-600"
                    : "bg-green-800 text-white border-green-800"
                  : "bg-white border-gray-200 text-text-muted hover:bg-cream"
              }`}>
              {f === "all" ? "All" : f === "flagged" ? "Flagged" : "Clean"}
            </button>
          ))}
        </div>
      </div>

      <p className="text-[12px] text-text-muted">
        Showing <strong className="text-green-900">{filtered.length}</strong> conversation
        {filtered.length !== 1 ? "s" : ""}
      </p>

      <div
        className="bg-white rounded-xl border overflow-hidden"
        style={{ borderColor: "rgba(30,80,50,0.08)" }}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-cream/30 border-b" style={{ borderColor: "rgba(30,80,50,0.08)" }}>
              <tr>
                {[
                  "User",
                  // "Feature",
                  "Model",
                  "Subject",
                  "Messages",
                  "Tokens",
                  "Cost",
                  "Status",
                  "Last Active",
                  "",
                ].map((h) => (
                  <th
                    key={h}
                    className="text-left px-4 py-3 text-[11px] font-semibold text-text-muted whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: "rgba(30,80,50,0.08)" }}>
              {slice.map((conv) => {
                const statusCfg = STATUS_CONFIG[conv.status];
                const featCfg = FEATURE_COLORS[conv.feature];
                return (
                  <tr key={conv.id} className="hover:bg-cream/20 transition-colors group">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-green-100 text-green-800 flex items-center justify-center text-[10px] font-bold shrink-0">
                          {conv.userName
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .slice(0, 2)}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[12px] font-medium text-green-900 truncate max-w-[120px]">
                              {conv.userName}
                            </span>
                            {conv.isFlagged && <Flag size={10} className="text-red-500 shrink-0" />}
                            {conv.userRating === 5 && (
                              <Star size={10} className="fill-amber-400 text-amber-400 shrink-0" />
                            )}
                          </div>
                          <div className="text-[10px] text-text-muted truncate max-w-[120px]">
                            {conv.userEmail}
                          </div>
                        </div>
                      </div>
                    </td>
                    {/* <td className="px-4 py-3">
                      <span
                        className="px-2 py-0.5 rounded-full text-[10px] font-semibold whitespace-nowrap"
                        style={{ background: featCfg.bg, color: featCfg.color }}>
                        {FEATURE_LABELS[conv.feature]}
                      </span>
                    </td> */}
                    <td className="px-4 py-3 text-[11px] text-text-muted whitespace-nowrap">
                      {MODEL_LABELS[conv.model]}
                    </td>
                    <td className="px-4 py-3 text-[13px] text-green-900">{conv.subject ?? "—"}</td>
                    <td className="px-4 py-3 text-center text-[13px] text-green-900">
                      <span className="inline-flex items-center gap-1">
                        <MessageSquare size={11} className="text-text-muted" />
                        {conv.messageCount}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-[12px] text-text-muted whitespace-nowrap">
                      {formatTokens(conv.totalTokens)}
                    </td>
                    <td className="px-4 py-3 text-right text-[12px] font-semibold text-green-900 whitespace-nowrap">
                      {formatCost(conv.totalCost)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="px-2 py-0.5 rounded-full text-[10px] font-semibold whitespace-nowrap"
                        style={{ background: statusCfg.bg, color: statusCfg.color }}>
                        {statusCfg.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[12px] text-text-muted whitespace-nowrap">
                      {new Date(conv.lastActivity).toLocaleString("en-NG", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Link href={`${basePath}/${conv.id}`}>
                        <button
                          className="p-1.5 rounded-lg hover:bg-green-50 transition-colors"
                          aria-label="View">
                          <Eye size={14} className="text-text-muted hover:text-green-600" />
                        </button>
                      </Link>
                    </td>
                  </tr>
                );
              })}
              {slice.length === 0 && (
                <tr>
                  <td colSpan={10} className="px-4 py-12 text-center text-[13px] text-text-muted">
                    No conversations match your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div
            className="px-5 py-3 border-t flex items-center justify-between"
            style={{ borderColor: "rgba(30,80,50,0.08)" }}>
            <p className="text-[11px] text-text-muted">
              Page {page} of {totalPages} · {filtered.length} sessions
            </p>
            <div className="flex items-center gap-1">
              <button
                title="Previous"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1.5 rounded-lg border border-gray-200 hover:bg-cream disabled:opacity-40 transition-all">
                <ChevronLeft size={14} />
              </button>
              <button
                title="Next"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-1.5 rounded-lg border border-gray-200 hover:bg-cream disabled:opacity-40 transition-all">
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
