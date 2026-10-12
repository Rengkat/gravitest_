"use client";

import { useState } from "react";
import { Target, Clock, BookOpen, Volume2, Zap } from "lucide-react";
import { StudySettings } from "@/types/settings";
import { SUBJECTS_LIST, capitalize } from "@/lib/constants/settings";
import {
  SettingsCard,
  ToggleRow,
  ChipGroup,
  SettingsSelect,
  SettingsGroupLabel,
  SaveBar,
  SettingsRange,
} from "./ui";

interface StudySectionProps {
  settings: StudySettings;
  onChange: (s: StudySettings) => Promise<void>;
}

const STUDY_TIMES = [
  { id: "morning", label: "🌅 Morning (6am–12pm)" },
  { id: "afternoon", label: "☀️ Afternoon (12pm–5pm)" },
  { id: "evening", label: "🌆 Evening (5pm–9pm)" },
  { id: "night", label: "🌙 Night (9pm–12am)" },
] as const;

const GOALS = [
  { id: "exam_prep", label: "Exam Preparation" },
  { id: "skill_building", label: "Skill Building" },
  { id: "school_support", label: "School Support" },
  { id: "general_learning", label: "General Learning" },
] as const;

const DIFFICULTY_OPTIONS = [
  { id: "adaptive", label: "Adaptive (Recommended)", desc: "Adjusts to your performance" },
  { id: "easy", label: "Easy", desc: "Foundation & review" },
  { id: "medium", label: "Medium", desc: "Exam-ready challenges" },
  { id: "hard", label: "Hard", desc: "Push your limits" },
] as const;

