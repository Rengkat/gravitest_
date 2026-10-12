import { HeadingNode, QuoteNode } from "@lexical/rich-text";
import { ListItemNode, ListNode } from "@lexical/list";
import { LinkNode } from "@lexical/link";
import type { EditorThemeClasses } from "lexical";

// Tailwind classes applied to Lexical's generated DOM nodes. Kept in one
// place so the live editor and the read-only renderer visually match.
export const richTextTheme: EditorThemeClasses = {
  paragraph: "mb-2 last:mb-0",
  heading: {
    h1: "text-xl font-bold text-gray-900 mb-2 mt-3 first:mt-0",
    h2: "text-lg font-bold text-gray-900 mb-2 mt-3 first:mt-0",
    h3: "text-base font-bold text-gray-900 mb-1.5 mt-2 first:mt-0",
  },
  quote: "border-l-4 border-green-300 pl-3 italic text-gray-600 my-2",
  list: {
    ul: "list-disc list-inside mb-2 space-y-1",
    ol: "list-decimal list-inside mb-2 space-y-1",
    listitem: "text-[14px]",
  },
  link: "text-green-700 underline hover:text-green-800",
  text: {
    bold: "font-bold",
    italic: "italic",
    underline: "underline",
    strikethrough: "line-through",
  },
};

export const richTextNodes = [HeadingNode, QuoteNode, ListNode, ListItemNode, LinkNode];

export function richTextErrorHandler(error: Error) {
  // Lexical throws on genuinely malformed editor state (rare, usually from
  // hand-edited HTML) — log it instead of crashing the whole page.
  console.error("Lexical editor error:", error);
}
