import {
  Bell,
  Shield,
  Users,
  CreditCard,
  AlertTriangle,
  TrendingUp,
  Server,
  Database,
  CheckCircle,
  Activity,
  Zap,
  Lock,
  RefreshCw,
} from "lucide-react";
import type {
  AdminNotificationType,
  NotificationPriority,
  NotificationFilter,
  AdminNotification,
} from "./types";

// ─── TYPE CONFIG ──────────────────────────────────────────────
export const NOTIFICATION_TYPE_CONFIG: Record<
  AdminNotificationType,
  { icon: any; color: string; bg: string; label: string; category: string }
> = {
  user_signup: {
    icon: Users,
    color: "#2e8b57",
    bg: "#e8f5e9",
    label: "User Signup",
    category: "users",
  },
  user_report: {
    icon: Shield,
    color: "#f59e0b",
    bg: "#fed7aa",
    label: "User Report",
    category: "users",
  },
  payment_dispute: {
    icon: AlertTriangle,
    color: "#ef4444",
    bg: "#fee2e2",
    label: "Payment Dispute",
    category: "payments",
  },
  system_alert: {
    icon: AlertTriangle,
    color: "#ef4444",
    bg: "#fee2e2",
    label: "System Alert",
    category: "system",
  },
  backup_completed: {
    icon: Database,
    color: "#10b981",
    bg: "#d1fae5",
    label: "Backup Done",
    category: "system",
  },
  high_usage_alert: {
    icon: TrendingUp,
    color: "#f59e0b",
    bg: "#fed7aa",
    label: "Usage Alert",
    category: "system",
  },
  fraud_alert: {
    icon: Lock,
    color: "#ef4444",
    bg: "#fee2e2",
    label: "Fraud Alert",
    category: "security",
  },
  subscription_expiring: {
    icon: CreditCard,
    color: "#f59e0b",
    bg: "#fed7aa",
    label: "Sub. Expiring",
    category: "payments",
  },
  server_status: {
    icon: Server,
    color: "#3b82f6",
    bg: "#dbeafe",
    label: "Server Status",
    category: "system",
  },
  database_backup: {
    icon: Database,
    color: "#10b981",
    bg: "#d1fae5",
    label: "DB Backup",
    category: "system",
  },
  new_feature: {
    icon: Zap,
    color: "#8b5cf6",
    bg: "#ede9fe",
    label: "New Feature",
    category: "platform",
  },
  admin_action: {
    icon: Shield,
    color: "#6b7280",
    bg: "#f3f4f6",
    label: "Admin Action",
    category: "admin",
  },
};

// ─── PRIORITY CONFIG ──────────────────────────────────────────
export const PRIORITY_CONFIG: Record<
  NotificationPriority,
  { label: string; color: string; bg: string; textClass: string }
> = {
  high: { label: "Urgent", color: "#ef4444", bg: "#fee2e2", textClass: "text-red-600" },
  medium: { label: "Medium", color: "#f97316", bg: "#ffedd5", textClass: "text-orange-600" },
  low: { label: "Low", color: "#10b981", bg: "#d1fae5", textClass: "text-green-600" },
};

// ─── FILTER LABELS ────────────────────────────────────────────
export const FILTER_CONFIG: {
  key: NotificationFilter;
  label: string;
  color: string;
}[] = [
  { key: "all", label: "All", color: "#2e8b57" },
  { key: "unread", label: "Unread", color: "#3b82f6" },
  { key: "read", label: "Resolved", color: "#10b981" },
  { key: "archived", label: "Archived", color: "#6b7280" },
  { key: "high", label: "Urgent", color: "#ef4444" },
  { key: "medium", label: "Medium Priority", color: "#f97316" },
  { key: "low", label: "Low Priority", color: "#10b981" },
];
