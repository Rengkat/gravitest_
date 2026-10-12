import { Award, Flame, Target, GraduationCap } from "lucide-react";
import Link from "next/link";

interface AchievementsProps {
  currentStreak: number;
  totalExamsTaken: number;
  level: number;
  levelTitle: string;
}

// There's no dedicated Achievement/Badge entity on the backend — these are
// derived client-side from real StudentProfile stats (streak, exams taken,
// level) rather than a fabricated badge-unlock history. Simple milestone
// checks, not a claim of a tracked achievements system.
const Achievements = ({ currentStreak, totalExamsTaken, level, levelTitle }: AchievementsProps) => {
  const milestones = [
    {
      icon: Flame,
      show: currentStreak >= 3,
      title: `${currentStreak}-Day Streak`,
      description: "Keep studying daily to grow it further",
    },
    {
      icon: Target,
      show: totalExamsTaken >= 1,
      title: totalExamsTaken === 1 ? "First Exam Completed" : `${totalExamsTaken} Exams Completed`,
      description: "Every session sharpens your recall",
    },
    {
      icon: GraduationCap,
      show: level >= 2,
      title: `Level ${level} — ${levelTitle}`,
      description: "Earned through consistent practice XP",
    },
  ].filter((m) => m.show);

  return (
    <div className="p-6 rounded-2xl bg-gradient-to-br from-green-800 to-green-700 text-white">
      <div className="flex items-center gap-2 mb-4">
        <Award size={18} />
        <h2 className="font-serif text-xl">Your Progress</h2>
      </div>

      {milestones.length > 0 ? (
        <div className="space-y-3">
          {milestones.map(({ icon: Icon, title, description }) => (
            <div key={title} className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                <Icon size={14} />
              </div>
              <div>
                <div className="text-[13px] font-semibold">{title}</div>
                <div className="text-[11px] text-white/60">{description}</div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-[13px] text-white/70">
          Complete a practice session to start building your progress here.
        </p>
      )}

      <Link
        href="/dashboard/games"
        className="inline-flex items-center gap-1 mt-4 text-[12px] font-semibold text-gold">
        Play & earn more XP →
      </Link>
    </div>
  );
};

export default Achievements;
