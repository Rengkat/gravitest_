"use client";

import { useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { TrendingUp, TrendingDown } from "lucide-react";

interface DailyPoint {
  date: string;
  cost: number;
  tokens: number;
}

interface Props {
  data: DailyPoint[];
  title?: string;
}

function CustomTooltip({ active, payload, label, mode }: any) {
  if (!active || !payload || !payload.length) return null;
  const value = payload[0].value;
  return (
    <div className="bg-green-900 text-white rounded-lg px-3 py-2 shadow-lg">
      <div className="text-[11px] font-semibold">{label}</div>
      <div className="text-[12px] text-green-300">
        {mode === "cost" ? `$${value.toFixed(2)}` : `${(value / 1000).toFixed(1)}K tokens`}
      </div>
    </div>
  );
}

export function TokenUsageChart({ data, title = "Daily Token Usage & Cost" }: Props) {
  const [mode, setMode] = useState<"cost" | "tokens">("cost");

  if (!data || data.length === 0) {
    return (
      <div
        className="bg-white rounded-2xl border p-6 flex items-center justify-center h-48 text-text-muted text-[13px]"
        style={{ borderColor: "rgba(30,80,50,0.08)" }}>
        No usage data available
      </div>
    );
  }

  const totalCost = data.reduce((s, d) => s + d.cost, 0);
  const totalTokens = data.reduce((s, d) => s + d.tokens, 0);

  const half = Math.floor(data.length / 2);
  const firstHalfAvg = data.slice(0, half).reduce((s, d) => s + d.cost, 0) / (half || 1);
  const secondHalfAvg =
    data.slice(half).reduce((s, d) => s + d.cost, 0) / (data.length - half || 1);
  const trendingUp = secondHalfAvg > firstHalfAvg;

  return (
    <div className="bg-white rounded-2xl border p-6" style={{ borderColor: "rgba(30,80,50,0.08)" }}>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h3 className="font-serif text-lg text-green-900">{title}</h3>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-[12px] text-text-muted">
              Total: <strong className="text-green-900">${totalCost.toFixed(2)}</strong>
            </span>
            <span className="text-[12px] text-text-muted">
              Tokens: <strong className="text-green-900">{(totalTokens / 1000).toFixed(0)}K</strong>
            </span>
            <span
              className={`flex items-center gap-0.5 text-[11px] font-semibold ${
                trendingUp ? "text-red-500" : "text-green-600"
              }`}>
              {trendingUp ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
              {trendingUp ? "Rising" : "Falling"}
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          {(["cost", "tokens"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all ${
                mode === m
                  ? "bg-green-800 text-white"
                  : "bg-gray-100 text-text-muted hover:bg-gray-200"
              }`}>
              {m === "cost" ? "Cost ($)" : "Tokens"}
            </button>
          ))}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="tokenUsageGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2e8b57" stopOpacity={0.3} />
              <stop offset="100%" stopColor="#2e8b57" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 10, fill: "#94a3b8" }}
            axisLine={false}
            tickLine={false}
            interval={Math.max(0, Math.floor(data.length / 6) - 1)}
          />
          <YAxis
            tick={{ fontSize: 10, fill: "#94a3b8" }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => (mode === "cost" ? `$${v}` : `${(v / 1000).toFixed(0)}K`)}
          />
          <Tooltip content={<CustomTooltip mode={mode} />} />
          <Area
            type="monotone"
            dataKey={mode}
            stroke="#2e8b57"
            strokeWidth={2}
            fill="url(#tokenUsageGradient)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
