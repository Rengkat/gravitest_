import { CATEGORIES } from "./blogData";
import type { CategoryId } from "./blogData";

interface Props {
  active:   CategoryId;
  onChange: (id: CategoryId) => void;
}

export default function CategoryFilter({ active, onChange }: Props) {
  return (
    <div className="px-[5%] mb-10">
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {CATEGORIES.map(({ id, label, Icon }) => {
          const isActive = active === id;
          return (
            <button
              key={id}
              onClick={() => onChange(id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all duration-200 border shrink-0 cursor-pointer
                ${isActive
                  ? "bg-green-800 text-white border-green-800 shadow-[0_2px_12px_rgba(26,74,46,0.25)]"
                  : "bg-white text-text-muted border-cream-border hover:border-green-800/30 hover:text-green-800 hover:bg-green-50"
                }`}
            >
              <Icon size={14} strokeWidth={isActive ? 2.5 : 1.75} />
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
