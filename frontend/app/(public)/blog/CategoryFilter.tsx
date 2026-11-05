import DynamicIcon from "@/Components/DynamicIcon";
import type { CategoryId } from "./blogData";
import type { PublicItem, } from "@/lib/api/site-content";
import type { BlogCategoryItem } from "@/lib/site-content/types";

interface Props {
  categories: PublicItem<BlogCategoryItem>[];
  active: CategoryId;
  onChange: (id: CategoryId) => void;
}

export default function CategoryFilter({ categories, active, onChange }: Props) {
  if (!categories.length) return null;
  const tabs = [{ id: "all", label: "All Posts", icon: "BookOpen" }, ...categories.map((c) => ({ id: c.slug, label: c.label, icon: c.icon ?? "" }))];

  return (
    <div className="px-[5%] mb-10">
      <div role="group" aria-label="Filter posts by category" className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {tabs.map(({ id, label, icon }) => {
          const isActive = active === id;
          return (
            <button
              key={id}
              type="button"
              aria-pressed={isActive}
              onClick={() => onChange(id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all duration-200 border shrink-0 cursor-pointer
                ${isActive
                  ? "bg-green-800 text-white border-green-800 shadow-[0_2px_12px_rgba(26,74,46,0.25)]"
                  : "bg-white text-text-muted border-cream-border hover:border-green-800/30 hover:text-green-800 hover:bg-green-50"
                }`}>
              <DynamicIcon name={icon} size={14} strokeWidth={isActive ? 2.5 : 1.75} />
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
