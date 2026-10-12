import { FOOTER_BADGE_CLASSES, NavItemData } from "@/lib/constants/NavConstants";
import DropdownItem from "./DropdownItem";
import FooterCta from "./FooterCta";

interface MegaDropdownProps {
  label: string;
  items: NavItemData[];
  width?: number;
  columns?: 1 | 2;
  footerCta?: string;
  footerBadge?: string;
  footerBadgeStyle?: "green" | "gold" | "new";
  alignRight?: boolean;
}

export default function MegaDropdown({
  label,
  items,
  width = 560,
  columns = 2,
  footerCta,
  footerBadge,
  footerBadgeStyle = "green",
  alignRight = false,
}: MegaDropdownProps) {
  return (
    <div
      className={`absolute top-0 ${alignRight ? "right-0" : "left-1/2 -translate-x-1/2"} bg-white rounded-xl border border-cream-border p-7 z-[100]`}
      style={{
        minWidth: width,
        boxShadow: "0 24px 80px rgba(13,43,26,0.16)",
      }}>
      {/* Section label */}
      <p className="text-[10px] font-extrabold tracking-[0.12em] uppercase text-text-light mb-3.5 pb-2.5 border-b border-cream-border m-0">
        {label}
      </p>

      {/* Grid */}
      <div
        className="grid gap-1.5"
        style={{ gridTemplateColumns: columns === 1 ? "1fr" : "1fr 1fr" }}>
        {items.map((item) => (
          <DropdownItem key={item.title} {...item} />
        ))}
      </div>

      {/* Footer */}
      {(footerCta || footerBadge) && (
        <div className="mt-4 pt-4 border-t border-cream-border flex items-center justify-between">
          {footerCta && <FooterCta>{footerCta} →</FooterCta>}
          {footerBadge && (
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold tracking-wide uppercase ${FOOTER_BADGE_CLASSES[footerBadgeStyle]}`}>
              {footerBadge}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
