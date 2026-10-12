import { Message } from "@/types/ai-tutor";
import {
  Bot,
  Calculator,
  Zap,
  FlaskConical,
  Leaf,
  BookOpen,
  Target,
  Users,
  Bookmark,
  Globe,
  Sprout,
  Languages,
  Palette,
  Church,
  ShoppingCart,
  Monitor,
  MessageCircle,
  Map,
  Home,
  Moon,
  Music,
  Dumbbell,
  Receipt,
  Sigma,
  Ruler,
  UtensilsCrossed,
  Atom,
  Users2,
  Flag,
  Briefcase,
  Paintbrush,
  Building,
  Hammer,
  Wrench,
  Car,
  FileText,
  BarChart3,
  Percent,
  SearchCheck,
  Scale,
  Heart,
  Pill,
  Stethoscope,
  Baby,
  UserCheck,
  Compass,
  Network,
  Megaphone,
  Lightbulb,
  Building2,
  Crown,
  Shield,
  Award,
} from "lucide-react";
export const SUBJECTS: {
  id: string;
  name: string;
  icon: React.ElementType;
  desc: string;
  color: string;
  iconBg: string;
}[] = [
  // Original subjects
  {
    id: "general",
    name: "General",
    icon: Bot,
    desc: "Ask anything academic",
    color: "#1a4a2e",
    iconBg: "rgba(26,74,46,0.12)",
  },
  {
    id: "mathematics",
    name: "Mathematics",
    icon: Calculator,
    desc: "Algebra, Calculus, Statistics",
    color: "#1e3a8a",
    iconBg: "rgba(30,58,138,0.10)",
  },
  {
    id: "physics",
    name: "Physics",
    icon: Zap,
    desc: "Mechanics, Thermodynamics, Optics",
    color: "#5b21b6",
    iconBg: "rgba(91,33,182,0.10)",
  },
  {
    id: "chemistry",
    name: "Chemistry",
    icon: FlaskConical,
    desc: "Organic, Inorganic, Physical",
    color: "#065f46",
    iconBg: "rgba(6,95,70,0.10)",
  },
  {
    id: "biology",
    name: "Biology",
    icon: Leaf,
    desc: "Cell biology, Genetics, Ecology",
    color: "#166534",
    iconBg: "rgba(22,101,52,0.10)",
  },
  {
    id: "english",
    name: "English",
    icon: BookOpen,
    desc: "Grammar, Literature, Comprehension",
    color: "#92400e",
    iconBg: "rgba(146,64,14,0.10)",
  },
  {
    id: "economics",
    name: "Economics",
    icon: Target,
    desc: "Micro, Macro, Development",
    color: "#9f1239",
    iconBg: "rgba(159,18,57,0.10)",
  },
  {
    id: "government",
    name: "Government",
    icon: Users,
    desc: "Political systems, Constitution",
    color: "#1e40af",
    iconBg: "rgba(30,64,175,0.10)",
  },
  {
    id: "literature",
    name: "Literature",
    icon: Bookmark,
    desc: "Prose, Poetry, Drama",
    color: "#831843",
    iconBg: "rgba(131,24,67,0.10)",
  },
  {
    id: "history",
    name: "History",
    icon: Globe,
    desc: "African, Nigerian, World History",
    color: "#78350f",
    iconBg: "rgba(120,53,15,0.10)",
  },

  // Additional subjects from various exam boards
  {
    id: "agricultural-science",
    name: "Agricultural Science",
    icon: Sprout,
    desc: "Crop production, Animal husbandry",
    color: "#4d7c0f",
    iconBg: "rgba(77,124,15,0.10)",
  },
  {
    id: "arabic",
    name: "Arabic",
    icon: Languages,
    desc: "Arabic language and literature",
    color: "#b45309",
    iconBg: "rgba(180,83,9,0.10)",
  },
  {
    id: "art",
    name: "Art (Fine Arts)",
    icon: Palette,
    desc: "Drawing, Painting, Sculpture",
    color: "#be123c",
    iconBg: "rgba(190,18,60,0.10)",
  },
  {
    id: "christian-religious-studies",
    name: "Christian Religious Studies",
    icon: Church,
    desc: "Bible knowledge, Christian doctrine",
    color: "#6d28d9",
    iconBg: "rgba(109,40,217,0.10)",
  },
  {
    id: "commerce",
    name: "Commerce",
    icon: ShoppingCart,
    desc: "Trade, Business operations",
    color: "#0e7490",
    iconBg: "rgba(14,116,144,0.10)",
  },
  {
    id: "computer-studies",
    name: "Computer Studies",
    icon: Monitor,
    desc: "Data processing, ICT, Programming",
    color: "#2563eb",
    iconBg: "rgba(37,99,235,0.10)",
  },
  {
    id: "french",
    name: "French",
    icon: MessageCircle,
    desc: "French language and culture",
    color: "#dc2626",
    iconBg: "rgba(220,38,38,0.10)",
  },
  {
    id: "geography",
    name: "Geography",
    icon: Map,
    desc: "Physical geography, Map reading",
    color: "#0891b2",
    iconBg: "rgba(8,145,178,0.10)",
  },
  {
    id: "hausa",
    name: "Hausa",
    icon: Languages,
    desc: "Hausa language and literature",
    color: "#a16207",
    iconBg: "rgba(161,98,7,0.10)",
  },
  {
    id: "home-economics",
    name: "Home Economics",
    icon: Home,
    desc: "Food & Nutrition, Home management",
    color: "#b91c1c",
    iconBg: "rgba(185,28,28,0.10)",
  },
  {
    id: "igbo",
    name: "Igbo",
    icon: Languages,
    desc: "Igbo language and literature",
    color: "#15803d",
    iconBg: "rgba(21,128,61,0.10)",
  },
  {
    id: "islamic-studies",
    name: "Islamic Studies",
    icon: Moon,
    desc: "Quran, Hadith, Islamic law",
    color: "#1e3a8a",
    iconBg: "rgba(30,58,138,0.10)",
  },
  {
    id: "music",
    name: "Music",
    icon: Music,
    desc: "Theory, Performance, History",
    color: "#7c3aed",
    iconBg: "rgba(124,58,237,0.10)",
  },
  {
    id: "physical-health-education",
    name: "Physical & Health Education",
    icon: Dumbbell,
    desc: "Sports, Health, Fitness",
    color: "#059669",
    iconBg: "rgba(5,150,105,0.10)",
  },
  {
    id: "principles-of-accounts",
    name: "Principles of Accounts",
    icon: Receipt,
    desc: "Bookkeeping, Financial records",
    color: "#475569",
    iconBg: "rgba(71,85,105,0.10)",
  },
  {
    id: "yoruba",
    name: "Yoruba",
    icon: Languages,
    desc: "Yoruba language and literature",
    color: "#9a3412",
    iconBg: "rgba(154,52,18,0.10)",
  },
  {
    id: "further-mathematics",
    name: "Further Mathematics",
    icon: Sigma,
    desc: "Advanced Math concepts",
    color: "#1e3a8a",
    iconBg: "rgba(30,58,138,0.10)",
  },
  {
    id: "technical-drawing",
    name: "Technical Drawing",
    icon: Ruler,
    desc: "Engineering drawings, Blueprints",
    color: "#334155",
    iconBg: "rgba(51,65,85,0.10)",
  },
  {
    id: "food-and-nutrition",
    name: "Food & Nutrition",
    icon: UtensilsCrossed,
    desc: "Diet, Nutrition science",
    color: "#b45309",
    iconBg: "rgba(180,83,9,0.10)",
  },
  {
    id: "basic-science",
    name: "Basic Science",
    icon: Atom,
    desc: "Fundamental science concepts",
    color: "#047857",
    iconBg: "rgba(4,120,87,0.10)",
  },
  {
    id: "social-studies",
    name: "Social Studies",
    icon: Users2,
    desc: "Society, Culture, Environment",
    color: "#c2410c",
    iconBg: "rgba(194,65,12,0.10)",
  },
  {
    id: "civic-education",
    name: "Civic Education",
    icon: Flag,
    desc: "Citizenship, Government, Rights",
    color: "#b45309",
    iconBg: "rgba(180,83,9,0.10)",
  },
  {
    id: "business-studies",
    name: "Business Studies",
    icon: Briefcase,
    desc: "Business, Entrepreneurship",
    color: "#0f766e",
    iconBg: "rgba(15,118,110,0.10)",
  },
  {
    id: "cca",
    name: "Cultural & Creative Arts",
    icon: Paintbrush,
    desc: "Arts, Crafts, Creativity",
    color: "#be185d",
    iconBg: "rgba(190,24,93,0.10)",
  },
  {
    id: "building-construction",
    name: "Building Construction",
    icon: Building,
    desc: "Construction methods, Materials",
    color: "#78716c",
    iconBg: "rgba(120,113,108,0.10)",
  },
  {
    id: "electrical-installation",
    name: "Electrical Installation",
    icon: Zap,
    desc: "Wiring, Electrical systems",
    color: "#d97706",
    iconBg: "rgba(217,119,6,0.10)",
  },
  {
    id: "woodwork",
    name: "Woodwork",
    icon: Hammer,
    desc: "Carpentry, Joinery",
    color: "#92400e",
    iconBg: "rgba(146,64,14,0.10)",
  },
  {
    id: "metalwork",
    name: "Metalwork",
    icon: Wrench,
    desc: "Metal fabrication, Welding",
    color: "#64748b",
    iconBg: "rgba(100,116,139,0.10)",
  },
  {
    id: "auto-mechanics",
    name: "Auto Mechanics",
    icon: Car,
    desc: "Vehicle repair, Maintenance",
    color: "#dc2626",
    iconBg: "rgba(220,38,38,0.10)",
  },
  {
    id: "financial-accounting",
    name: "Financial Accounting",
    icon: FileText,
    desc: "IFRS, Financial statements",
    color: "#0f766e",
    iconBg: "rgba(15,118,110,0.10)",
  },
  {
    id: "management-accounting",
    name: "Management Accounting",
    icon: BarChart3,
    desc: "Cost accounting, Budgeting",
    color: "#1d4ed8",
    iconBg: "rgba(29,78,216,0.10)",
  },
  {
    id: "taxation",
    name: "Taxation",
    icon: Percent,
    desc: "Tax law, Compliance",
    color: "#b91c1c",
    iconBg: "rgba(185,28,28,0.10)",
  },
  {
    id: "audit",
    name: "Audit and Assurance",
    icon: SearchCheck,
    desc: "Auditing standards, Ethics",
    color: "#334155",
    iconBg: "rgba(51,65,85,0.10)",
  },
  {
    id: "business-law",
    name: "Business Law",
    icon: Scale,
    desc: "Corporate law, Contracts",
    color: "#6b21a8",
    iconBg: "rgba(107,33,168,0.10)",
  },
  {
    id: "anatomy",
    name: "Anatomy and Physiology",
    icon: Heart,
    desc: "Body systems, Structure",
    color: "#dc2626",
    iconBg: "rgba(220,38,38,0.10)",
  },
  {
    id: "pharmacology",
    name: "Pharmacology",
    icon: Pill,
    desc: "Drugs, Therapeutics",
    color: "#7c3aed",
    iconBg: "rgba(124,58,237,0.10)",
  },
  {
    id: "nursing",
    name: "Nursing Practice",
    icon: Stethoscope,
    desc: "Patient care, Clinical practice",
    color: "#059669",
    iconBg: "rgba(5,150,105,0.10)",
  },
  {
    id: "midwifery",
    name: "Midwifery",
    icon: Baby,
    desc: "Maternal and child care",
    color: "#db2777",
    iconBg: "rgba(219,39,119,0.10)",
  },
  {
    id: "human-resource-management",
    name: "Human Resource Management",
    icon: UserCheck,
    desc: "HR strategy, Personnel management",
    color: "#0891b2",
    iconBg: "rgba(8,145,178,0.10)",
  },
  {
    id: "strategic-management",
    name: "Strategic Management",
    icon: Compass,
    desc: "Corporate strategy, Planning",
    color: "#1e3a8a",
    iconBg: "rgba(30,58,138,0.10)",
  },
  {
    id: "organisational-behaviour",
    name: "Organisational Behaviour",
    icon: Network,
    desc: "Workplace psychology, Culture",
    color: "#7c3aed",
    iconBg: "rgba(124,58,237,0.10)",
  },
  {
    id: "marketing",
    name: "Marketing Management",
    icon: Megaphone,
    desc: "Market strategy, Branding",
    color: "#ea580c",
    iconBg: "rgba(234,88,12,0.10)",
  },
  {
    id: "entrepreneurship",
    name: "Entrepreneurship",
    icon: Lightbulb,
    desc: "Innovation, Startups",
    color: "#d97706",
    iconBg: "rgba(217,119,6,0.10)",
  },
  {
    id: "valuation",
    name: "Valuation Principles",
    icon: Calculator,
    desc: "Property valuation, Assessment",
    color: "#475569",
    iconBg: "rgba(71,85,105,0.10)",
  },
  {
    id: "real-estate",
    name: "Real Estate",
    icon: Building2,
    desc: "Property investment, Management",
    color: "#0f766e",
    iconBg: "rgba(15,118,110,0.10)",
  },
  {
    id: "town-planning",
    name: "Town Planning",
    icon: Building,
    desc: "Urban development, Zoning",
    color: "#4f46e5",
    iconBg: "rgba(79,70,229,0.10)",
  },
  {
    id: "leadership",
    name: "Leadership",
    icon: Crown,
    desc: "Executive development, Governance",
    color: "#9f1239",
    iconBg: "rgba(159,18,57,0.10)",
  },
  {
    id: "ethics",
    name: "Ethics and Governance",
    icon: Shield,
    desc: "Corporate ethics, Compliance",
    color: "#1e3a8a",
    iconBg: "rgba(30,58,138,0.10)",
  },
];
export const QUICK_PROMPTS = [
  { icon: Lightbulb, label: "Explain Concept", prompt: "Explain the concept of " },
  { icon: Target, label: "Solve Problem", prompt: "Solve this step by step: " },
  { icon: Award, label: "Exam Tips", prompt: "Give me exam tips for " },
  { icon: FileText, label: "Summarise Topic", prompt: "Summarise this topic for JAMB/WAEC: " },
];
export const WELCOME_MESSAGE: Message = {
  id: "welcome",
  role: "assistant",
  content: `Hello! I'm **Sabi-Tutor**, your AI learning assistant from Gravitest 🎓

I can help you with any subject on the Nigerian curriculum — JAMB, WAEC, NECO, or Post-UTME.

**Here's what I can do:**
• Explain concepts in plain English (or Pidgin!)
• Solve maths and science problems step by step
• Give you past question breakdowns
• Share exam tips specific to your target school
• Generate practice questions on your weak topics

Pick a subject from the sidebar and ask me anything. What would you like to learn today?`,
  timestamp: new Date(),
  subject: "general",
};

