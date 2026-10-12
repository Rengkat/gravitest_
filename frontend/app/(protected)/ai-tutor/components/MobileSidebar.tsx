"use client";

import type { Subject, Conversation } from "@/types/ai-tutor";
import Sidebar from "./SideBar";

interface MobileSidebarProps {
  open: boolean;
  onClose: () => void;
  selectedSubject: Subject;
  setSelectedSubject: (s: Subject) => void;
  conversations: Conversation[];
  onNewChat: () => void;
  onSelectConversation?: (id: string) => void;
}

export default function MobileSidebar({
  open,
  onClose,
  selectedSubject,
  setSelectedSubject,
  conversations,
  onNewChat,
  onSelectConversation,
}: MobileSidebarProps) {
  if (!open) return null;

  return (
    <div
      id="mobile-sidebar"
      role="dialog"
      aria-label="Subject selection sidebar"
      aria-modal="true"
      className="absolute inset-0 z-40 flex">
      <div
        className="absolute inset-0 bg-green-900/40"
        aria-hidden="true"
        onClick={onClose}
      />
      <div className="relative z-[41] w-[280px] h-full">
        <Sidebar
          selectedSubject={selectedSubject}
          setSelectedSubject={setSelectedSubject}
          conversations={conversations}
          onNewChat={() => { onNewChat(); onClose(); }}
          onSelectConversation={onSelectConversation}
          mobile
          onClose={onClose}
        />
      </div>
    </div>
  );
}
