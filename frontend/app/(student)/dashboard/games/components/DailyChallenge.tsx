"use client";

import Link from "next/link";
import { Flame, Clock, Zap, ChevronRight } from "lucide-react";
import { useState, useEffect } from "react";

function useCountdown() {
  const [timeLeft, setTimeLeft] = useState({ h: 0, m: 0, s: 0 });

  useEffect(() => {
    const calc = () => {
      const now = new Date();
      const midnight = new Date(now);
      midnight.setHours(24, 0, 0, 0);
      const diff = Math.floor((midnight.getTime() - now.getTime()) / 1000);
      setTimeLeft({
        h: Math.floor(diff / 3600),
        m: Math.floor((diff % 3600) / 60),
        s: diff % 60,
      });
    };
    calc();
    const id = setInterval(calc, 1000);
    return () => clearInterval(id);
  }, []);

  return timeLeft;
}

const pad = (n: number) => String(n).padStart(2, "0");

export default function DailyChallenge() {
  const { h, m, s } = useCountdown();

  return (
    <div
      className="relative mt-8 rounded-2xl overflow-hidden border border-orange-500/20 p-5"
      style={{
        background: "linear-gradient(135deg, #1c0a00, #2d1500, #1c0a00)",
        boxShadow: "0 0 40px -10px rgba(249,115,22,0.3)",
      }}>
      <div className="absolute top-0 right-0 w-48 h-48 bg-orange-500 rounded-full blur-3xl opacity-10 pointer-events-none" />

      <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        {/* Left */}
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center shadow-lg shadow-orange-500/30 shrink-0">
            <Flame size={28} className="text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-black text-orange-400 uppercase tracking-wider">
                Daily Challenge
              </span>
              <span className="px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-300 text-[10px] font-bold border border-orange-500/30">
                Live
              </span>
            </div>
            <h3 className="text-[16px] font-black text-white">JAMB Mathematics Speed Run</h3>
            <p className="text-[13px] text-gray-400 mt-0.5">
              Solve 20 JAMB questions in under 10 minutes • Triple XP today!
            </p>
          </div>
        </div>

        {/* Right: timer + CTA */}
        <div className="flex flex-col sm:items-end gap-3 shrink-0">
          {/* Countdown */}
          <div className="flex items-center gap-1.5">
            <Clock size={12} className="text-orange-400" />
            <span className="text-[12px] text-gray-400 font-medium">Resets in</span>
            <div className="flex items-center gap-1 font-mono">
              {[pad(h), pad(m), pad(s)].map((unit, i) => (
                <span key={i} className="flex items-center">
                  <span className="text-[14px] font-black text-orange-300 bg-orange-500/10 px-1.5 py-0.5 rounded">
                    {unit}
                  </span>
                  {i < 2 && <span className="text-orange-500 mx-0.5">:</span>}
                </span>
              ))}
            </div>
          </div>

          {/* XP reward */}
          <div className="flex items-center gap-1.5 text-amber-400">
            <Zap size={13} className="fill-amber-400" />
            <span className="text-[12px] font-bold">+900 XP (3× bonus)</span>
          </div>

          <Link href="/games/daily-challenge">
            <button className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl font-bold text-[13px] hover:opacity-90 transition-opacity shadow-lg shadow-orange-500/30">
              <Flame size={15} />
              Accept Challenge
              <ChevronRight size={14} />
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
