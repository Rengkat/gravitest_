import {
  Rocket,
  FileText,
  Bot,
  BarChart3,
  CreditCard,
  Wifi,
  Lock,
  MessageCircle,
  Mail,
  MessageSquare,
  Clock,
  Shield,
  BookOpen,
  Users,
} from "lucide-react";

export type ArticleStatus = "new" | "updated" | null;

export type Article = {
  slug: string;
  title: string;
  status?: ArticleStatus;
};

export type Category = {
  icon: React.ElementType; // Changed from string to Lucide icon component
  title: string;
  description: string;
  color: string; // Tailwind-safe hex for icon bg tint
  articles: Article[];
};

export type FaqItem = {
  question: string;
  answer: string;
  category: string;
};

export type ContactOption = {
  icon: React.ElementType; // Changed from string to Lucide icon component
  title: string;
  desc: string;
  cta: string;
  href: string;
  primary: boolean;
};

/* ─────────────────────────────────────────────────────────
   HELP CATEGORIES & ARTICLES
───────────────────────────────────────────────────────── */
export const CATEGORIES: Category[] = [
  {
    icon: Rocket,
    title: "Getting Started",
    color: "#2e8b57",
    description: "Create your account, set up your exam targets, and take your first mock.",
    articles: [
      { slug: "create-account", title: "How to create a free account" },
      {
        slug: "choose-exam",
        title: "Choosing your exam type (JAMB, WAEC, Post-UTME)",
        status: "new",
      },
      { slug: "first-mock", title: "Taking your first practice session" },
      { slug: "set-target-score", title: "Setting a target score and exam date" },
      { slug: "mobile-app", title: "Using Gravitest on mobile devices" },
    ],
  },
  {
    icon: FileText,
    title: "CBT Practice",
    color: "#1a4a2e",
    description: "Understand the exam interface, timers, question navigator, and practice modes.",
    articles: [
      { slug: "practice-modes", title: "Practice vs Mock exam modes" },
      { slug: "question-navigator", title: "Using the question navigator" },
      { slug: "flag-question", title: "Flagging questions for review" },
      { slug: "exam-timer", title: "How the exam timer works (and syncing)", status: "updated" },
      { slug: "submit-exam", title: "Submitting your exam early" },
      { slug: "waec-essay-mode", title: "WAEC / NECO essay (theory) mode guide", status: "new" },
    ],
  },
  {
    icon: Bot,
    title: "Sabi-Explain AI",
    color: "#f5c842",
    description: "Get the most out of AI-powered explanations and the Sabi-Tutor chat.",
    articles: [
      { slug: "sabi-explain-how", title: "How Sabi-Explain works" },
      { slug: "sabi-tutor-chat", title: "Chatting with Sabi-Tutor" },
      { slug: "pidgin-mode", title: "Getting explanations in Pidgin English" },
      { slug: "voice-input", title: "Using voice input on Android" },
      { slug: "ai-postmortem", title: "Reading your AI post-exam report", status: "new" },
    ],
  },
  {
    icon: BarChart3,
    title: "Performance & Analytics",
    color: "#6366f1",
    description: "Track your scores, find your weak topics, and understand your progress charts.",
    articles: [
      { slug: "score-dashboard", title: "Understanding your score dashboard" },
      { slug: "weak-topics", title: "How weak topics are identified" },
      { slug: "streak-xp", title: "Study streaks and XP explained" },
      { slug: "leaderboard", title: "National and subject leaderboards" },
      { slug: "export-results", title: "Exporting your results as PDF" },
    ],
  },
  {
    icon: CreditCard,
    title: "Billing & Subscription",
    color: "#f59e0b",
    description: "Manage your plan, understand payments, cancel or upgrade at any time.",
    articles: [
      { slug: "upgrade-pro", title: "Upgrading to Student Pro" },
      { slug: "annual-plan", title: "How the annual plan and savings work" },
      { slug: "payment-methods", title: "Accepted payment methods (Paystack, USSD, etc.)" },
      { slug: "cancel-subscription", title: "Cancelling or pausing your subscription" },
      { slug: "refund-policy", title: "Refund policy and how to request one" },
    ],
  },
  {
    icon: Wifi,
    title: "Offline & Mobile",
    color: "#10b981",
    description: "Download question banks, practice without data, and sync your answers.",
    articles: [
      { slug: "enable-offline", title: "Enabling offline mode", status: "updated" },
      { slug: "download-questions", title: "Downloading question banks for offline use" },
      { slug: "offline-sync", title: "How offline answer syncing works" },
      { slug: "pwa-install", title: "Installing Gravitest as an app (PWA)" },
    ],
  },
  {
    icon: Lock,
    title: "Account & Security",
    color: "#8b5cf6",
    description: "Password resets, phone OTP, profile settings, and account deletion.",
    articles: [
      { slug: "reset-password", title: "Resetting your password" },
      { slug: "change-phone", title: "Updating your phone number" },
      { slug: "google-auth", title: "Linking or unlinking Google login" },
      { slug: "delete-account", title: "Deleting your account and data" },
      { slug: "two-factor", title: "Setting up two-factor authentication" },
    ],
  },
];

