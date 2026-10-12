"use client";

import { useEffect, useState } from "react";
import * as gamesApi from "@/lib/api/games";
import Link from "next/link";
import {
  Puzzle,
  Heart,
  Coins,
  Lightbulb,
  Brain,
  Trophy,
  Play,
  ChevronRight,
  Star,
  Sparkles,
  Users,
  Clock,
  Award,
  BookOpen,
  GraduationCap,
  Target,
  Zap,
} from "lucide-react";

const SUBJECTS = [
  {
    id: "math",
    name: "Mathematics",
    icon: "➕",
    color: "#7eb8e8",
    description: "Numbers, equations, and geometric shapes",
  },
  {
    id: "science",
    name: "Science",
    icon: "🔬",
    color: "#7ecba1",
    description: "Biology, chemistry, and physics",
  },
  {
    id: "english",
    name: "English",
    icon: "📖",
    color: "#f7c59f",
    description: "Grammar, literature, and vocabulary",
  },
  {
    id: "history",
    name: "History",
    icon: "🏛",
    color: "#ef8c8c",
    description: "World events and civilizations",
  },
  {
    id: "geo",
    name: "Geography",
    icon: "🌍",
    color: "#c49fee",
    description: "Countries, landmarks, and maps",
  },
  {
    id: "tech",
    name: "Technology",
    icon: "💻",
    color: "#ffd166",
    description: "Computers, internet, and innovation",
  },
];

const RULES = [
  "Fill the wooden board by spelling words correctly",
  "Each word appears as a clue at the top of the screen",
  "Tap the letter circles below to place letters in order",
  "Words share letters — solving one helps with the next",
  "You have 3 hearts (lives) for wrong attempts",
  "Earn ₦500 per correct word, bonus ₦200 if all 3 hearts remain",
  "Complete all levels to win the grand prize!",
];

const FEATURES = [
  { icon: Brain, name: "Crossword-Style", description: "Words intersect on shared letters" },
  { icon: Heart, name: "3 Lives", description: "Three hearts to protect your streak" },
  { icon: Coins, name: "Earn ₦aira", description: "Virtual currency per correct word" },
  { icon: Lightbulb, name: "Smart Clues", description: "Helpful hints for each word" },
  { icon: Trophy, name: "Multiple Levels", description: "Progress through increasing difficulty" },
  { icon: Users, name: "All Subjects", description: "Math, Science, English, History & more" },
];

const PRIZE_TIERS = [
  { level: "Level 1-2", prize: "₦500", icon: Star },
  { level: "Level 3-4", prize: "₦1,500", icon: Sparkles },
  { level: "Level 5-6", prize: "₦3,000", icon: Award },
  { level: "Complete All", prize: "₦10,000+", icon: Trophy },
];

