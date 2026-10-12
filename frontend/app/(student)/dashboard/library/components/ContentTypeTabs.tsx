"use client";

import { CONTENT_TABS } from "@/lib/constants/library";
import { ContentType, LibraryItem } from "@/types/library";

interface ContentTypeTabsProps {
  items: LibraryItem[];
  activeTab: ContentType;
  onChange: (tab: ContentType) => void;
}

export default function ContentTypeTabs({ items, activeTab, onChange }: ContentTypeTabsProps) {
  return (
    <div className="flex gap-2 overflow-x-auto mb-6 pb-1">
      {CONTENT_TABS.map((tab) => {
        const Icon = tab.icon;
        const active = activeTab === tab.id;
        const count =
          tab.id === "all" ? items.length : items.filter((i) => i.type === tab.id).length;

        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id as ContentType)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-semibold whitespace-nowrap transition-all ${
              active
                ? "bg-green-800 text-white shadow-md"
                : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-100"
            }`}
          >
            <Icon size={15} />
            {tab.name}
            <span
              className={`text-[11px] px-1.5 py-0.5 rounded-full font-bold ${
                active ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"
              }`}
            >
              {count}
            </span>
          </button>
        );
      })}
    </div>
  );
}
