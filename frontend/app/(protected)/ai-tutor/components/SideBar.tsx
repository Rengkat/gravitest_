import { RefreshCw, X } from "lucide-react";
import { SUBJECTS } from "@/lib/constants/ai-tutor";
import { Conversation, Subject } from "@/types/ai-tutor";
import ConversationItem from "./ConversationItem";

interface SidebarProps {
  selectedSubject: Subject;
  setSelectedSubject: (s: Subject) => void;
  conversations: Conversation[];
  onNewChat: () => void;
  onSelectConversation?: (id: string) => void;
  activeConversationId?: string | null;
  onRenameConversation?: (id: string, title: string) => Promise<boolean>;
  onDeleteConversation?: (id: string) => Promise<boolean>;
  mobile?: boolean;
  onClose?: () => void;
}

export default function Sidebar({
  selectedSubject,
  setSelectedSubject,
  conversations,
  onNewChat,
  onSelectConversation,
  activeConversationId = null,
  onRenameConversation,
  onDeleteConversation,
  mobile = false,
  onClose,
}: SidebarProps) {
  return (
    <nav
      aria-label="Subject navigation"
      className={`${
        mobile ? "w-full border-r-0" : "w-[260px] border-r border-green-500/[0.1]"
      } shrink-0 flex flex-col bg-white h-full overflow-hidden`}>
      {/* Header */}
      <div className="px-5 pt-5 pb-3.5 border-b border-green-500/[0.08] flex items-center justify-between">
        <span className="text-[12px] font-bold tracking-[0.1em] uppercase text-text-muted font-mono">
          Subjects
        </span>
        {mobile && onClose && (
          <button
            onClick={onClose}
            aria-label="Close subject sidebar"
            className="border-none bg-transparent cursor-pointer text-text-light hover:text-text-muted transition-colors p-0.5 rounded focus-visible:outline-2 focus-visible:outline-green-500">
            <X size={18} aria-hidden="true" />
          </button>
        )}
      </div>

      {/* Subject list */}
      <ul
        role="list"
        aria-label="Available subjects"
        className="flex-1 overflow-y-auto p-2.5 pb-0 flex flex-col gap-0.5">
        {SUBJECTS.map((s) => {
          const Icon = s.icon;
          const active = selectedSubject === s.id;
          return (
            <li key={s.id} role="listitem">
              <button
                onClick={() => {
                  setSelectedSubject(s.id as Subject);
                  onClose?.();
                }}
                aria-current={active ? "page" : undefined}
                aria-label={`Select ${s.name} — ${s.desc}`}
                className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-[10px] border-none cursor-pointer text-left transition-all focus-visible:outline-2 focus-visible:outline-green-500 ${
                  active
                    ? "bg-green-800/[0.06] outline outline-[1.5px] outline-green-800/15"
                    : "bg-transparent hover:bg-green-800/[0.03]"
                }`}>
                <div
                  aria-hidden="true"
                  className="w-[30px] h-[30px] rounded-lg shrink-0 flex items-center justify-center"
                  style={{ background: s.iconBg }}>
                  <Icon size={14} style={{ color: s.color }} />
                </div>
                <div>
                  <div
                    className={`text-[13px] ${
                      active ? "font-bold text-green-900" : "font-medium text-text-muted"
                    }`}>
                    {s.name}
                  </div>
                  <div className="text-[11px] text-text-light leading-tight">{s.desc}</div>
                </div>
              </button>
            </li>
          );
        })}
      </ul>

      {/* Recent conversations */}
      {conversations.length > 0 && (
        <section
          aria-label="Recent conversations"
          className="border-t border-green-500/[0.08] p-2.5 max-h-[42%] overflow-y-auto">
          <p className="text-[11px] font-bold tracking-[0.1em] uppercase text-text-light font-mono px-1 mb-1.5">
            Your chats
          </p>
          <ul role="list" className="flex flex-col gap-0.5">
            {conversations.map((c) => (
              <ConversationItem
                key={c.id}
                conversation={c}
                active={c.id === activeConversationId}
                onSelect={() => {
                  onSelectConversation?.(c.id);
                  onClose?.();
                }}
                onRename={(title) =>
                  onRenameConversation ? onRenameConversation(c.id, title) : Promise.resolve(false)
                }
                onDelete={() =>
                  onDeleteConversation ? onDeleteConversation(c.id) : Promise.resolve(false)
                }
              />
            ))}
          </ul>
        </section>
      )}

      {/* New chat */}
      <div className="p-3 border-t border-green-500/[0.08]">
        <button
          onClick={onNewChat}
          aria-label="Start a new conversation"
          className="w-full py-2.5 rounded-[10px] bg-green-800 border-none text-white text-[13px] font-bold cursor-pointer font-sans flex items-center justify-center gap-1.5 hover:bg-green-700 transition-colors focus-visible:outline-2 focus-visible:outline-green-400">
          <RefreshCw size={14} aria-hidden="true" />
          New conversation
        </button>
      </div>
    </nav>
  );
}
