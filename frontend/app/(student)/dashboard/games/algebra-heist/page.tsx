// app/dashboard/games/algebra-heist/page.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import {
  DoorOpen,
  Brain,
  Zap,
  Trophy,
  Clock,
  Star,
  Shield,
  Sparkles,
  Play,
  ChevronRight,
  GraduationCap,
  BookOpen,
  Calculator,
  Target,
  AlertTriangle,
  Crown,
  Flame,
  Rocket,
  Sword,
  ScrollText,
} from "lucide-react";

const CLASS_LEVELS = [
  {
    id: "JSS1",
    name: "JSS1",
    description: "Simple Equations",
    icon: BookOpen,
    difficulty: "Easy",
    color: "#27ae60",
  },
  {
    id: "JSS2",
    name: "JSS2",
    description: "2-step Equations",
    icon: Calculator,
    difficulty: "Easy",
    color: "#2ecc71",
  },
  {
    id: "JSS3",
    name: "JSS3",
    description: "Brackets",
    icon: Target,
    difficulty: "Medium",
    color: "#f5c842",
  },
  {
    id: "SSS1",
    name: "SSS1",
    description: "Linear + Brackets",
    icon: GraduationCap,
    difficulty: "Medium",
    color: "#f39c12",
  },
  {
    id: "SSS2",
    name: "SSS2",
    description: "Fractions",
    icon: Brain,
    difficulty: "Hard",
    color: "#e74c3c",
  },
  {
    id: "SSS3",
    name: "SSS3",
    description: "Quadratics",
    icon: Trophy,
    difficulty: "Expert",
    color: "#8e44ad",
  },
];

const FEATURES = [
  { icon: DoorOpen, name: "5 Locked Doors", description: "Solve equations to unlock each door" },
  { icon: Zap, name: "Streak Bonus", description: "Consecutive correct answers boost your score" },
  {
    icon: Clock,
    name: "60-Second Timer",
    description: "Race against time before the monster catches you",
  },
  { icon: Shield, name: "Monster Pursuit", description: "Wrong answers bring the monster closer!" },
  { icon: Star, name: "Score Multiplier", description: "Fast answers earn bonus points" },
  { icon: Sword, name: "Drag & Drop", description: "Build equations step-by-step with tiles" },
];

const STEP_EXAMPLES = [
  {
    equation: "2x + 3 = 9",
    steps: ["2x = 6", "x = 3"],
    explanation: "First subtract 3, then divide by 2",
  },
  {
    equation: "3(x + 2) = 15",
    steps: ["3x + 6 = 15", "3x = 9", "x = 3"],
    explanation: "Expand brackets, subtract 6, divide by 3",
  },
  {
    equation: "x/2 + 1 = 4",
    steps: ["x/2 = 3", "x = 6"],
    explanation: "Subtract 1, then multiply by 2",
  },
];

