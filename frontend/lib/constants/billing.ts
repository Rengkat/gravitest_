import { Transaction, TransactionStatus, PaymentChannel, CardBrand } from "@/types/billing";
import {
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock,
  CreditCard,
  Building,
  Smartphone,
  QrCode,
} from "lucide-react";

// ── Status configs ────────────────────────────────────────────────────────

export const TX_STATUS_CONFIG: Record<
  TransactionStatus,
  {
    label: string;
    icon: any;
    textColor: string;
    bgColor: string;
    borderColor: string;
  }
> = {
  paid: {
    label: "Paid",
    icon: CheckCircle,
    textColor: "text-green-700",
    bgColor: "bg-green-50",
    borderColor: "border-green-200",
  },
  failed: {
    label: "Failed",
    icon: XCircle,
    textColor: "text-red-700",
    bgColor: "bg-red-50",
    borderColor: "border-red-200",
  },
  refunded: {
    label: "Refunded",
    icon: AlertCircle,
    textColor: "text-orange-700",
    bgColor: "bg-orange-50",
    borderColor: "border-orange-200",
  },
  pending: {
    label: "Pending",
    icon: Clock,
    textColor: "text-amber-700",
    bgColor: "bg-amber-50",
    borderColor: "border-amber-200",
  },
};

export const CHANNEL_CONFIG: Record<PaymentChannel, { label: string; icon: any }> = {
  card: { label: "Card", icon: CreditCard },
  bank_transfer: { label: "Bank Transfer", icon: Building },
  ussd: { label: "USSD", icon: Smartphone },
  qr: { label: "QR Code", icon: QrCode },
};

export const BRAND_CONFIG: Record<CardBrand, { label: string; bg: string; text: string }> = {
  visa: { label: "VISA", bg: "bg-blue-600", text: "text-white" },
  mastercard: { label: "MC", bg: "bg-orange-500", text: "text-white" },
  verve: { label: "VERVE", bg: "bg-green-600", text: "text-white" },
};

export const CONTENT_TYPE_CONFIG: Record<
  string,
  { label: string; icon: string; iconBg: string; iconText: string }
> = {
  past_papers: {
    label: "Past Papers",
    icon: "📄",
    iconBg: "bg-blue-50",
    iconText: "text-blue-600",
  },
  video_bundle: {
    label: "Video Bundle",
    icon: "🎬",
    iconBg: "bg-purple-50",
    iconText: "text-purple-600",
  },
  ebook: { label: "eBook", icon: "📚", iconBg: "bg-amber-50", iconText: "text-amber-600" },
  practice_set: {
    label: "Practice Set",
    icon: "✏️",
    iconBg: "bg-green-50",
    iconText: "text-green-600",
  },
};

// ── Helpers ───────────────────────────────────────────────────────────────

export function formatDate(d: string): string {
  return new Date(d).toLocaleDateString("en-NG", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
  }).format(amount);
}

export function formatMinutes(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

/** Generate invoice-text and trigger browser download */
export function downloadInvoice(tx: Transaction): void {
  const lines = [
    "========================================",
    "         Gravitest LEARNING HUB",
    "              TAX INVOICE",
    "========================================",
    "",
    `Invoice ID   : ${tx.paystackReference}`,
    `Issue Date   : ${formatDate(tx.date)}`,
    "",
    "DESCRIPTION",
    "----------------------------------------",
    tx.description,
    "",
    "PAYMENT",
    "----------------------------------------",
    `Method       : ${tx.cardUsed}`,
    `Channel      : ${tx.channel.replace("_", " ").toUpperCase()}`,
    `Amount       : ${formatCurrency(tx.amount)}`,
    `Status       : ${tx.status.toUpperCase()}`,
    "",
    "========================================",
    "   Thank you for learning with Gravitest!",
    "     support@gravitest.ng | gravitest.ng  ",
    "========================================",
  ];
  const blob = new Blob([lines.join("\n")], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `invoice-${tx.paystackReference}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
