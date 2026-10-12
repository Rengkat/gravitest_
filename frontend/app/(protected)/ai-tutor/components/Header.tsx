import { Menu, Trash2 } from "lucide-react";
import SubjectChip from "./SubjectChip";
import { Subject } from "@/types/ai-tutor";
import { useEffect, useRef } from "react";
import { SUBJECTS } from "@/lib/constants/ai-tutor";
import Link from "next/link";
type SubjectObject = (typeof SUBJECTS)[number];

type HeaderProps = {
  clearChat: () => void;
  sidebarOpen: boolean;
  setSidebarOpen: React.Dispatch<React.SetStateAction<boolean>>;
  currentSubject: SubjectObject;
  pidgin: boolean;
  selectedSubject: Subject;
};

const Header = ({
  clearChat,
  sidebarOpen,
  setSidebarOpen,
  currentSubject,
  pidgin,
  selectedSubject,
}: HeaderProps) => {
  const menuBtnRef = useRef<HTMLButtonElement>(null);

  // Keep aria attrs in sync with sidebarOpen
  useEffect(() => {
    const btn = menuBtnRef.current;
    if (!btn) return;
    btn.setAttribute("aria-expanded", sidebarOpen ? "true" : "false");
    if (sidebarOpen) {
      btn.setAttribute("aria-controls", "mobile-sidebar");
    } else {
      btn.removeAttribute("aria-controls");
    }
  }, [sidebarOpen]);
  return (
    <header
      className="h-16 shrink-0 bg-green-900 flex items-center justify-between px-5 border-b border-white/[0.08] relative z-10"
      role="banner">
      <div className="flex items-center gap-3">
        <button
          ref={menuBtnRef}
          type="button"
          aria-label="Open subject sidebar"
          onClick={() => setSidebarOpen((o) => !o)}
          className="lg:hidden border-none bg-white/[0.08] rounded-lg w-9 h-9 flex items-center justify-center cursor-pointer text-white hover:bg-white/[0.14] transition-colors focus-visible:outline-2 focus-visible:outline-green-400">
          <Menu size={18} aria-hidden="true" />
        </button>

        <div className="flex items-center gap-2">
          <Link
            href={"/dashboard"}
            aria-hidden="true"
            className="w-[34px] h-[34px] rounded-[9px] bg-gold/15 border border-gold/25 flex items-center justify-center font-serif text-lg text-gold">
            G
          </Link>
          <div>
            <div className="text-[15px] font-bold text-white font-serif tracking-tight leading-none">
              Sabi-Tutor
            </div>
            <div className="text-[10px] text-white/45 tracking-[0.06em] capitalized font-mono mt-0.5">
              AI Learning Assistant
            </div>
          </div>
        </div>
      </div>

      {/* Subject chip — centred. Use currentSubject.name for the aria-label string */}
      <div
        className="hidden sm:flex absolute left-1/2 -translate-x-1/2"
        aria-label={`Current subject: ${currentSubject.name}`}>
        <SubjectChip subject={selectedSubject} />
      </div>

      <div className="flex items-center gap-1.5">
        {pidgin && (
          <span
            aria-label="Pidgin mode active"
            className="px-2.5 py-0.5 rounded-full bg-gold/15 border border-gold/30 text-[10px] font-bold text-gold tracking-[0.06em] uppercase font-mono">
            🇳🇬 Pidgin
          </span>
        )}
        <button
          onClick={clearChat}
          aria-label="Clear all chat messages"
          title="Clear chat"
          className="border-none bg-white/[0.08] rounded-lg w-[34px] h-[34px] flex items-center justify-center cursor-pointer text-white/60 hover:bg-white/[0.15] hover:text-white transition-all focus-visible:outline-2 focus-visible:outline-green-400">
          <Trash2 size={15} aria-hidden="true" />
        </button>
      </div>
    </header>
  );
};

export default Header;