export default function StudySection({ settings, onChange }: StudySectionProps) {
  const [local, setLocal] = useState(settings);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isDirty = JSON.stringify(local) !== JSON.stringify(settings);

  const update = <K extends keyof StudySettings>(key: K, val: StudySettings[K]) => {
    setLocal((prev) => ({ ...prev, [key]: val }));
    setSaved(false);
    setError(null);
  };

  const toggleSubject = (s: string) => {
    const current = local.subjectsOfFocus;
    const next = current.includes(s) ? current.filter((x) => x !== s) : [...current, s];
    update("subjectsOfFocus", next);
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    try {
      await onChange(local);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch {
      setError("Couldn't save — check your connection and try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Daily goal */}
      <SettingsCard
        title="Daily Study Goal"
        description="Set how many minutes per day you want to study">
        <SettingsRange
          label="Minutes per day"
          value={local.dailyGoalMinutes}
          min={15}
          max={120}
          step={15}
          onChange={(v) => update("dailyGoalMinutes", v as StudySettings["dailyGoalMinutes"])}
          formatValue={(v) => `${v} min`}
        />
        <div className="mt-4 flex flex-wrap gap-2">
          {([15, 30, 45, 60, 90, 120] as const).map((m) => (
            <button
              key={m}
              onClick={() => update("dailyGoalMinutes", m)}
              className={`px-3 py-1.5 rounded-xl text-[12px] font-bold border transition-all ${
                local.dailyGoalMinutes === m
                  ? "bg-green-600 text-white border-green-600"
                  : "bg-gray-50 text-gray-600 border-gray-200 hover:border-green-400"
              }`}>
              {m}m
            </button>
          ))}
        </div>

        <div className="mt-5">
          <SettingsGroupLabel label="Weekly Target Sessions" />
          <SettingsRange
            label=""
            value={local.weeklyTargetSessions}
            min={1}
            max={14}
            step={1}
            onChange={(v) => update("weeklyTargetSessions", v)}
            formatValue={(v) => `${v} session${v !== 1 ? "s" : ""}/week`}
          />
        </div>
      </SettingsCard>

      {/* Preferred study time */}
      <SettingsCard
        title="Preferred Study Time"
        description="When do you study best? We'll schedule reminders accordingly.">
        <div className="grid grid-cols-2 gap-2">
          {STUDY_TIMES.map(({ id, label }) => {
            const active = local.preferredStudyTime === id;
            return (
              <button
                key={id}
                onClick={() => update("preferredStudyTime", id)}
                className={`flex items-center gap-2.5 px-4 py-3 rounded-xl border-2 text-left transition-all text-[13px] font-semibold ${
                  active
                    ? "border-green-500 bg-green-50 text-green-800"
                    : "border-gray-100 bg-gray-50 text-gray-600 hover:border-gray-200 hover:bg-white"
                }`}>
                {label}
              </button>
            );
          })}
        </div>
      </SettingsCard>

      {/* Primary goal */}
      <SettingsCard
        title="Primary Learning Goal"
        description="We'll tailor your content, practice tests, and recommendations around this">
        <div className="space-y-2">
          {GOALS.map(({ id, label }) => {
            const active = local.primaryGoal === id;
            return (
              <button
                key={id}
                onClick={() => update("primaryGoal", id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-left transition-all ${
                  active
                    ? "border-green-500 bg-green-50"
                    : "border-gray-100 bg-white hover:border-gray-200"
                }`}>
                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                    active ? "border-green-500 bg-green-500" : "border-gray-300"
                  }`}>
                  {active && <div className="w-2 h-2 rounded-full bg-white" />}
                </div>
                <span
                  className={`text-[14px] font-semibold ${active ? "text-green-800" : "text-gray-700"}`}>
                  {label}
                </span>
              </button>
            );
          })}
        </div>
      </SettingsCard>

      {/* Subjects of focus */}
      <SettingsCard
        title="Subjects of Focus"
        description="Select the subjects you want prioritised in your feed and practice sessions">
        <div className="flex flex-wrap gap-2">
          {SUBJECTS_LIST.map((subject) => {
            const active = local.subjectsOfFocus.includes(subject);
            return (
              <button
                key={subject}
                onClick={() => toggleSubject(subject)}
                className={`px-4 py-2 rounded-full text-[13px] font-semibold border transition-all ${
                  active
                    ? "bg-green-600 text-white border-green-600 shadow-sm"
                    : "bg-white text-gray-600 border-gray-200 hover:border-green-400 hover:text-green-700"
                }`}>
                {capitalize(subject)}
              </button>
            );
          })}
        </div>
        <p className="text-[11px] text-gray-400 mt-3">
          {local.subjectsOfFocus.length} subject{local.subjectsOfFocus.length !== 1 ? "s" : ""}{" "}
          selected
        </p>
      </SettingsCard>

      {/* Quiz & behaviour toggles */}
      <SettingsCard title="Quiz & Learning Behaviour">
        <SettingsGroupLabel label="Default Quiz Difficulty" />
        <div className="space-y-2 mb-5">
          {DIFFICULTY_OPTIONS.map(({ id, label, desc }) => {
            const active = local.defaultQuizDifficulty === id;
            return (
              <button
                key={id}
                onClick={() => update("defaultQuizDifficulty", id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-left transition-all ${
                  active
                    ? "border-green-500 bg-green-50"
                    : "border-gray-100 bg-white hover:border-gray-200"
                }`}>
                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                    active ? "border-green-500 bg-green-500" : "border-gray-300"
                  }`}>
                  {active && <div className="w-2 h-2 rounded-full bg-white" />}
                </div>
                <div>
                  <p
                    className={`text-[13px] font-bold ${active ? "text-green-800" : "text-gray-700"}`}>
                    {label}
                  </p>
                  <p className="text-[11px] text-gray-400">{desc}</p>
                </div>
              </button>
            );
          })}
        </div>

        <ToggleRow
          label="Show Explanations After Answer"
          description="Display the correct answer and explanation immediately after each question"
          value={local.showExplanationsAfterAnswer}
          onChange={(v) => update("showExplanationsAfterAnswer", v)}
        />
        <ToggleRow
          label="Auto-play Videos"
          description="Automatically play the next video in a playlist"
          value={local.autoPlayVideos}
          onChange={(v) => update("autoPlayVideos", v)}
        />
        <ToggleRow
          label="Sound Effects"
          description="Play sounds for correct answers, achievements, and alerts"
          value={local.soundEffects}
          onChange={(v) => update("soundEffects", v)}
        />
        <ToggleRow
          label="Streak Reminders"
          description="Get notified before your daily streak is about to break"
          value={local.streakReminders}
          onChange={(v) => update("streakReminders", v)}
        />

        <SaveBar
          visible={isDirty || saved}
          onSave={handleSave}
          onDiscard={() => {
            setLocal(settings);
            setSaved(false);
            setError(null);
          }}
          isSaving={isSaving}
          saved={saved}
          error={error}
        />
      </SettingsCard>

      {/* Exam behaviour — these map to real UserSettings columns
          (shuffleQuestions, shuffleOptions, showTimerDuringExam,
          autoSubmitOnTime, backgroundMusic, soundVolume) that had no UI
          control anywhere before now. */}
      <SettingsCard
        title="Exam Behaviour"
        description="Controls that apply during timed CBT practice sessions">
        <ToggleRow
          label="Shuffle Questions"
          description="Present questions in a different order each attempt"
          value={local.shuffleQuestions ?? false}
          onChange={(v) => update("shuffleQuestions", v)}
        />
        <ToggleRow
          label="Shuffle Answer Options"
          description="Randomise the order of multiple-choice options"
          value={local.shuffleOptions ?? false}
          onChange={(v) => update("shuffleOptions", v)}
        />
        <ToggleRow
          label="Show Timer During Exam"
          description="Display the countdown timer while a timed session is active"
          value={local.showTimerDuringExam ?? true}
          onChange={(v) => update("showTimerDuringExam", v)}
        />
        <ToggleRow
          label="Auto-submit When Time Is Up"
          description="Automatically submit your answers when the timer hits zero"
          value={local.autoSubmitOnTime ?? true}
          onChange={(v) => update("autoSubmitOnTime", v)}
        />
        <ToggleRow
          label="Background Music"
          description="Play ambient background music during study sessions"
          value={local.backgroundMusic ?? true}
          onChange={(v) => update("backgroundMusic", v)}
        />
        <SettingsRange
          label="Sound Volume"
          value={local.soundVolume ?? 70}
          min={0}
          max={100}
          step={10}
          formatValue={(v) => `${v}%`}
          onChange={(v) => update("soundVolume", v)}
        />

        <SaveBar
          visible={isDirty || saved}
          onSave={handleSave}
          onDiscard={() => {
            setLocal(settings);
            setSaved(false);
            setError(null);
          }}
          isSaving={isSaving}
          saved={saved}
          error={error}
        />
      </SettingsCard>
    </div>
  );
}
