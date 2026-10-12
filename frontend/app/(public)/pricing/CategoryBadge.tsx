import { CreditCard, HelpCircle, Zap } from "lucide-react";

export default function CategoryBadge({ category }: { category: string }) {
  const getIcon = () => {
    switch (category) {
      case "Getting Started":
        return <Zap size={12} />;
      case "Billing & Subscription":
        return <CreditCard size={12} />;
      default:
        return <HelpCircle size={12} />;
    }
  };

  const getColor = () => {
    switch (category) {
      case "Getting Started":
        return { bg: "rgba(46,139,87,0.1)", text: "#2e8b57" };
      case "Billing & Subscription":
        return { bg: "rgba(245,158,11,0.1)", text: "#f59e0b" };
      default:
        return { bg: "rgba(99,102,241,0.1)", text: "#6366f1" };
    }
  };

  const colors = getColor();

  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold"
      style={{ background: colors.bg, color: colors.text }}>
      {getIcon()}
      {category}
    </span>
  );
}
