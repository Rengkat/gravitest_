"use client";

import { Users, GraduationCap, Briefcase, Shield, UserCheck, UserX, MailCheck } from "lucide-react";
import type { UserStats } from "../types";
import { MiniStatCard, Card } from "./Primitives";

// This used to show registration trend charts, revenue breakdowns, top
// exam targets, and per-role average scores — none of which have a real
// data source at the user-list level (would need dedicated analytics
// aggregation across sessions/subscriptions, which is a bigger backend
// feature than this page). What's left is genuinely real: role and
// activation breakdowns, composed from the same count queries the quick
// stat bar uses.
export function AnalyticsDashboard({ stats }: { stats: UserStats }) {
  const activePct = stats.total > 0 ? Math.round((stats.active / stats.total) * 100) : 0;
  const verifiedPct = stats.total > 0 ? Math.round((stats.emailVerified / stats.total) * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MiniStatCard icon={Users} label="Total Users" value={stats.total.toLocaleString()} color="#2e8b57" />
        <MiniStatCard
          icon={GraduationCap}
          label="Students"
          value={stats.students.toLocaleString()}
          color="#0284c7"
        />
        <MiniStatCard
          icon={Briefcase}
          label="Professionals"
          value={stats.professionals.toLocaleString()}
          color="#8b5cf6"
        />
        <MiniStatCard icon={Shield} label="Admins" value={stats.admins.toLocaleString()} color="#f97316" />
      </div>

      <Card className="p-6">
        <h3 className="font-serif text-lg text-green-900 mb-4">Account Status</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <div className="flex justify-between text-[13px] mb-1.5">
              <span className="text-text-muted flex items-center gap-1.5">
                <UserCheck size={13} className="text-green-600" /> Active
              </span>
              <span className="font-semibold text-green-900">
                {stats.active.toLocaleString()} ({activePct}%)
              </span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2">
              <div className="bg-green-600 h-2 rounded-full" style={{ width: `${activePct}%` }} />
            </div>
            <div className="flex justify-between text-[12px] mt-2 text-text-muted">
              <span className="flex items-center gap-1.5">
                <UserX size={12} /> Inactive
              </span>
              <span>{stats.inactive.toLocaleString()}</span>
            </div>
          </div>

          <div>
            <div className="flex justify-between text-[13px] mb-1.5">
              <span className="text-text-muted flex items-center gap-1.5">
                <MailCheck size={13} className="text-blue-600" /> Email Verified
              </span>
              <span className="font-semibold text-green-900">
                {stats.emailVerified.toLocaleString()} ({verifiedPct}%)
              </span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2">
              <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${verifiedPct}%` }} />
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="font-serif text-lg text-green-900 mb-4">Role Distribution</h3>
        <div className="space-y-3">
          {[
            { label: "Students", value: stats.students, color: "#0284c7" },
            { label: "Professionals", value: stats.professionals, color: "#8b5cf6" },
            { label: "Admins", value: stats.admins, color: "#f97316" },
          ].map(({ label, value, color }) => {
            const pct = stats.total > 0 ? Math.round((value / stats.total) * 100) : 0;
            return (
              <div key={label}>
                <div className="flex justify-between text-[13px] mb-1">
                  <span className="text-text-muted">{label}</span>
                  <span className="font-semibold text-green-900">
                    {value.toLocaleString()} ({pct}%)
                  </span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div className="h-2 rounded-full" style={{ width: `${pct}%`, background: color }} />
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
