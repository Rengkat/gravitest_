import { ArrowRight, LucideIcon } from "lucide-react";
import Link from "next/link";

type QuickActionProps = {
  href: string;
  gradient: string;
  icon: LucideIcon;
  title: string;
  description: string;
  textColor?: string;
  descriptionColor?: string;
};

const QuickActionCard = ({
  href,
  gradient,
  icon: Icon,
  title,
  description,
  textColor = "text-white",
  descriptionColor = "text-white/60",
}: QuickActionProps) => {
  return (
    <Link
      href={href}
      className={`group p-5 rounded-2xl bg-gradient-to-r ${gradient} ${textColor} transition-all hover:scale-[1.02]`}>
      <div className="flex items-center justify-between mb-3">
        <Icon size={24} />
        <ArrowRight
          size={18}
          className="opacity-0 group-hover:opacity-100 transition-all group-hover:translate-x-1"
        />
      </div>
      <div className="text-[15px] font-semibold mb-1">{title}</div>
      <div className={`text-[12px] ${descriptionColor}`}>{description}</div>
    </Link>
  );
};

export default QuickActionCard;