export default function WordConnectLandingPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);

  const [highScore, setHighScore] = useState<number | null>(null);

  useEffect(() => {
    gamesApi
      .getMyWordConnectStats()
      .then((s) => setHighScore(s.highScore))
      .catch(() => setHighScore(0));
  }, []);

  // The subject picker lives inside the game itself (it's the first
  // screen of the prototype), so this just opens the game — selecting a
  // subject here is a preview/highlight, not a required gate.
  const handleStartGame = () => {
    setIsLoading(true);
    window.location.href = "/dashboard/games/word-connect/play";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a0e05] via-[#0d0600] to-[#050200]">
      {/* Wood grain texture overlay */}
      <div className="fixed inset-0 pointer-events-none opacity-10">
        <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,#d49050_0px,#d49050_2px,transparent_2px,transparent_8px)]" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center mb-4">
            <div className="relative">
              <div className="absolute inset-0 bg-gold/20 blur-2xl rounded-full" />
              <Puzzle size={64} className="text-gold relative animate-pulse" />
            </div>
          </div>
          <h1 className="font-serif text-5xl md:text-7xl font-black text-gold mb-2 tracking-wider">
            WORD CONNECT
          </h1>
          <p className="text-amber-200/60 text-sm tracking-[0.2em] uppercase">
            Fill the wooden board — spell the words!
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Rules & Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Rules Card */}
            <div className="bg-[rgba(58,30,4,0.6)] border-2 border-gold/30 rounded-2xl p-6 backdrop-blur-sm shadow-xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-full bg-gold/20 flex items-center justify-center">
                  <Brain size={18} className="text-gold" />
                </div>
                <h2 className="font-serif text-2xl text-gold">How to Play</h2>
              </div>
              <ul className="space-y-3">
                {RULES.map((rule, idx) => (
                  <li
                    key={idx}
                    className="flex items-start gap-3 text-amber-100/80 text-sm leading-relaxed">
                    <div className="w-5 h-5 rounded-full bg-gold/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-gold text-[10px] font-bold">{idx + 1}</span>
                    </div>
                    <span>{rule}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Features Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {FEATURES.map((feature) => {
                const Icon = feature.icon;
                return (
                  <div
                    key={feature.name}
                    className="bg-[rgba(58,30,4,0.4)] border border-gold/20 rounded-xl p-3 text-center">
                    <Icon size={24} className="text-gold mx-auto mb-2" />
                    <div className="text-amber-200 font-bold text-xs">{feature.name}</div>
                    <div className="text-amber-200/50 text-[9px]">{feature.description}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column - Subject Selection & CTA */}
          <div className="space-y-6">
            {/* Subject Selection */}
            <div className="bg-[rgba(58,30,4,0.6)] border-2 border-gold/30 rounded-2xl p-5 backdrop-blur-sm">
              <div className="flex items-center gap-2 mb-4">
                <GraduationCap size={18} className="text-gold" />
                <h3 className="font-serif text-gold text-lg">Choose Your Subject</h3>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {SUBJECTS.map((subject) => (
                  <button
                    key={subject.id}
                    onClick={() => setSelectedSubject(subject.id)}
                    className={`p-3 rounded-xl border-2 transition-all text-center ${
                      selectedSubject === subject.id
                        ? "border-gold bg-gold/20 shadow-[0_0_20px_rgba(255,215,0,0.3)]"
                        : "border-amber-800/50 bg-amber-900/20 hover:border-gold/50 hover:bg-gold/10"
                    }`}
                    style={{ "--c": subject.color } as React.CSSProperties}>
                    <div className="text-2xl mb-1">{subject.icon}</div>
                    <div className="text-amber-200 font-bold text-xs">{subject.name}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Prize Tiers */}
            <div className="bg-[rgba(58,30,4,0.6)] border-2 border-gold/30 rounded-2xl p-5 backdrop-blur-sm">
              <div className="flex items-center gap-2 mb-4">
                <Trophy size={18} className="text-gold" />
                <h3 className="font-serif text-gold text-lg">Prize Tiers</h3>
              </div>
              <div className="space-y-2">
                {PRIZE_TIERS.map((tier) => {
                  const Icon = tier.icon;
                  return (
                    <div
                      key={tier.level}
                      className="flex items-center justify-between p-2 rounded-lg bg-amber-900/20">
                      <div className="flex items-center gap-2">
                        <Icon size={14} className="text-gold" />
                        <span className="text-amber-200 text-xs">{tier.level}</span>
                      </div>
                      <span className="text-gold font-bold text-sm">{tier.prize}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Start Button */}
            <button
              onClick={handleStartGame}
              disabled={isLoading}
              className="group relative w-full bg-gradient-to-r from-gold via-gold-dark to-gold text-green-900 font-bold py-4 px-6 rounded-full transition-all duration-300 hover:scale-105 hover:shadow-[0_0_40px_rgba(255,215,0,0.4)] disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden">
              <span className="relative z-10 flex items-center justify-center gap-2">
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-green-900/40 border-t-green-900 rounded-full animate-spin" />
                    Loading...
                  </>
                ) : (
                  <>
                    <Play size={20} /> Start Game
                  </>
                )}
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-gold-dark via-gold to-gold-dark opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </button>

            <div className="bg-black/30 border border-white/10 rounded-xl p-3">
              <div className="text-center text-[9px] text-gold font-bold uppercase tracking-wider mb-1">
                Your Best
              </div>
              <div className="text-center text-gold text-sm font-bold">
                {highScore === null ? "…" : `₦${highScore.toLocaleString("en-NG")}`}
              </div>
              <a
                href="/dashboard/games/word-connect/leaderboard"
                className="block text-center text-amber-200/60 hover:text-gold text-[10px] mt-1.5 no-underline">
                This Month&apos;s Leaderboard →
              </a>
            </div>
          </div>
        </div>

        {/* Wooden Board Preview */}
        <div className="mt-12 p-4 bg-gradient-to-b from-[#d49050] via-[#a86828] to-[#8a5418] rounded-2xl border-4 border-[#7a3e0e] shadow-xl max-w-md mx-auto">
          <div className="text-center mb-2">
            <div className="inline-block px-3 py-1 bg-amber-900/50 rounded-full text-amber-200 text-[10px] uppercase tracking-wider">
              Preview
            </div>
          </div>
          <div className="flex justify-center gap-2 mb-3">
            {["P", "O", "L", "Y", "G", "O", "N"].map((letter, i) => (
              <div
                key={i}
                className="w-10 h-10 rounded-lg bg-gradient-to-b from-[#eaca7a] to-[#c8a038] border-2 border-[#a07818] flex items-center justify-center font-bold text-amber-800 shadow-md">
                {letter}
              </div>
            ))}
          </div>
          <div className="flex justify-center gap-2">
            {["G", "O", "L", "D"].map((letter, i) => (
              <div
                key={i}
                className="w-10 h-10 rounded-lg bg-gradient-to-b from-[#eaca7a] to-[#c8a038] border-2 border-[#a07818] flex items-center justify-center font-bold text-amber-800 shadow-md">
                {letter}
              </div>
            ))}
          </div>
          <p className="text-center text-amber-800/70 text-[10px] mt-3">
            Words intersect — solve one to reveal letters for the next!
          </p>
        </div>

        {/* Footer */}
        <div className="mt-10 text-center">
          <p className="text-amber-200/30 text-[10px] tracking-wide">
            A Gravitest Educational Game — Test your vocabulary and win virtual prizes!
          </p>
        </div>
      </div>
    </div>
  );
}
