"use client";

import {
  Library,
  BookOpen,
  Video,
  Image,
  FileText,
  Headphones,
  Gift,
  Crown,
  Shield,
  DollarSign,
  Eye,
  Download,
  Star,
  Users,
  GraduationCap,
  Briefcase,
} from "lucide-react";
import type { ContentStats, ContentType } from "@/types/admin-contents";
import { CONTENT_TYPES, ACCESS_LEVELS } from "@/lib/constants/contents";
import { MiniStatCard, Card } from "./SharedPrimitives";

export function AnalyticsDashboard({ stats }: { stats: ContentStats }) {
  const totalRevenue = stats.totalRevenue;

  return (
    <div className="space-y-6">
      {/* ── Quick stats ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
        <MiniStatCard
          icon={Library}
          label="Total Content"
          value={stats.totalItems.toLocaleString()}
          color="#2e8b57"
          trend={8}
        />
        <MiniStatCard
          icon={BookOpen}
          label="E-Books"
          value={(stats.byType.ebook ?? 0).toLocaleString()}
          color="#2e8b57"
        />
        <MiniStatCard
          icon={Video}
          label="Videos"
          value={(stats.byType.video ?? 0).toLocaleString()}
          color="#ef4444"
        />
        <MiniStatCard
          icon={FileText}
          label="Documents"
          value={(stats.byType.document ?? 0).toLocaleString()}
          color="#f59e0b"
        />
        <MiniStatCard
          icon={Gift}
          label="Free"
          value={stats.byAccess.free.toLocaleString()}
          color="#10b981"
        />
        <MiniStatCard
          icon={Crown}
          label="Premium"
          value={stats.byAccess.premium.toLocaleString()}
          color="#f59e0b"
        />
        <MiniStatCard
          icon={Eye}
          label="Total Views"
          value={`${(stats.totalViews / 1000000).toFixed(1)}M`}
          color="#3b82f6"
          trend={12}
        />
        <MiniStatCard
          icon={DollarSign}
          label="Revenue"
          value={`₦${(stats.totalRevenue / 1000000).toFixed(1)}M`}
          color="#8b5cf6"
          trend={5}
        />
      </div>

      {/* ── Row 1: type breakdown + revenue by type ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="font-serif text-lg text-green-900 mb-4">Content by Type</h3>
          <div className="space-y-3">
            {(
              Object.entries(CONTENT_TYPES) as [ContentType, (typeof CONTENT_TYPES)[ContentType]][]
            ).map(([type, cfg]) => {
              const count = stats.byType[type] ?? 0;
              const pct =
                stats.totalItems > 0 ? ((count / stats.totalItems) * 100).toFixed(1) : "0";
              const Icon = cfg.icon;
              return (
                <div key={type} className="flex items-center gap-3">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: cfg.bg }}>
                    <Icon size={16} style={{ color: cfg.color }} />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between mb-1">
                      <span className="text-[13px] font-semibold text-green-900">{cfg.label}</span>
                      <span className="text-[13px] font-bold text-green-900">
                        {count.toLocaleString()}
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-cream overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${pct}%`, background: cfg.color }}
                      />
                    </div>
                  </div>
                  <span className="text-[11px] text-text-muted w-10 text-right">{pct}%</span>
                </div>
              );
            })}
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="font-serif text-lg text-green-900 mb-4">Revenue by Content Type</h3>
          <div className="space-y-3 mb-6">
            {stats.revenueByType.map((r) => {
              const cfg = CONTENT_TYPES[r.type];
              const Icon = cfg?.icon ?? FileText;
              const pct = totalRevenue > 0 ? ((r.revenue / totalRevenue) * 100).toFixed(1) : "0";
              return (
                <div key={r.type} className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: cfg?.bg ?? "#f3f4f6" }}>
                    <Icon size={14} style={{ color: cfg?.color ?? "#6b7280" }} />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between mb-1">
                      <span className="text-[13px] text-green-900">{cfg?.label ?? r.type}</span>
                      <span className="text-[13px] font-bold text-green-900">
                        ₦{(r.revenue / 1000000).toFixed(1)}M
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-cream overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${pct}%`, background: cfg?.color ?? "#6b7280" }}
                      />
                    </div>
                  </div>
                  <span className="text-[11px] text-text-muted w-10 text-right">{pct}%</span>
                </div>
              );
            })}
          </div>

          {/* Access breakdown */}
          <h4 className="text-[13px] font-semibold text-green-900 mb-3">Revenue by Access Level</h4>
          <div className="grid grid-cols-3 gap-3">
            {(
              Object.entries(ACCESS_LEVELS) as [
                string,
                (typeof ACCESS_LEVELS)[keyof typeof ACCESS_LEVELS],
              ][]
            ).map(([level, cfg]) => {
              const Icon = cfg.icon;
              const count = stats.byAccess[level as keyof typeof stats.byAccess];
              return (
                <div
                  key={level}
                  className="p-3 rounded-xl text-center"
                  style={{ background: cfg.bg }}>
                  <Icon size={18} className="mx-auto mb-1" style={{ color: cfg.color }} />
                  <div className="text-[15px] font-bold" style={{ color: cfg.color }}>
                    {count.toLocaleString()}
                  </div>
                  <div className="text-[10px] font-semibold" style={{ color: cfg.color }}>
                    {cfg.label}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* ── Row 2: audience + monthly views + top authors ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Audience split */}
        <Card className="p-6">
          <h3 className="font-serif text-lg text-green-900 mb-4">Audience Distribution</h3>
          <div className="space-y-4">
            <AudienceBar
              label="Secondary School"
              icon={GraduationCap}
              count={stats.byAudience.secondary}
              total={stats.totalItems}
              color="#0284c7"
            />
            <AudienceBar
              label="Professional"
              icon={Briefcase}
              count={stats.byAudience.professional}
              total={stats.totalItems}
              color="#7c3aed"
            />
          </div>

          <div
            className="mt-6 pt-4 border-t space-y-2"
            style={{ borderColor: "rgba(30,80,50,0.08)" }}>
            <h4 className="text-[13px] font-semibold text-green-900 mb-3">Engagement</h4>
            <MetricRow
              label="Total Downloads"
              value={stats.totalDownloads.toLocaleString()}
              icon={Download}
              color="#3b82f6"
            />
            <MetricRow
              label="Average Rating"
              value={`${stats.averageRating} ★`}
              icon={Star}
              color="#f59e0b"
            />
            <MetricRow
              label="Featured Items"
              value={stats.featuredItems}
              icon={Star}
              color="#9333ea"
            />
            <MetricRow
              label="Trending Items"
              value={stats.trendingItems}
              icon={Eye}
              color="#ef4444"
            />
          </div>
        </Card>

        {/* Monthly views bar chart */}
        <Card className="p-6 lg:col-span-2">
          <h3 className="font-serif text-lg text-green-900 mb-4">Monthly Views (2024)</h3>
          <div className="h-48 flex items-end gap-1.5">
            {stats.viewsByMonth.map((m, i) => {
              const max = Math.max(...stats.viewsByMonth.map((x) => x.views));
              const pct = (m.views / max) * 100;
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
                  <span className="text-[9px] font-semibold text-green-900 opacity-0 group-hover:opacity-100 transition-opacity">
                    {(m.views / 1000).toFixed(0)}K
                  </span>
                  <div
                    className="w-full rounded-t-md hover:opacity-80 transition-all cursor-default"
                    style={{
                      height: `${Math.max(pct, 3)}%`,
                      background: "linear-gradient(180deg, #2e8b57, #1a4a2e)",
                      minHeight: "4px",
                    }}
                  />
                  <span className="text-[9px] text-text-muted">{m.month}</span>
                </div>
              );
            })}
          </div>

          {/* Top subjects */}
          <div className="mt-6 pt-4 border-t" style={{ borderColor: "rgba(30,80,50,0.08)" }}>
            <h4 className="text-[13px] font-semibold text-green-900 mb-3">Top Subjects by Views</h4>
            <div className="grid grid-cols-2 gap-2">
              {stats.topSubjects.slice(0, 6).map((s, i) => (
                <div key={s.subject} className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-green-800 text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                    {i + 1}
                  </span>
                  <div className="min-w-0">
                    <div className="text-[12px] font-semibold text-green-900 capitalize truncate">
                      {s.subject}
                    </div>
                    <div className="text-[10px] text-text-muted">
                      {s.views.toLocaleString()} views
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>

      {/* ── Top authors ── */}
      <Card className="p-6">
        <h3 className="font-serif text-lg text-green-900 mb-4">Top Content Creators</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
          {stats.topAuthors.map((author, i) => (
            <div key={author.name} className="p-4 rounded-xl bg-cream/40 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-green-800 text-white flex items-center justify-center text-[13px] font-bold shrink-0">
                {author.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .slice(0, 2)}
              </div>
              <div className="min-w-0">
                <div className="text-[13px] font-semibold text-green-900 truncate">
                  {author.name}
                </div>
                <div className="text-[11px] text-text-muted">{author.items} items</div>
                <div className="text-[11px] font-semibold text-green-700">
                  ₦{(author.revenue / 1000000).toFixed(1)}M
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

// ── Internal helpers ─────────────────────────────────────────
function AudienceBar({
  label,
  icon: Icon,
  count,
  total,
  color,
}: {
  label: string;
  icon: any;
  count: number;
  total: number;
  color: string;
}) {
  const pct = total > 0 ? ((count / total) * 100).toFixed(1) : "0";
  return (
    <div className="flex items-center gap-3">
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: `${color}15` }}>
        <Icon size={16} style={{ color }} />
      </div>
      <div className="flex-1">
        <div className="flex justify-between mb-1">
          <span className="text-[13px] font-semibold text-green-900">{label}</span>
          <span className="text-[13px] font-bold text-green-900">{count.toLocaleString()}</span>
        </div>
        <div className="h-2 rounded-full bg-cream overflow-hidden">
          <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
        </div>
      </div>
      <span className="text-[12px] text-text-muted w-12 text-right">{pct}%</span>
    </div>
  );
}

function MetricRow({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: string | number;
  icon: any;
  color: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center"
          style={{ background: `${color}15` }}>
          <Icon size={13} style={{ color }} />
        </div>
        <span className="text-[12px] text-green-900">{label}</span>
      </div>
      <span className="text-[12px] font-bold text-green-900">{value}</span>
    </div>
  );
}
