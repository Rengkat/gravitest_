import Link from "next/link";

export default function FooterCta({ children }: { children: React.ReactNode }) {
  return (
    <Link
      href="#"
      className="group flex items-center gap-1.5 text-[13px] font-bold text-green-700 no-underline transition-all duration-200 hover:gap-3">
      {children}
    </Link>
  );
}
