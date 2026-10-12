// app/dashboard/games/nigerian-trail/page.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import {
  MapPin,
  Clock,
  Shield,
  Heart,
  BookOpen,
  TrendingUp,
  AlertTriangle,
  Star,
  Trophy,
  Play,
  ChevronRight,
  Users,
  Landmark,
  Building,
  ShoppingBag,
  Sprout,
  GraduationCap,
  Calendar,
  Flag,
  Award,
  Target,
  Compass,
} from "lucide-react";

const PROFESSIONS = [
  {
    id: "civil",
    name: "Civil Servant",
    icon: Building,
    description: "Steady salary. SAP will destroy you slowly.",
    start: { naira: 800, food: 60, fuel: 40, medicine: 30 },
    stats: { health: 80, unity: 70, education: 75, safety: 80 },
    color: "#2a6b43",
  },
  {
    id: "trader",
    name: "Trader",
    icon: ShoppingBag,
    description: "Volatile income. High risk, high reward.",
    start: { naira: 1200, food: 80, fuel: 60, medicine: 20 },
    stats: { health: 75, unity: 65, education: 55, safety: 70 },
    color: "#f5c842",
  },
  {
    id: "farmer",
    name: "Farmer",
    icon: Sprout,
    description: "Food-secure, cash poor. Land survives everything.",
    start: { naira: 400, food: 100, fuel: 25, medicine: 20 },
    stats: { health: 85, unity: 80, education: 45, safety: 75 },
    color: "#27ae60",
  },
  {
    id: "teacher",
    name: "Teacher",
    icon: GraduationCap,
    description: "Educated family. ASUU strikes will ruin you.",
    start: { naira: 600, food: 55, fuel: 30, medicine: 35 },
    stats: { health: 78, unity: 75, education: 95, safety: 75 },
    color: "#2980b9",
  },
];

const MODES = [
  {
    id: "normal",
    name: "History Student",
    desc: "Standard experience",
    icon: BookOpen,
    color: "#2e8b57",
  },
  {
    id: "hard",
    name: "Permadeath",
    desc: "One mistake ends your journey",
    icon: Shield,
    color: "#e74c3c",
  },
  {
    id: "easy",
    name: "Family Survival",
    desc: "Forgiving consequences",
    icon: Heart,
    color: "#27ae60",
  },
];

const FEATURES = [
  { icon: Calendar, name: "66 Years of History", description: "1960 — Present Day" },
  { icon: MapPin, name: "All Geopolitical Zones", description: "Track events across Nigeria" },
  {
    icon: Clock,
    name: "Real Historical Events",
    description: "Independence, coups, SAP, #EndSARS",
  },
  { icon: Trophy, name: "Legacy Points", description: "Score based on survival and choices" },
  { icon: Heart, name: "Family Stats", description: "Health, Unity, Education, Safety" },
  { icon: Target, name: "Multiple Endings", description: "Your choices shape the outcome" },
];

const KEY_EVENTS = [
  { year: "1960", event: "Independence", color: "#2e8b57" },
  { year: "1966-70", event: "Civil War", color: "#e74c3c" },
  { year: "1986", event: "SAP Crisis", color: "#f39c12" },
  { year: "1993", event: "June 12", color: "#c0392b" },
  { year: "2020", event: "#EndSARS", color: "#8e44ad" },
  { year: "2026", event: "Present Day", color: "#2e8b57" },
];

