import {
  Bell, CheckCircle, XCircle, Calendar, MessageSquare, Video,
  CreditCard, Trophy, Flame, BookOpen, AlertTriangle, TrendingUp,
  Mail, Smartphone, Globe, BarChart3,
} from "lucide-react";
import type { NotificationChannel, NotificationType } from "./types";

// ─── NOTIFICATION TYPE CONFIG ─────────────────────────────────
export const NOTIFICATION_TYPE_CONFIG: Record<
  NotificationType,
  { icon: any; color: string; bg: string; label: string }
> = {
  exam_reminder:        { icon: Calendar,       color: "#f59e0b", bg: "#fef3c7", label: "Exam Reminder"        },
  streak_alert:         { icon: Flame,          color: "#f97316", bg: "#ffedd5", label: "Streak Alert"         },
  new_message:          { icon: MessageSquare,  color: "#3b82f6", bg: "#dbeafe", label: "New Message"          },
  session_start:        { icon: Video,          color: "#10b981", bg: "#d1fae5", label: "Session Start"        },
  session_complete:     { icon: CheckCircle,    color: "#10b981", bg: "#d1fae5", label: "Session Complete"     },
  payment_success:      { icon: CreditCard,     color: "#10b981", bg: "#d1fae5", label: "Payment Success"      },
  payment_failed:       { icon: XCircle,        color: "#ef4444", bg: "#fee2e2", label: "Payment Failed"       },
  subscription_expiring:{ icon: AlertTriangle,  color: "#f59e0b", bg: "#fef3c7", label: "Sub. Expiring"        },
  result_published:     { icon: Trophy,         color: "#8b5cf6", bg: "#ede9fe", label: "Result Published"     },
  new_content:          { icon: BookOpen,       color: "#2e8b57", bg: "#dcfce7", label: "New Content"          },
  achievement_unlocked: { icon: Trophy,         color: "#f5c842", bg: "#fef3c7", label: "Achievement"          },
  leaderboard_update:   { icon: TrendingUp,     color: "#6366f1", bg: "#e0e7ff", label: "Leaderboard"          },
  account_alert:        { icon: AlertTriangle,  color: "#ef4444", bg: "#fee2e2", label: "Account Alert"        },
  weekly_report:        { icon: BarChart3,      color: "#2e8b57", bg: "#dcfce7", label: "Weekly Report"        },
  system:               { icon: Bell,           color: "#6b7280", bg: "#f3f4f6", label: "System"               },
};

// ─── CHANNEL CONFIG ───────────────────────────────────────────
export const CHANNEL_CONFIG: Record<NotificationChannel, { icon: any; label: string; color: string }> = {
  in_app:    { icon: Bell,           label: "In-App",    color: "#2e8b57" },
  email:     { icon: Mail,           label: "Email",     color: "#3b82f6" },
  sms:       { icon: Smartphone,     label: "SMS",       color: "#8b5cf6" },
  push:      { icon: Globe,          label: "Push",      color: "#f59e0b" },
  whatsapp:  { icon: MessageSquare,  label: "WhatsApp",  color: "#10b981" },
};
