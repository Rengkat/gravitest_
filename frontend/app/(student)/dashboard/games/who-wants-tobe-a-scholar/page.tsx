// app/dashboard/games/scholar/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import * as gamesApi from "@/lib/api/games";
import {
  Trophy,
  Clock,
  Target,
  Award,
  ChevronRight,
  Play,
  Info,
  Shield,
  Zap,
  Users,
  Phone,
  Brain,
  Sparkles,
  Medal,
  Star,
  Gem,
  Crown,
} from "lucide-react";

export default function ScholarGameLandingPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [highestScore, setHighestScore] = useState<number | null>(null);

  useEffect(() => {
    gamesApi
      .getMyScholarStats()
      .then((s) => setHighestScore(s.highestScore))
      .catch(() => setHighestScore(0));
  }, []);

  const handleStartGame = () => {
    setIsLoading(true);
    // Navigate to the actual game page
    setTimeout(() => {
      window.location.href = "/dashboard/games/who-wants-tobe-a-scholar/play";
    }, 500);
  };

  const rules = [
    "Answer 15 questions correctly to win the grand prize of ₦1,000,000!",
    "Each question has 4 options, only one is correct.",
    "You have 60 seconds to answer each question.",
    "Use lifelines strategically: 50:50, Phone a Friend, Ask the Audience, and Skip.",
    "Reach question 5, 10, and 15 to secure guaranteed prizes.",
    "If you answer incorrectly, you leave with your last guaranteed prize.",
    "You can walk away with your current winnings at any time.",
  ];

  const prizeTiers = [
    { level: 15, amount: "₦1,000,000", milestone: true },
    { level: 14, amount: "₦500,000", milestone: false },
    { level: 13, amount: "₦250,000", milestone: false },
    { level: 12, amount: "₦100,000", milestone: false },
    { level: 11, amount: "₦50,000", milestone: false },
    { level: 10, amount: "₦25,000", milestone: true },
    { level: 9, amount: "₦15,000", milestone: false },
    { level: 8, amount: "₦12,500", milestone: false },
    { level: 7, amount: "₦10,000", milestone: false },
    { level: 6, amount: "₦7,500", milestone: false },
    { level: 5, amount: "₦5,000", milestone: true },
    { level: 4, amount: "₦3,000", milestone: false },
    { level: 3, amount: "₦2,000", milestone: false },
    { level: 2, amount: "₦1,000", milestone: false },
    { level: 1, amount: "₦500", milestone: false },
  ];

  const lifelines = [
    { icon: Brain, name: "50:50", description: "Remove two incorrect answers", color: "#FFD700" },
    { icon: Phone, name: "Phone a Friend", description: "Get expert advice", color: "#FFA500" },
    {
      icon: Users,
      name: "Ask the Audience",
      description: "See audience poll results",
      color: "#00E87A",
    },
    { icon: Zap, name: "Skip", description: "Skip a difficult question", color: "#FF6B6B" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#050914] via-[#080F22] to-[#0A1640]">
      {/* Starfield Effect */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_0%,rgba(20,50,140,0.3)_0%,transparent_60%),radial-gradient(ellipse_at_80%_100%,rgba(10,30,80,0.2)_0%,transparent_50%)]" />
        <div className="absolute inset-0">
          {Array.from({ length: 100 }).map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full animate-twinkle"
              style={{
                width: Math.random() * 2 + 1 + "px",
                height: Math.random() * 2 + 1 + "px",
                background: `rgba(255, ${Math.random() * 100 + 155}, ${Math.random() * 100 + 55}, ${Math.random() * 0.5 + 0.3})`,
                left: Math.random() * 100 + "%",
                top: Math.random() * 100 + "%",
                animationDelay: Math.random() * 5 + "s",
                animationDuration: Math.random() * 3 + 2 + "s",
              }}
            />
          ))}
        </div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center mb-4">
            <div className="relative">
              <div className="absolute inset-0 bg-gold/20 blur-2xl rounded-full" />
              <Trophy size={64} className="text-gold relative animate-pulse" />
            </div>
          </div>
          <h1 className="font-serif text-5xl md:text-7xl font-black bg-gradient-to-r from-[#fff8d6] via-[#FFD700] to-[#FFA500] bg-clip-text text-transparent mb-3">
            Who Wants to Be
            <br />
            <span className="text-4xl md:text-6xl">A SCHOLAR?</span>
          </h1>
          <p className="text-[#FFD700]/50 text-sm tracking-[0.3em] uppercase mt-2">
            ★ Gravitas Educational Games ★
          </p>
        </div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Rules & Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Rules Card */}
            <div className="bg-[rgba(10,22,65,0.92)] border border-[rgba(30,70,200,0.35)] rounded-2xl p-6 backdrop-blur-sm">
              <div className="flex items-center gap-3 mb-4">
                <Info size={24} className="text-gold" />
                <h2 className="font-serif text-2xl text-gold">Game Rules</h2>
              </div>
              <ul className="space-y-3">
                {rules.map((rule, idx) => (
                  <li
                    key={idx}
                    className="flex items-start gap-3 text-white/80 text-sm leading-relaxed">
                    <div className="w-5 h-5 rounded-full bg-gold/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-gold text-[10px] font-bold">{idx + 1}</span>
                    </div>
                    <span>{rule}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Lifelines Card */}
            <div className="bg-[rgba(10,22,65,0.92)] border border-[rgba(30,70,200,0.35)] rounded-2xl p-6 backdrop-blur-sm">
              <div className="flex items-center gap-3 mb-4">
                <Shield size={24} className="text-gold" />
                <h2 className="font-serif text-2xl text-gold">Your Lifelines</h2>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {lifelines.map((lifeline) => {
                  const Icon = lifeline.icon;
                  return (
                    <div key={lifeline.name} className="text-center">
                      <div
                        className="w-16 h-16 rounded-xl mx-auto mb-2 flex items-center justify-center border-2 transition-all hover:scale-105"
                        style={{ borderColor: lifeline.color, background: `${lifeline.color}10` }}>
                        <Icon size={28} style={{ color: lifeline.color }} />
                      </div>
                      <div className="text-[11px] font-bold text-white/80">{lifeline.name}</div>
                      <div className="text-[9px] text-white/40">{lifeline.description}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Features */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-[rgba(10,22,65,0.92)] border border-[rgba(30,70,200,0.35)] rounded-2xl p-4 text-center">
                <Clock size={24} className="text-gold mx-auto mb-2" />
                <div className="text-white font-bold text-lg">60 Seconds</div>
                <div className="text-white/40 text-[11px]">Per Question</div>
              </div>
              <div className="bg-[rgba(10,22,65,0.92)] border border-[rgba(30,70,200,0.35)] rounded-2xl p-4 text-center">
                <Target size={24} className="text-gold mx-auto mb-2" />
                <div className="text-white font-bold text-lg">15 Questions</div>
                <div className="text-white/40 text-[11px]">To Win Jackpot</div>
              </div>
            </div>
          </div>

          {/* Right Column - Prize Ladder & CTA */}
          <div className="space-y-6">
            {/* Prize Ladder */}
            <div className="bg-[rgba(10,22,65,0.92)] border border-[rgba(30,70,200,0.35)] rounded-2xl p-4 backdrop-blur-sm">
              <div className="flex items-center gap-2 mb-3 pb-2 border-b border-white/5">
                <Medal size={16} className="text-gold" />
                <h3 className="font-serif text-gold text-sm tracking-wider uppercase">
                  Prize Ladder
                </h3>
              </div>
              <div className="space-y-1 max-h-[350px] overflow-y-auto pr-2">
                {prizeTiers.map((tier) => (
                  <div
                    key={tier.level}
                    className={`flex items-center justify-between px-3 py-2 rounded-lg transition-all ${
                      tier.milestone ? "bg-gold/5 border border-gold/20" : ""
                    }`}>
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-1.5 h-1.5 rounded-full ${tier.milestone ? "bg-gold" : "bg-white/20"}`}
                      />
                      <span className={`text-xs ${tier.milestone ? "text-gold" : "text-white/40"}`}>
                        Q{tier.level}
                      </span>
                    </div>
                    <span
                      className={`text-sm font-mono ${tier.milestone ? "text-gold font-bold" : "text-white/50"}`}>
                      {tier.amount}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* CTA Card */}
            <div className="bg-gradient-to-br from-gold/10 via-gold/5 to-transparent border border-gold/30 rounded-2xl p-6 text-center">
              <div className="mb-4">
                <Star size={32} className="text-gold mx-auto animate-pulse" />
              </div>
              <h3 className="font-serif text-xl text-gold mb-2">Ready to Play?</h3>
              <p className="text-white/60 text-sm mb-4">
                Test your knowledge and win amazing prizes!
              </p>
              <button
                onClick={handleStartGame}
                disabled={isLoading}
                className="group relative w-full bg-gradient-to-r from-gold via-gold-dark to-gold text-green-900 font-bold py-3 px-6 rounded-full transition-all duration-300 hover:scale-105 hover:shadow-[0_0_30px_rgba(255,215,0,0.4)] disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden">
                <span className="relative z-10 flex items-center justify-center gap-2">
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-green-900/40 border-t-green-900 rounded-full animate-spin" />
                      Loading...
                    </>
                  ) : (
                    <>
                      <Play size={18} /> Start Game
                    </>
                  )}
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-gold-dark via-gold to-gold-dark opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </button>
              <Link
                href="/dashboard/games/who-wants-tobe-a-scholar/leaderboard"
                className="mt-3 inline-flex items-center justify-center gap-1.5 w-full text-gold/80 hover:text-gold text-[13px] font-semibold no-underline transition-colors">
                <Trophy size={14} />
                This Month&apos;s Leaderboard
              </Link>
            </div>

            {/* Score Info */}
            <div className="text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10">
                <Crown size={14} className="text-gold" />
                <span className="text-white/60 text-[11px]">
                  Highest Score: {highestScore === null ? "…" : `₦${highestScore.toLocaleString("en-NG")}`}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Note */}
        <div className="mt-12 text-center">
          <p className="text-white/30 text-[10px] tracking-wide">
            This is a knowledge-based game. No real money is awarded. Prizes are virtual
            achievements.
          </p>
        </div>
      </div>

      <style jsx>{`
        @keyframes twinkle {
          0%,
          100% {
            opacity: 0.3;
          }
          50% {
            opacity: 1;
          }
        }
        .animate-twinkle {
          animation: twinkle ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
