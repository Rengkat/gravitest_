// app/dashboard/games/madam-karmen/page.tsx
"use client";

import { useEffect, useState } from "react";
import * as gamesApi from "@/lib/api/games";
import Link from "next/link";
import {
  MapPin,
  Search,
  Target,
  Clock,
  Award,
  Users,
  Star,
  Shield,
  Brain,
  Trophy,
  Play,
  ChevronRight,
  Map,
  Compass,
  Badge,
  Sparkles,
  Crown,
  Eye,
  Volume2,
  BookOpen,
  GraduationCap,
  Heart,
  Coins,
  Lightbulb,
  Zap,
} from "lucide-react";

const FEATURES = [
  {
    icon: MapPin,
    name: "36 States + FCT",
    description: "Track Madam Karmen across all of Nigeria",
  },
  { icon: Clock, name: "30-Second Timer", description: "Fast answers earn bonus points!" },
  { icon: Heart, name: "3 Leads", description: "Protect your leads — wrong answers cost you" },
  { icon: Zap, name: "Streak Bonus", description: "3 correct in a row = +300 bonus points" },
  { icon: Lightbulb, name: "3 Hints", description: "Earn more hints by answering interrogations" },
  { icon: Users, name: "Interrogations", description: "Answer trivia to earn free hints" },
];

const CLUE_TYPES = [
  { name: "Cultural Clue", icon: Star, description: "Local traditions and festivals" },
  { name: "Food Intelligence", icon: Sparkles, description: "Regional cuisine and delicacies" },
  { name: "Landmark Sighting", icon: Map, description: "Famous locations and monuments" },
  { name: "Language Intercept", icon: Volume2, description: "Local dialects and phrases" },
  { name: "Mineral Trace", icon: Crown, description: "Natural resources and minerals" },
];

const PRIZE_TIERS = [
  { level: "Per State", prize: "100-150 pts + time bonus", color: "#2e8b57" },
  { level: "3-State Streak", prize: "+300 bonus pts", color: "#f5c842" },
  { level: "Full Investigation", prize: "10,000+ pts", color: "#c0392b" },
  { level: "Arrest Bonus", prize: "500 pts", color: "#8b5cf6" },
];

const ZONES = [
  { name: "North West", color: "#1a2e08", states: "Kano, Kaduna, Katsina, Sokoto, etc." },
  { name: "North East", color: "#0d200a", states: "Borno, Yobe, Adamawa, Taraba" },
  { name: "North Central", color: "#1a3d0d", states: "FCT, Niger, Benue, Plateau, Kogi" },
  { name: "South West", color: "#0d2e2e", states: "Lagos, Oyo, Ogun, Osun, Ondo, Ekiti" },
  { name: "South East", color: "#0a221a", states: "Enugu, Anambra, Imo, Abia, Ebonyi" },
  {
    name: "South South",
    color: "#0a1520",
    states: "Rivers, Delta, Bayelsa, Akwa Ibom, Edo, Cross River",
  },
];

