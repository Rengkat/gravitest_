import { ChevronDown } from "lucide-react";
import { useState } from "react";

export default function NavItemWithDropdown({
  label,
  children,
  alignRight = false,
}: {
  label: string;
  children: React.ReactNode;
  alignRight?: boolean;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}>
      <button
        className={[
          "flex items-center gap-1.5 px-3.5 py-2 rounded-sm",
          "border-none cursor-pointer font-sans text-sm font-medium",
          "transition-all duration-200 whitespace-nowrap",
          open
            ? "text-green-800 bg-green-800/[0.06]"
            : "text-text-muted bg-transparent hover:text-green-800 hover:bg-green-800/[0.06]",
        ].join(" ")}
        aria-haspopup="true"
        // aria-expanded={open ? "true" : "false"} // Explicit string conversion
      >
        {label}
        <ChevronDown
          size={13}
          strokeWidth={2.5}
          className={`transition-all duration-200 ${open ? "rotate-180 opacity-100" : "opacity-50"}`}
        />
      </button>

      {open && (
        <div
          className={`absolute top-full pt-2.5 z-[100] ${alignRight ? "right-0" : "left-1/2 -translate-x-1/2"}`}>
          {children}
        </div>
      )}
    </div>
  );
}