/**
 * AI Tutor API abstraction layer.
 *
 * ─────────────────────────────────────────────────────────
 * HOW TO SWITCH FROM MOCK → REAL API
 * ─────────────────────────────────────────────────────────
 * 1. Set NEXT_PUBLIC_AI_MODE=api in your .env.local
 * 2. Create a Next.js API route at: app/api/ai-tutor/route.ts
 *    that accepts { systemPrompt, history, userMessage } and
 *    calls Anthropic (server-side, with your API key).
 * 3. This file will automatically route to it.
 *
 * The page.tsx and all components stay unchanged.
 * ─────────────────────────────────────────────────────────
 */

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ChatPayload {
  systemPrompt: string;
  history: ChatMessage[];
  userMessage: string;
}

/** Simulated network delay for mock mode */
const mockDelay = (ms: number) => new Promise<void>((res) => setTimeout(res, ms));

/** Mock response generator — realistic JAMB/WAEC flavour */
async function mockSendMessage(payload: ChatPayload): Promise<string> {
  await mockDelay(900 + Math.random() * 600);

  const q = payload.userMessage.toLowerCase();

  if (q.includes("photosynthesis")) {
    return `**Photosynthesis** is the process by which plants convert light energy into chemical energy.

The overall equation is:

\`6CO₂ + 6H₂O + light energy → C₆H₁₂O₆ + 6O₂\`

### Two main stages:
1. **Light-dependent reactions** — occur in the thylakoid membrane; produce ATP and NADPH
2. **Light-independent reactions (Calvin cycle)** — occur in the stroma; use ATP and NADPH to fix CO₂ into glucose

For WAEC, remember that **chlorophyll** is the key pigment and is found in the **chloroplast**.`;
  }

  if (q.includes("newton") || q.includes("motion")) {
    return `**Newton's Three Laws of Motion** are fundamental for both JAMB Physics and WAEC:

1. **First Law (Inertia)** — A body remains at rest or in uniform motion unless acted upon by an external force.

2. **Second Law (F = ma)** — The net force on a body equals its mass multiplied by its acceleration.
   - \`F = ma\` → force in Newtons (N), mass in kg, acceleration in m/s²

3. **Third Law (Action–Reaction)** — For every action there is an equal and opposite reaction.

### Quick exam tip:
When a question asks *"why does a gun recoil when fired?"* — that's Newton's Third Law. The bullet goes forward, the gun goes backward with equal momentum.`;
  }

  if (q.includes("quadratic") || q.includes("equation")) {
    return `To solve a **quadratic equation** of the form \`ax² + bx + c = 0\`:

### Method 1: Factorisation
Find two numbers that multiply to \`ac\` and add to \`b\`.

### Method 2: Quadratic formula
\`x = (-b ± √(b² - 4ac)) / 2a\`

The expression \`b² - 4ac\` is called the **discriminant**:
- If **> 0** → two distinct real roots
- If **= 0** → one repeated root
- If **< 0** → no real roots (complex)

### Example (JAMB 2022 style):
Solve \`x² - 5x + 6 = 0\`
- Factors: \`(x - 2)(x - 3) = 0\`
- **x = 2 or x = 3** ✓`;
  }

  /* Generic fallback */
  return `Great question! Here's what you need to know for your exams:

${payload.userMessage.length > 60 ? `You asked about: *"${payload.userMessage.slice(0, 60)}…"*` : ""}

This is a **mock response** — the real Sabi-Tutor AI will provide a detailed, curriculum-aligned answer here once connected to the Anthropic API.

### To activate the real AI:
1. Create \`src/lib/api/ai-tutor.ts\` with your API route
2. Set \`NEXT_PUBLIC_AI_MODE=api\` in \`.env.local\`
3. Add your Anthropic API key to your backend route

Keep studying — you're doing great! 💪`;
}

/**
 * Real API call — proxied through your Next.js backend to keep
 * the Anthropic API key off the client.
 *
 * Uncomment and use this when your /api/ai-tutor route is ready.
 */
// async function realSendMessage(payload: ChatPayload): Promise<string> {
//   const res = await fetch("/api/ai-tutor", {
//     method: "POST",
//     headers: { "Content-Type": "application/json" },
//     body: JSON.stringify(payload),
//   });
//   if (!res.ok) throw new Error(`API error: ${res.status}`);
//   const data = await res.json() as { text: string };
//   return data.text;
// }

/**
 * Public entry point used by page.tsx.
 * Controlled by NEXT_PUBLIC_AI_MODE env var.
 */
export async function sendChatMessage(payload: ChatPayload): Promise<string> {
  const mode = process.env.NEXT_PUBLIC_AI_MODE ?? "mock";
  if (mode === "api") {
    // return realSendMessage(payload);
    throw new Error("Real API not yet wired up. See comments in lib/api/ai-tutor.ts");
  }
  return mockSendMessage(payload);
}
