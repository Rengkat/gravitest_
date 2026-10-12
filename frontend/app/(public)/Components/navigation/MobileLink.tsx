import { LucideIcon } from "@/lib/constants/NavConstants";
import Link from "next/dist/client/link";

export default function MobileLink({
  icon: Icon,
  href = "#",
  onClick,
  children,
}: {
  icon: LucideIcon;
  href?: string;
  onClick?: () => void;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="flex items-center gap-3 px-3.5 py-3 rounded-lg no-underline text-sm font-medium text-text-main transition-colors duration-150 hover:bg-green-800/[0.06] hover:text-green-800">
      <div className="w-8 h-8 shrink-0 rounded-sm bg-green-500/10 text-green-600 flex items-center justify-center">
        <Icon size={15} strokeWidth={1.75} />
      </div>
      {children}
    </Link>
  );
}
