import DynamicIcon from "@/Components/DynamicIcon";
import type { PricingPage } from "@/lib/site-content/types";

export default function TrustBar({ content }: { content: PricingPage }) {
  const items = content.trustItems ?? [];
  if (!items.length) return null;
  return (
    <ul className="flex items-center justify-center gap-8 flex-wrap px-[5%] py-7 border-t border-cream-border border-b border-b-cream-border bg-white mt-18 list-none">
      {items.map(({ icon, text }, i) => (
        <li key={`${text}-${i}`} className="flex items-center gap-2 text-[13px] text-text-muted font-medium">
          <div className="w-7 h-7 rounded-lg bg-green-500/10 flex items-center justify-center shrink-0">
            <DynamicIcon name={icon} size={14} strokeWidth={1.75} className="text-green-600" />
          </div>
          {text}
        </li>
      ))}
    </ul>
  );
}
