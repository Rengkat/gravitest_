import { ICON_CLASSES, INLINE_BADGE_CLASSES, NavItemData } from "@/lib/constants/NavConstants";
import Link from "next/link";

export default function DropdownItem({
  icon: Icon,
  color,
  title,
  desc,
  badge,
  badgeStyle,
  link,
}: NavItemData) {
  return (
    <Link
      href={link || "#"}
      className="group flex items-start gap-3 p-3.5 rounded-lg border border-transparent no-underline transition-all duration-200 hover:bg-green-50 hover:border-green-500/20">
      <div
        className={`w-9 h-9 shrink-0 rounded-md flex items-center justify-center ${ICON_CLASSES[color]}`}>
        <Icon size={16} strokeWidth={1.75} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
          <span className="text-[13.5px] font-bold leading-snug text-text-main">{title}</span>
          {badge && badgeStyle && (
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold tracking-wide ${INLINE_BADGE_CLASSES[badgeStyle]}`}>
              {badge}
            </span>
          )}
        </div>
        <p className="text-xs text-text-muted leading-relaxed m-0">{desc}</p>
      </div>
    </Link>
  );
}
