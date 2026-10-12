import {
  CreditCard,
  Building2,
  Smartphone,
  Banknote,
  QrCode,
  Apple,
  CheckCircle,
  XCircle,
  Clock,
  RotateCcw,
  AlertCircle,
  Crown,
  Zap,
  Star,
  Gift,
} from "lucide-react";
import type { TransactionStatus, TransactionChannel, TransactionType, SubscriptionTier } from "./types";

export const TX_STATUS_CONFIG: Record<
  TransactionStatus,
  { label: string; color: string; bg: string; icon: any }
> = {
  success: { label: "Success", color: "#10b981", bg: "#d1fae5", icon: CheckCircle },
  pending: { label: "Pending", color: "#f59e0b", bg: "#fef3c7", icon: Clock },
  failed: { label: "Failed", color: "#ef4444", bg: "#fee2e2", icon: XCircle },
  abandoned: { label: "Abandoned", color: "#9ca3af", bg: "#f3f4f6", icon: AlertCircle },
  reversed: { label: "Reversed", color: "#6366f1", bg: "#e0e7ff", icon: RotateCcw },
};

export const CHANNEL_CONFIG: Record<TransactionChannel, { label: string; icon: any }> = {
  card: { label: "Card", icon: CreditCard },
  bank: { label: "Bank", icon: Building2 },
  bank_transfer: { label: "Bank Transfer", icon: Building2 },
  ussd: { label: "USSD", icon: Smartphone },
  qr: { label: "QR", icon: QrCode },
  mobile_money: { label: "Mobile Money", icon: Banknote },
  apple_pay: { label: "Apple Pay", icon: Apple },
};

export const TYPE_CONFIG: Record<TransactionType, { label: string }> = {
  subscription: { label: "Subscription" },
  content_purchase: { label: "Content Purchase" },
  wallet_funding: { label: "Wallet Funding" },
  other: { label: "Other" },
};

export const TIER_CONFIG: Record<SubscriptionTier, { label: string; color: string; icon: any }> = {
  free: { label: "Free", color: "#9ca3af", icon: Gift },
  basic: { label: "Basic", color: "#0284c7", icon: Star },
  standard: { label: "Standard", color: "#8b5cf6", icon: Zap },
  premium: { label: "Premium", color: "#f59e0b", icon: Crown },
  enterprise: { label: "Enterprise", color: "#ef4444", icon: Crown },
};