export default function NigerianTrailLandingPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedProfession, setSelectedProfession] = useState<string | null>(null);
  const [selectedMode, setSelectedMode] = useState<string>("normal");

  const handleStartGame = () => {
    if (!selectedProfession) return;
    setIsLoading(true);
    setTimeout(() => {
      window.location.href = `/dashboard/games/nigerian-trail/play?prof=${selectedProfession}&mode=${selectedMode}`;
    }, 500);
  };

  const selectedProfData = PROFESSIONS.find((p) => p.id === selectedProfession);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#040c05] via-[#0a1e0d] to-[#060e05]">
      {/* Background grid */}
      <div className="fixed inset-0 pointer-events-none opacity-5">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(40,168,94,0.3)_1px,transparent_1px),linear-gradient(90deg,rgba(40,168,94,0.3)_1px,transparent_1px)] bg-[50px_50px]" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="flex items-center justify-center gap-0 mb-4">
            <div className="w-16 h-8 bg-[#008751] rounded-l-md" />
            <div className="w-16 h-8 bg-white" />
            <div className="w-16 h-8 bg-[#008751] rounded-r-md" />
          </div>
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gold/20 border border-gold/40 mb-4">
            <Flag size={12} className="text-gold" />
            <span className="text-[10px] font-bold text-gold tracking-wider">
              NAIJA HERITAGE INTERACTIVE
            </span>
          </div>

          <h1 className="font-serif text-5xl md:text-7xl font-black text-white mb-2">
            The <span className="text-gold">Nigerian</span> Trail
          </h1>
          <p className="text-amber-200/60 text-lg md:text-xl font-mono tracking-wider">
            1960 — Present Day
          </p>
          <p className="text-amber-200/40 text-sm max-w-md mx-auto mt-3 italic">
            Navigate 66 years of coups, oil booms, structural adjustment, democracy and resilience.
            Every choice echoes through history.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Features & Events */}
          <div className="lg:col-span-2 space-y-6">
            {/* Features Grid */}
            <div className="grid grid-cols-2 gap-3">
              {FEATURES.map((feature) => {
                const Icon = feature.icon;
                return (
                  <div
                    key={feature.name}
                    className="bg-[rgba(0,0,0,0.35)] border border-gold/20 rounded-xl p-3 backdrop-blur-sm">
                    <Icon size={16} className="text-gold mb-2" />
                    <div className="text-amber-200 font-bold text-[11px]">{feature.name}</div>
                    <div className="text-amber-200/40 text-[9px]">{feature.description}</div>
                  </div>
                );
              })}
            </div>

            {/* Key Events Timeline */}
            <div className="bg-[rgba(0,0,0,0.35)] border border-gold/20 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <Calendar size={16} className="text-gold" />
                <h3 className="font-serif text-gold text-sm">Key Events You'll Navigate</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {KEY_EVENTS.map((event) => (
                  <div key={event.year} className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full" style={{ background: event.color }} />
                    <span className="text-amber-200/70 text-[10px]">{event.year}</span>
                    <span className="text-amber-200/40 text-[10px]">{event.event}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* How to Play */}
            <div className="bg-[rgba(0,0,0,0.35)] border border-gold/20 rounded-xl p-4">
              <h3 className="font-serif text-gold text-sm mb-3 flex items-center gap-2">
                <BookOpen size={16} /> How to Play
              </h3>
              <div className="space-y-2">
                {[
                  "Choose your profession — each has unique starting resources and stats.",
                  "Read each historical event and make critical choices for your family.",
                  "Manage resources: Naira, Food, Fuel, Medicine through 66 years of history.",
                  "Your choices affect Family Stats: Health, Unity, Education, and Safety.",
                  "Wrong choices can lead to game over — especially in Permadeath mode.",
                  "Complete all events to see your Legacy Score and share your result!",
                ].map((step, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <div className="w-4 h-4 rounded-full bg-gold/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-gold text-[8px] font-bold">{i + 1}</span>
                    </div>
                    <p className="text-amber-200/70 text-[11px] leading-relaxed">{step}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column - Profession & Mode Selection */}
          <div className="space-y-6">
            {/* Profession Selection */}
            <div className="bg-[rgba(0,0,0,0.45)] border-2 border-gold/30 rounded-2xl p-5 backdrop-blur-sm">
              <h3 className="font-serif text-gold text-lg mb-3 flex items-center gap-2">
                <Users size={18} /> Choose Your Path
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {PROFESSIONS.map((prof) => {
                  const Icon = prof.icon;
                  const isSelected = selectedProfession === prof.id;
                  return (
                    <button
                      key={prof.id}
                      onClick={() => setSelectedProfession(prof.id)}
                      className={`p-3 rounded-xl border-2 transition-all text-left ${
                        isSelected
                          ? "border-gold bg-gold/20 shadow-[0_0_20px_rgba(245,200,66,0.3)]"
                          : "border-gold/20 bg-black/30 hover:border-gold/50"
                      }`}>
                      <div className="flex items-center gap-2 mb-1">
                        <Icon size={14} className={isSelected ? "text-gold" : "text-amber-400"} />
                        <span
                          className={`font-bold text-sm ${isSelected ? "text-gold" : "text-white"}`}>
                          {prof.name}
                        </span>
                      </div>
                      <p className="text-amber-200/50 text-[9px]">{prof.description}</p>
                      {isSelected && selectedProfData && (
                        <div className="mt-2 pt-2 border-t border-gold/20 grid grid-cols-2 gap-1 text-[8px]">
                          <span className="text-amber-200/60">Start: ₦{prof.start.naira}</span>
                          <span className="text-amber-200/60">Food: {prof.start.food}%</span>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Mode Selection */}
            <div className="bg-[rgba(0,0,0,0.45)] border border-gold/20 rounded-xl p-4">
              <h3 className="font-serif text-gold text-sm mb-2 flex items-center gap-2">
                <Shield size={14} /> Difficulty
              </h3>
              <div className="flex gap-2">
                {MODES.map((mode) => {
                  const Icon = mode.icon;
                  const isSelected = selectedMode === mode.id;
                  return (
                    <button
                      key={mode.id}
                      onClick={() => setSelectedMode(mode.id)}
                      className={`flex-1 p-2 rounded-lg text-center transition-all ${
                        isSelected
                          ? "bg-gold/20 border border-gold"
                          : "bg-white/5 border border-white/10 hover:border-gold/30"
                      }`}>
                      <Icon
                        size={12}
                        className={`mx-auto mb-1 ${isSelected ? "text-gold" : "text-amber-400/60"}`}
                      />
                      <div
                        className={`text-[10px] font-bold ${isSelected ? "text-gold" : "text-amber-200/60"}`}>
                        {mode.name}
                      </div>
                      <div className="text-[8px] text-amber-200/40">{mode.desc}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Preview Stats */}
            {selectedProfData && (
              <div className="bg-[rgba(0,0,0,0.35)] border border-gold/20 rounded-xl p-3">
                <div className="text-[9px] text-amber-200/60 mb-2">Starting Family Stats</div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex justify-between">
                    <span className="text-amber-200/50 text-[9px]">Health</span>
                    <span className="text-gold text-[9px]">{selectedProfData.stats.health}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-amber-200/50 text-[9px]">Unity</span>
                    <span className="text-gold text-[9px]">{selectedProfData.stats.unity}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-amber-200/50 text-[9px]">Education</span>
                    <span className="text-gold text-[9px]">
                      {selectedProfData.stats.education}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-amber-200/50 text-[9px]">Safety</span>
                    <span className="text-gold text-[9px]">{selectedProfData.stats.safety}%</span>
                  </div>
                </div>
              </div>
            )}

            {/* Start Button */}
            <button
              onClick={handleStartGame}
              disabled={!selectedProfession || isLoading}
              className="group relative w-full bg-gradient-to-r from-[#c8880a] via-[#e8a820] to-[#c8880a] text-green-900 font-bold py-4 px-6 rounded-full transition-all duration-300 hover:scale-105 hover:shadow-[0_0_40px_rgba(200,136,10,0.4)] disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden">
              <span className="relative z-10 flex items-center justify-center gap-2">
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-green-900/40 border-t-green-900 rounded-full animate-spin" />
                    Loading...
                  </>
                ) : (
                  <>
                    <Play size={20} /> Begin the Journey — 1960
                  </>
                )}
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-[#a07008] via-[#c8880a] to-[#a07008] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </button>

            {!selectedProfession && (
              <p className="text-amber-200/50 text-center text-[10px]">Choose your path to begin</p>
            )}

            {/* Leaderboard Preview */}
            <div className="bg-[rgba(0,0,0,0.3)] border border-white/10 rounded-xl p-3">
              <div className="flex items-center gap-1 justify-center mb-2">
                <Trophy size={10} className="text-gold" />
                <span className="text-[9px] text-gold font-bold uppercase">Legacy Records</span>
              </div>
              <div className="text-center text-amber-200/40 text-[9px]">
                No records yet. Be the first.
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-10 text-center">
          <p className="text-amber-200/30 text-[9px] tracking-wide">
            A Gravitas Educational Game — Every choice echoes through Nigerian history.
          </p>
        </div>
      </div>
    </div>
  );
}
