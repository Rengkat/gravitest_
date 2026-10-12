import { FileText, BookPlus, ClipboardCheck, Download, Bell } from "lucide-react";
import type { LucideIcon } from "lucide-react";

type Addon = { Icon: LucideIcon; name: string; desc: string; price: string; unit: string };

/* ─── Data ───────────────────────────────────────────────── */
const ADDONS: Addon[] = [
  {
    Icon:  FileText,
    name:  "WAEC Essay Marking Pack",
    desc:  "AI grades 50 essay submissions with line-by-line feedback, vocabulary suggestions and score breakdown.",
    price: "₦2,000",
    unit:  "/ 50 essays",
  },
  {
    Icon:  BookPlus,
    name:  "Extra Subject Pack",
    desc:  "Add 3 additional subjects to your Free plan. Great for students juggling core and elective subjects.",
    price: "₦800",
    unit:  "/ month",
  },
  {
    Icon:  ClipboardCheck,
    name:  "Mock Exam Bundle",
    desc:  "10 additional mock exams beyond the plan limit. Time-bound, interface-accurate, fully reviewed.",
    price: "₦1,500",
    unit:  "/ 10 mocks",
  },
  {
    Icon:  Download,
    name:  "Offline Mega Pack",
    desc:  "Download the full question bank for your exam type. Practice anywhere with zero data — one-time download.",
    price: "₦2,500",
    unit:  "one-time",
  },
  {
    Icon:  Bell,
    name:  "Parent Weekly Reports",
    desc:  "Automated WhatsApp performance summary sent to parents every Friday. Available for individual students.",
    price: "₦500",
    unit:  "/ month",
  },
];

/* ─── Card ───────────────────────────────────────────────── */
function AddonCard({ Icon, name, desc, price, unit, index }: Addon & { index: number }) {
  return (
    <div
      className="flex flex-col gap-3 p-7 rounded-[18px] border-[1.5px] border-cream-border bg-white transition-all duration-[250ms] hover:-translate-y-[3px] hover:shadow-[var(--shadow-card)] hover:border-green-500/25 [animation:fadeUp_0.6s_ease_both]"
      style={{ animationDelay: `${index * 0.08}s` }}
    >
      <div className="w-10 h-10 rounded-[10px] bg-green-500/10 flex items-center justify-center">
        <Icon size={18} strokeWidth={1.75} className="text-green-600" />
      </div>
      <div className="text-[15px] font-bold text-green-900">{name}</div>
      <div className="text-[13px] text-text-muted leading-[1.6] flex-1">{desc}</div>
      <div className="font-serif text-[22px] text-green-800">
        {price} <span className="font-sans text-[13px] font-medium text-text-muted">{unit}</span>
      </div>
    </div>
  );
}

/* ─── Section ────────────────────────────────────────────── */
export default function AddOns() {
  return (
    <section className="px-[5%] pb-[100px]">
      <div className="max-w-[900px] mx-auto">

        {/* Header */}
        <div className="inline-flex items-center gap-2 mb-4 before:content-[''] before:block before:w-6 before:h-0.5 before:rounded-sm before:bg-green-500">
          <span className="text-[11px] font-bold text-green-600 tracking-[0.12em] uppercase">Add-ons</span>
        </div>
        <h2
          className="font-serif text-green-900 tracking-[-0.5px] mb-2"
          style={{ fontSize: "clamp(26px, 3vw, 38px)" }}
        >
          Extend your plan
        </h2>
        <p className="text-[15px] text-text-muted mb-10">
          Available on the Student Pro plan. Add what you need, skip what you don&apos;t.
        </p>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {ADDONS.map((addon, i) => (
            <AddonCard key={addon.name} {...addon} index={i} />
          ))}
        </div>

      </div>
    </section>
  );
}
