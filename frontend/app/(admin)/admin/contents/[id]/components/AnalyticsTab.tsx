"use client";

import { Eye, Download, Star, TrendingUp, Users, BarChart3, Activity, Award } from "lucide-react";
import type { ContentItem } from "@/types/admin-contents";
import { MiniStatCard } from "../../../contents/components/SharedPrimitives";

function StatRow({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div
      className="flex items-center justify-between py-2.5 border-b last:border-0"
      style={{ borderColor: "rgba(30,80,50,0.06)" }}>
      <span className="text-[12px] text-text-muted">{label}</span>
      <div className="text-right">
        <div className="text-[13px] font-bold text-green-900">{value}</div>
        {sub && <div className="text-[10px] text-text-muted">{sub}</div>}
      </div>
    </div>
  );
}

export function AnalyticsTab({ item }: { item: ContentItem }) {
  // Simulated rating distribution from ratingCount
  const total = item.ratingCount || 0;
  const dist = [
    { star: 5, count: Math.round(total * 0.6) },
    { star: 4, count: Math.round(total * 0.22) },
    { star: 3, count: Math.round(total * 0.1) },
    { star: 2, count: Math.round(total * 0.05) },
    { star: 1, count: Math.round(total * 0.03) },
  ];

  const avgCompletionColor =
    item.completionRate >= 70 ? "#10b981" : item.completionRate >= 40 ? "#f59e0b" : "#ef4444";

  return (
    <div className="space-y-5">
      {/* Top stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <MiniStatCard
          icon={Eye}
          label="Total Views"
          value={item.views.toLocaleString()}
          color="#3b82f6"
          trend={12}
        />
        <MiniStatCard
          icon={Download}
          label="Downloads"
          value={item.downloads.toLocaleString()}
          color="#8b5cf6"
          trend={8}
        />
        <MiniStatCard icon={Star} label="Avg Rating" value={`${item.rating}/5`} color="#f59e0b" />
        <MiniStatCard
          icon={TrendingUp}
          label="Revenue"
          value={item.revenue > 0 ? `₦${(item.revenue / 1000).toFixed(0)}K` : "—"}
          color="#10b981"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Engagement */}
        <div
          className="rounded-2xl bg-white border p-5"
          style={{ borderColor: "rgba(30,80,50,0.08)" }}>
          <h2 className="text-[11px] font-bold uppercase tracking-wider text-text-muted mb-4">
            Engagement
          </h2>
          <StatRow
            label="Completion Rate"
            value={`${item.completionRate}%`}
            sub={item.completionRate >= 60 ? "Good" : "Needs improvement"}
          />
          <StatRow
            label="Conversion Rate"
            value={`${item.conversionRate}%`}
            sub="Viewers who purchased/accessed"
          />
          <StatRow label="Bounce Rate" value={`${item.bounceRate}%`} sub="Left within 30 seconds" />
          <StatRow label="Likes" value={item.likes.toLocaleString()} />
          <StatRow label="Total Ratings" value={item.ratingCount.toLocaleString()} />

          {/* Completion bar */}
          <div className="mt-4 pt-4 border-t" style={{ borderColor: "rgba(30,80,50,0.06)" }}>
            <div className="flex items-center justify-between text-[11px] mb-1.5">
              <span className="text-text-muted font-semibold">Completion Rate</span>
              <span className="font-bold" style={{ color: avgCompletionColor }}>
                {item.completionRate}%
              </span>
            </div>
            <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${item.completionRate}%`, background: avgCompletionColor }}
              />
            </div>
          </div>
        </div>

        {/* Rating distribution */}
        <div
          className="rounded-2xl bg-white border p-5"
          style={{ borderColor: "rgba(30,80,50,0.08)" }}>
          <h2 className="text-[11px] font-bold uppercase tracking-wider text-text-muted mb-4">
            Rating Distribution
          </h2>

          <div className="flex gap-6 flex-wrap mb-5">
            <div className="text-center">
              <div className="text-[44px] font-bold text-green-900 leading-none">
                {item.rating.toFixed(1)}
              </div>
              <div className="flex justify-center gap-0.5 my-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    size={12}
                    className={
                      s <= Math.round(item.rating)
                        ? "fill-amber-400 text-amber-400"
                        : "fill-gray-200 text-gray-200"
                    }
                  />
                ))}
              </div>
              <div className="text-[11px] text-text-muted">{total.toLocaleString()} ratings</div>
            </div>
            <div className="flex-1 min-w-[140px] space-y-1.5">
              {dist.map(({ star, count }) => {
                const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                return (
                  <div key={star} className="flex items-center gap-2 text-[12px]">
                    <span className="text-text-muted w-3">{star}</span>
                    <Star size={10} className="fill-amber-400 text-amber-400 shrink-0" />
                    <div className="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-amber-400"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-text-muted w-5 text-right">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Content metadata */}
      <div
        className="rounded-2xl bg-white border p-5"
        style={{ borderColor: "rgba(30,80,50,0.08)" }}>
        <h2 className="text-[11px] font-bold uppercase tracking-wider text-text-muted mb-4">
          Content Details
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-8 gap-y-0">
          <StatRow label="File Size" value={item.size} />
          <StatRow
            label="Content Quality"
            value={item.quality.charAt(0).toUpperCase() + item.quality.slice(1)}
          />
          <StatRow label="Downloadable" value={item.isDownloadable ? "Yes" : "No"} />
          <StatRow label="DRM Protected" value={item.drmProtected ? "Yes" : "No"} />
          <StatRow label="Date Added" value={item.dateAdded} />
          <StatRow label="Last Updated" value={item.dateUpdated} />
          {item.pages && <StatRow label="Pages" value={item.pages} />}
          {item.duration && <StatRow label="Duration" value={item.duration} />}
        </div>
      </div>
    </div>
  );
}
