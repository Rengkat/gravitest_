import Link from "next/link";
import { LucideIcon, BookOpen } from "lucide-react";

type SessionItem = {
  id: string;
  subject: string;
  examType: string;
  date: string;
  duration: string;
  score: number;
  total: number;
  icon?: LucideIcon;
  iconBgColor?: string;
  iconColor?: string;
  hrefPrefix?: string;
};

type RecentSessionListProps = {
  sessions: SessionItem[];
  emptyMessage?: string;
  maxItems?: number;
};

const RecentSessionList = ({
  sessions,
  emptyMessage = "No recent sessions",
  maxItems,
}: RecentSessionListProps) => {
  const displaySessions = maxItems ? sessions.slice(0, maxItems) : sessions;

  if (displaySessions.length === 0) {
    return <div className="text-center py-6 text-text-muted text-sm">{emptyMessage}</div>;
  }

  return (
    <div className="space-y-1">
      {displaySessions.map((session) => {
        const Icon = session.icon || BookOpen;
        const iconBgColor = session.iconBgColor || "bg-green-500/10";
        const iconColor = session.iconColor || "text-green-600";
        const hrefPrefix = session.hrefPrefix || "/dashboard/reports";

        return (
          <Link
            key={session.id}
            href={`${hrefPrefix}/${session.id}`}
            className="flex items-center justify-between p-3 rounded-xl hover:bg-cream transition-colors">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-lg ${iconBgColor} flex items-center justify-center`}>
                <Icon size={16} className={iconColor} />
              </div>
              <div>
                <div className="text-[13px] font-semibold text-green-900">{session.subject}</div>
                <div className="text-[11px] text-text-muted">
                  {session.examType} • {session.date} • {session.duration}
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-[15px] font-bold text-green-900">
                {session.score}/{session.total}
              </div>
              <div className="text-[11px] text-text-muted">
                {Math.round((session.score / session.total) * 100)}%
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
};

export default RecentSessionList;