export default function AlgebraHeistLandingPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedClass, setSelectedClass] = useState<string | null>(null);

  const handleStartGame = () => {
    if (!selectedClass) return;
    setIsLoading(true);
    setTimeout(() => {
      window.location.href = `/dashboard/games/algebra-heist/play?class=${selectedClass}`;
    }, 500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0e17] via-[#12192a] to-[#0d111a]">
      {/* Background effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-orange-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-gold/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-500/20 border border-orange-500/40 mb-4">
            <Shield size={12} className="text-orange-400" />
            <span className="text-[10px] font-bold text-orange-400 tracking-wider">
              BIODUN'S ESCAPE
            </span>
          </div>

          <div className="relative inline-block mb-3">
            <div className="absolute inset-0 bg-gold/20 blur-2xl rounded-full" />
            <div className="text-6xl mb-2 relative">🏃‍♂️👹</div>
          </div>

          <h1 className="font-serif text-5xl md:text-6xl font-black bg-gradient-to-r from-gold via-orange-400 to-gold bg-clip-text text-transparent mb-2">
            Algebra Heist
          </h1>
          <p className="text-amber-200/60 text-sm max-w-md mx-auto">
            Solve equations, unlock doors, and outrun the monster!
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - How to Play */}
          <div className="lg:col-span-2 space-y-6">
            {/* How to Play Card */}
            <div className="bg-[rgba(18,25,42,0.9)] border border-[rgba(245,200,66,0.2)] rounded-2xl p-5 backdrop-blur-sm">
              <div className="flex items-center gap-2 mb-4">
                <ScrollText size={20} className="text-gold" />
                <h2 className="font-serif text-xl text-gold">How to Play</h2>
              </div>
              <div className="space-y-4">
                {[
                  "A monster is chasing Biodun through a locked corridor. Solve algebra equations to unlock each door!",
                  "Each door shows an equation. Drag the algebra tiles into the answer slots in the correct step-by-step order.",
                  "Hit UNLOCK DOOR when all slots are filled. Correct = door swings open, Biodun runs forward!",
                  "Wrong answer? The monster lunges closer! Keep your streak up for bonus points.",
                  "Unlock all 5 doors before the monster catches Biodun, then escape to freedom!",
                ].map((step, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-orange-500 flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-[10px] font-bold">{i + 1}</span>
                    </div>
                    <p className="text-amber-100/80 text-sm leading-relaxed">{step}</p>
                  </div>
                ))}
              </div>

              {/* Scene Preview */}
              <div className="mt-4 bg-[#0d1a0d] rounded-xl p-3 relative overflow-hidden border border-[rgba(245,200,66,0.15)]">
                <div className="absolute bottom-0 left-0 right-0 h-3 bg-[#1a2a1a]" />
                <div className="absolute bottom-3 left-[8%] text-2xl animate-bounce">👹</div>
                <div className="absolute bottom-3 left-[38%] text-2xl animate-pulse">🏃‍♂️</div>
                <div className="absolute bottom-3 right-[14%] text-3xl">🚪</div>
                <div className="absolute right-[6%] bottom-3 text-2xl animate-ping">🌟</div>
                <p className="text-center text-[10px] text-amber-200/50 mt-8">
                  Help Biodun escape the monster!
                </p>
              </div>
            </div>

            {/* Step Examples */}
            <div className="bg-[rgba(18,25,42,0.9)] border border-[rgba(245,200,66,0.2)] rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <Brain size={20} className="text-gold" />
                <h2 className="font-serif text-lg text-gold">Example Solutions</h2>
              </div>
              <div className="grid gap-3">
                {STEP_EXAMPLES.map((ex, i) => (
                  <div key={i} className="bg-[rgba(0,0,0,0.3)] rounded-xl p-3">
                    <div className="font-mono text-gold font-bold text-sm mb-2">{ex.equation}</div>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {ex.steps.map((step, j) => (
                        <span
                          key={j}
                          className="px-2 py-1 rounded-md bg-orange-500/20 text-orange-300 text-xs font-mono">
                          {step}
                        </span>
                      ))}
                    </div>
                    <p className="text-amber-200/60 text-[11px]">{ex.explanation}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Features Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {FEATURES.map((feature) => {
                const Icon = feature.icon;
                return (
                  <div
                    key={feature.name}
                    className="bg-[rgba(18,25,42,0.7)] border border-white/10 rounded-xl p-3">
                    <Icon size={16} className="text-gold mb-2" />
                    <div className="text-amber-200 font-bold text-[11px]">{feature.name}</div>
                    <div className="text-amber-200/50 text-[9px]">{feature.description}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column - Class Selection */}
          <div className="space-y-6">
            {/* Class Selection Card */}
            <div className="bg-[rgba(18,25,42,0.95)] border-2 border-gold/30 rounded-2xl p-5 backdrop-blur-sm">
              <div className="flex items-center gap-2 mb-4">
                <GraduationCap size={18} className="text-gold" />
                <h3 className="font-serif text-gold text-lg">Choose Your Class</h3>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {CLASS_LEVELS.map((level) => {
                  const Icon = level.icon;
                  const isSelected = selectedClass === level.id;
                  return (
                    <button
                      key={level.id}
                      onClick={() => setSelectedClass(level.id)}
                      className={`p-3 rounded-xl border-2 transition-all text-center ${
                        isSelected
                          ? "border-gold bg-gold/20 shadow-[0_0_20px_rgba(245,200,66,0.3)]"
                          : "border-[rgba(245,200,66,0.2)] bg-[rgba(0,0,0,0.3)] hover:border-gold/50"
                      }`}>
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <Icon size={14} className={isSelected ? "text-gold" : "text-amber-400"} />
                        <span
                          className="font-bold text-lg"
                          style={{ color: isSelected ? "#f5c842" : level.color }}>
                          {level.name}
                        </span>
                      </div>
                      <div className="text-amber-200/70 text-[10px]">{level.description}</div>
                      <div
                        className={`text-[9px] mt-1 ${isSelected ? "text-gold" : "text-amber-200/40"}`}>
                        {level.difficulty}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Stats Preview */}
            <div className="bg-[rgba(18,25,42,0.9)] border border-gold/20 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <Trophy size={16} className="text-gold" />
                <h3 className="font-serif text-gold text-sm">What You'll Learn</h3>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-amber-200 text-[11px]">JSS1-2</span>
                  <span className="text-gold text-[11px]">Basic equations</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-amber-200 text-[11px]">JSS3-SSS1</span>
                  <span className="text-gold text-[11px]">Brackets & linear</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-amber-200 text-[11px]">SSS2-SSS3</span>
                  <span className="text-gold text-[11px]">Fractions & quadratics</span>
                </div>
              </div>
            </div>

            {/* Resume Game Option */}
            <div className="bg-[rgba(18,25,42,0.9)] border border-gold/20 rounded-2xl p-3">
              <p className="text-amber-200/50 text-[10px] text-center">
                Last played: <span className="text-gold">None</span>
              </p>
            </div>

            {/* Start Button */}
            <button
              onClick={handleStartGame}
              disabled={!selectedClass || isLoading}
              className="group relative w-full bg-gradient-to-r from-[#f5c842] via-[#f47c3a] to-[#f5c842] text-green-900 font-bold py-4 px-6 rounded-full transition-all duration-300 hover:scale-105 hover:shadow-[0_0_40px_rgba(245,200,66,0.4)] disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden">
              <span className="relative z-10 flex items-center justify-center gap-2">
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-green-900/40 border-t-green-900 rounded-full animate-spin" />
                    Loading...
                  </>
                ) : (
                  <>
                    <Play size={20} /> Start Heist
                  </>
                )}
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-[#e0b030] via-[#e06820] to-[#e0b030] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </button>

            {!selectedClass && (
              <p className="text-amber-200/50 text-center text-[10px]">
                Select a class to begin the heist
              </p>
            )}

            {/* Warning */}
            <div className="flex items-center gap-2 justify-center text-amber-200/40 text-[9px]">
              <AlertTriangle size={10} />
              <span>Wrong answers make the monster faster!</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-10 text-center">
          <p className="text-amber-200/30 text-[9px] tracking-wide">
            A Gravitas Educational Game — Master algebra while escaping the monster!
          </p>
        </div>
      </div>
    </div>
  );
}