export default function MadamKarmenLandingPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [highScore, setHighScore] = useState<number | null>(null);

  // The detective name now comes from the signed-in student's own
  // profile inside the game itself — no name prompt here, per instruction.
  useEffect(() => {
    gamesApi
      .getMyKarmenStats()
      .then((s) => setHighScore(s.highScore))
      .catch(() => setHighScore(0));
  }, []);

  const handleStartGame = () => {
    setIsLoading(true);
    window.location.href = "/dashboard/games/madam-karmen/play";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#060e1f] via-[#0d1f3c] to-[#1a0a00]">
      {/* Background decorative elements */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_20%_50%,rgba(26,58,10,0.15)_0%,transparent_60%),radial-gradient(ellipse_at_80%_20%,rgba(232,114,12,0.08)_0%,transparent_50%)]" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#e8720c]/20 border border-[#e8720c]/40 mb-4">
            <Shield size={12} className="text-[#e8720c]" />
            <span className="text-[10px] font-bold text-[#e8720c] tracking-wider">
              NAIJA CYBER-CRIME UNIT
            </span>
          </div>

          <div className="relative inline-block mb-3">
            <div className="absolute inset-0 bg-gold/20 blur-2xl rounded-full" />
            <svg width="100" height="100" viewBox="0 0 130 130" className="mx-auto relative">
              <ellipse cx="65" cy="122" rx="28" ry="5" fill="rgba(0,0,0,0.4)" />
              <path
                d="M35 75 C30 95 28 115 32 125 L98 125 C102 115 100 95 95 75 L65 82 Z"
                fill="#1a1a2e"
                stroke="#f5c518"
                strokeWidth="1.5"
              />
              <path d="M65 82 L50 75 L55 95 Z" fill="#2d2d4e" />
              <path d="M65 82 L80 75 L75 95 Z" fill="#2d2d4e" />
              <rect x="45" y="97" width="40" height="5" rx="2" fill="#f5c518" />
              <rect x="62" y="95" width="6" height="9" rx="1" fill="#c0392b" />
              <rect x="58" y="58" width="14" height="18" rx="4" fill="#8B4513" />
              <ellipse cx="65" cy="50" rx="24" ry="26" fill="#6B3410" />
              <path
                d="M41 45 C40 25 50 15 65 14 C80 15 90 25 89 45 C85 38 80 34 65 33 C50 34 45 38 41 45 Z"
                fill="#1a0a00"
              />
              <circle cx="44" cy="38" r="10" fill="#1a0a00" />
              <circle cx="86" cy="38" r="10" fill="#1a0a00" />
              <circle cx="65" cy="28" r="9" fill="#1a0a00" />
              <ellipse cx="57" cy="50" rx="4" ry="4.5" fill="white" />
              <ellipse cx="73" cy="50" rx="4" ry="4.5" fill="white" />
              <circle cx="58" cy="51" r="2.5" fill="#1a0a00" />
              <circle cx="74" cy="51" r="2.5" fill="#1a0a00" />
              <rect
                x="50"
                y="47"
                width="11"
                height="7"
                rx="3"
                fill="rgba(0,0,0,0.7)"
                stroke="#f5c518"
                strokeWidth="1"
              />
              <rect
                x="69"
                y="47"
                width="11"
                height="7"
                rx="3"
                fill="rgba(0,0,0,0.7)"
                stroke="#f5c518"
                strokeWidth="1"
              />
              <path
                d="M60 63 Q65 68 70 63"
                stroke="#c0392b"
                strokeWidth="2"
                fill="none"
                strokeLinecap="round"
              />
            </svg>
          </div>

          <h1 className="font-serif text-5xl md:text-7xl font-black text-gold mb-2 tracking-wider">
            Where in Nigeria
            <br />
            <span className="text-3xl md:text-4xl text-[#ff9f45]">is Madam Karmen?</span>
          </h1>
          <p className="text-amber-200/60 text-sm mt-2 max-w-md mx-auto">
            A Geography Deduction Game — "She stole the Benin Bronze and is hiding across all 36
            states!"
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Game Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Stats Bar */}
            <div className="flex flex-wrap gap-3 justify-center lg:justify-start">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gold/10 border border-gold/30">
                <MapPin size={12} className="text-gold" />
                <span className="text-[11px] font-bold text-gold">36 States + FCT</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gold/10 border border-gold/30">
                <Award size={12} className="text-gold" />
                <span className="text-[11px] font-bold text-gold">5 Clue Types</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gold/10 border border-gold/30">
                <Target size={12} className="text-gold" />
                <span className="text-[11px] font-bold text-gold">Daily Challenge</span>
              </div>
            </div>

            {/* Game Description */}
            <div className="bg-[rgba(6,14,31,0.85)] border border-gold/20 rounded-2xl p-6 backdrop-blur-sm">
              <div className="flex items-center gap-2 mb-3">
                <Search size={18} className="text-gold" />
                <h2 className="font-serif text-xl text-gold">The Investigation</h2>
              </div>
              <p className="text-amber-100/80 text-sm leading-relaxed mb-4">
                Madam Karmen has stolen the priceless Benin Bronze and is fleeing across Nigeria. As
                a detective, you must track her down using witness reports before she escapes the
                country!
              </p>
              <div className="flex gap-2 flex-wrap">
                <div className="px-2 py-1 rounded-md bg-gold/10 text-gold text-[10px] font-bold">
                  5 Clue Types
                </div>
                <div className="px-2 py-1 rounded-md bg-gold/10 text-gold text-[10px] font-bold">
                  Time Pressure
                </div>
                <div className="px-2 py-1 rounded-md bg-gold/10 text-gold text-[10px] font-bold">
                  Interrogations
                </div>
              </div>
            </div>

            {/* Features Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {FEATURES.map((feature) => {
                const Icon = feature.icon;
                return (
                  <div
                    key={feature.name}
                    className="bg-[rgba(6,14,31,0.7)] border border-white/10 rounded-xl p-3">
                    <Icon size={16} className="text-gold mb-2" />
                    <div className="text-amber-200 font-bold text-[11px]">{feature.name}</div>
                    <div className="text-amber-200/50 text-[9px]">{feature.description}</div>
                  </div>
                );
              })}
            </div>

            {/* Clue Types */}
            <div className="bg-[rgba(6,14,31,0.7)] border border-white/10 rounded-xl p-4">
              <h3 className="text-[11px] font-bold text-gold uppercase tracking-wider mb-3">
                Clue Types You'll Encounter
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                {CLUE_TYPES.map((clue) => {
                  const Icon = clue.icon;
                  return (
                    <div key={clue.name} className="text-center">
                      <div className="w-8 h-8 rounded-full bg-gold/10 flex items-center justify-center mx-auto mb-1">
                        <Icon size={12} className="text-gold" />
                      </div>
                      <div className="text-amber-200 text-[9px] font-semibold">{clue.name}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Column - Start Game */}
          <div className="space-y-6">
            {/* Zone Map Preview */}
            <div className="bg-[rgba(6,14,31,0.85)] border border-gold/20 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <Compass size={16} className="text-gold" />
                <h3 className="font-serif text-gold text-sm">Geographic Zones</h3>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {ZONES.map((zone) => (
                  <div key={zone.name} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded" style={{ background: zone.color }} />
                    <span className="text-amber-200/70 text-[10px]">{zone.name}</span>
                  </div>
                ))}
              </div>
              <p className="text-amber-200/40 text-[9px] mt-3 text-center">
                Track her across all 6 geopolitical zones!
              </p>
            </div>

            {/* Prize Tiers */}
            <div className="bg-[rgba(6,14,31,0.85)] border border-gold/20 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <Trophy size={16} className="text-gold" />
                <h3 className="font-serif text-gold text-sm">Rewards</h3>
              </div>
              <div className="space-y-2">
                {PRIZE_TIERS.map((tier) => (
                  <div key={tier.level} className="flex items-center justify-between">
                    <span className="text-amber-200 text-[11px]">{tier.level}</span>
                    <span className="text-gold text-[11px] font-bold">{tier.prize}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Start Button */}
            <button
              onClick={handleStartGame}
              disabled={isLoading}
              className="group relative w-full bg-gradient-to-r from-[#e8720c] via-[#ff9f45] to-[#e8720c] text-white font-bold py-4 px-6 rounded-full transition-all duration-300 hover:scale-105 hover:shadow-[0_0_40px_rgba(232,114,12,0.4)] disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden">
              <span className="relative z-10 flex items-center justify-center gap-2">
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    Loading...
                  </>
                ) : (
                  <>
                    <Play size={20} /> Begin Investigation
                  </>
                )}
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-[#c0550a] via-[#e8720c] to-[#c0550a] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </button>

            {/* Your Best / Leaderboard link */}
            <div className="bg-[rgba(6,14,31,0.5)] border border-white/10 rounded-xl p-3">
              <div className="flex items-center gap-1 justify-center mb-1">
                <Crown size={10} className="text-gold" />
                <span className="text-[9px] text-gold font-bold uppercase">Your Best</span>
              </div>
              <div className="text-center text-gold text-sm font-bold">
                {highScore === null ? "…" : `${highScore.toLocaleString("en-NG")} pts`}
              </div>
              <a
                href="/dashboard/games/madam-karmen/leaderboard"
                className="block text-center text-amber-200/60 hover:text-gold text-[10px] mt-1.5 no-underline">
                This Month&apos;s Leaderboard →
              </a>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-10 text-center">
          <p className="text-amber-200/30 text-[9px] tracking-wide">
            A Gravitest Educational Game — Test your Nigerian geography knowledge and track down the
            fugitive!
          </p>
        </div>
      </div>
    </div>
  );
}