/* ─────────────────────────────────────────────────────────
   TOP FAQs
───────────────────────────────────────────────────────── */
export const FAQS: FaqItem[] = [
  {
    category: "Getting Started",
    question: "Can I really use Gravitest for free? What's the catch?",
    answer:
      "Completely free, forever — no credit card, no trial expiry. The Free plan gives you 3 subjects, " +
      "100 past questions per month, and basic performance stats. There is no catch. We want you to " +
      "see real results before asking you for anything. If you want unlimited access and AI features, " +
      "that's when Student Pro makes sense at ₦2,500/month.",
  },
  {
    category: "CBT Practice",
    question: "Is the JAMB interface exactly the same as the real exam?",
    answer:
      "Yes — our CBT interface is a pixel-perfect replica of the JAMB UTME interface, including the " +
      "subject tab switching, the question navigator grid, the flag system, and the countdown timer. " +
      "WAEC 2026 Digital mode is also replicated exactly, including the theory/essay section.",
  },
  {
    category: "Sabi-Explain AI",
    question: "What's the difference between Sabi-Explain and Sabi-Tutor?",
    answer:
      "Sabi-Explain is the instant AI popup that fires automatically after a wrong answer — it gives " +
      "you a targeted breakdown of that specific question using Nigerian curriculum context. " +
      "Sabi-Tutor is the full AI chat assistant you can open at any time to ask any question, " +
      "request practice questions, or get concept explanations in Pidgin.",
  },
  {
    category: "Offline & Mobile",
    question: "Does Gravitest work without internet?",
    answer:
      "Yes. Student Pro includes offline mode. Download your question banks while on " +
      "Wi-Fi, then practice anywhere — on the bus, in your hostel, in a village with zero data. " +
      "Your answers are queued locally and sync automatically when you come back online.",
  },
  {
    category: "Billing & Subscription",
    question: "What payment methods do you accept?",
    answer:
      "We accept all Nigerian bank debit/credit cards (Visa, Mastercard, Verve) via Paystack, " +
      "bank transfers, USSD (*737#, *901#, etc.), Opay, and Palmpay. We do not require foreign cards.",
  },
  {
    category: "Account & Security",
    question: "I forgot my password. How do I get back in?",
    answer:
      'Go to gravitest.ng/login and click "Forgot password?". Enter your email and we\'ll send a reset ' +
      'link within 2 minutes. If you signed up with your phone number, tap "Phone OTP" on the login ' +
      "page instead — you'll receive a 6-digit code by SMS.",
  },
  {
    category: "Performance & Analytics",
    question: "How does Gravitest identify my weak topics?",
    answer:
      "After every session, our AI analyses your answer patterns across all questions. It tracks " +
      "accuracy per topic, average time per question, and trends over your last 10 sessions. " +
      "Topics where your accuracy falls below 60% are flagged as weak and prioritised in the " +
      "AI drill generator on your dashboard.",
  },
];

/* ─────────────────────────────────────────────────────────
   CONTACT OPTIONS
───────────────────────────────────────────────────────── */
export const CONTACT_OPTIONS: ContactOption[] = [
  {
    icon: MessageCircle,
    title: "Live Chat",
    desc: "Chat with our support team in real-time. Available Monday–Friday, 8am–8pm WAT.",
    cta: "Start a chat →",
    href: "#chat",
    primary: true,
  },
  {
    icon: Mail,
    title: "Email Support",
    desc: "Send us a detailed message at support@gravitest.ng. We respond within 4 hours on business days.",
    cta: "Send an email →",
    href: "mailto:support@gravitest.ng",
    primary: false,
  },
  {
    icon: MessageSquare,
    title: "WhatsApp Community",
    desc: "Join 12,000+ students on our WhatsApp group for tips, updates, and peer support.",
    href: "https://wa.me/2348000000000",
    cta: "Join community →",
    primary: false,
  },
];
export const ADDITIONAL_FAQS = [
  {
    category: "Billing & Subscription",
    question: "Can I switch from monthly to annual billing?",
    answer:
      "Yes! You can upgrade from monthly to annual billing at any time. Your remaining monthly balance will be prorated and applied as a credit toward your annual subscription. Contact our support team or go to Settings → Billing to make the switch.",
  },
  {
    category: "Billing & Subscription",
    question: "Do you offer student discounts?",
    answer:
      "We believe our Student Pro plan is already priced affordably at ₦2,500/month. However, we offer a 33% discount on annual plans (₦20,000/year instead of ₦30,000). For groups of 5+ students, contact our sales team for custom pricing.",
  },
  {
    category: "Billing & Subscription",
    question: "What happens when my subscription expires?",
    answer:
      "When your subscription expires, your account automatically reverts to the Free plan. You'll keep all your progress and data, but will lose access to Pro features like unlimited questions, AI explanations, and offline mode.",
  },
  {
    category: "Getting Started",
    question: "Can I try Pro features before upgrading?",
    answer:
      "Yes! All new accounts get a 7-day free trial of Student Pro features. No credit card required. You can cancel anytime during the trial period with no charges.",
  },
  {
    category: "Getting Started",
    question: "Is there a contract or minimum commitment?",
    answer:
      "No contracts, no minimum commitment. Both monthly and annual plans are prepaid but you can cancel anytime. For monthly plans, you won't be charged again after cancellation. For annual plans, you'll continue to have access until the end of your paid period.",
  },
];

export const STATS = [
  { icon: Clock, value: "< 2 mins", label: "Avg Response Time", color: "#2e8b57" },
  { icon: Shield, value: "30 Days", label: "Money-Back Guarantee", color: "#6366f1" },
  { icon: BookOpen, value: "24/7", label: "Access to Resources", color: "#f59e0b" },
  { icon: Users, value: "12k+", label: "Happy Students", color: "#ec4899" },
];
