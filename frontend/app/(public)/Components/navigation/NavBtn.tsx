import Link from "next/link";

export default function NavBtn({
  href,
  variant,
  testId,
  children,
}: {
  href: string;
  variant: "ghost" | "primary";
  testId?: string;
  children: React.ReactNode;
}) {
  const base =
    "inline-block text-sm font-semibold no-underline font-sans cursor-pointer transition-all duration-200 rounded-sm";

  const ghost =
    "px-5 py-2.5 border border-green-800 bg-transparent text-green-800 hover:bg-green-800 hover:text-white";

  const primary =
    "px-5 py-2.5 border-none bg-green-800 text-white hover:bg-green-700 hover:-translate-y-px hover:shadow-[0_6px_20px_rgba(26,74,46,0.35)]";

  return (
    <Link
      href={href}
      data-testid={testId}
      className={`${base} ${variant === "ghost" ? ghost : primary}`}>
      {children}
    </Link>
  );
}
