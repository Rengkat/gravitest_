import { BookOpen, FileText, PlayCircle, ArrowRight } from "lucide-react";
import Link from "next/link";
import { LibraryItem } from "@/lib/constants/dashboard"; // adjust path to your constants file

interface LibraryItemCardProps {
  item: LibraryItem;
}

const TYPE_CONFIG = {
  ebook: { icon: BookOpen, label: "eBook" },
  doc: { icon: FileText, label: "Document" },
  video: { icon: PlayCircle, label: "Video" },
};

const LibraryItemCard = ({ item }: LibraryItemCardProps) => {
  const { icon: Icon, label } = TYPE_CONFIG[item.type];
  const meta = item.type === "video" ? item.duration : item.pages ? `${item.pages} pages` : null;

  return (
    <div key={item.id} className="p-3 rounded-xl bg-cream mb-[10px]">
      <div className="flex items-center gap-3 mb-2">
        <Icon size={14} className="text-green-600" />
        <span className="text-[13px] font-semibold text-green-900">{item.title}</span>
      </div>
      <div className="text-[12px] text-text-muted mb-2">
        {item.subject} • {label}
        {meta ? ` • ${meta}` : ""}
      </div>
      <Link
        href={`/dashboard/library/${item.id}`}
        className="inline-flex items-center gap-1 text-[12px] font-semibold text-green-600">
        Open <ArrowRight size={12} />
      </Link>
    </div>
  );
};

export default LibraryItemCard;
