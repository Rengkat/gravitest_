"use client";

import { useCallback, useEffect, useRef } from "react";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import { LinkPlugin } from "@lexical/react/LexicalLinkPlugin";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { $generateHtmlFromNodes, $generateNodesFromDOM } from "@lexical/html";
import { $getRoot, $insertNodes, type EditorState } from "lexical";
import { richTextTheme, richTextNodes, richTextErrorHandler } from "./theme";
import { ToolbarPlugin } from "./ToolbarPlugin";

interface RichTextEditorProps {
  initialHTML?: string;
  placeholder?: string;
  onChangeHTML: (html: string) => void;
  minHeight?: number;
  disabled?: boolean;
}

// Runs once per editor instance to seed it from HTML the caller already
// has (e.g. loading existing content for editing).
function InitialContentPlugin({ initialHTML }: { initialHTML?: string }) {
  const hasInitialized = useRef(false);
  const [editorContext] = useLexicalComposerContext();

  useEffect(() => {
    if (hasInitialized.current || !initialHTML) return;
    hasInitialized.current = true;
    editorContext.update(() => {
      const parser = new DOMParser();
      const dom = parser.parseFromString(initialHTML, "text/html");
      const nodes = $generateNodesFromDOM(editorContext, dom);
      const root = $getRoot();
      root.clear();
      $insertNodes(nodes);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialHTML]);

  return null;
}

export function RichTextEditor({
  initialHTML,
  placeholder = "Start writing...",
  onChangeHTML,
  minHeight = 160,
  disabled = false,
}: RichTextEditorProps) {
  const handleChange = useCallback(
    (editorState: EditorState, editor: any) => {
      editorState.read(() => {
        const html = $generateHtmlFromNodes(editor, null);
        onChangeHTML(html);
      });
    },
    [onChangeHTML],
  );

  const initialConfig = {
    namespace: "GravitestRichText",
    theme: richTextTheme,
    nodes: richTextNodes,
    onError: richTextErrorHandler,
    editable: !disabled,
  };

  return (
    <LexicalComposer initialConfig={initialConfig}>
      <div className="rounded-xl border border-gray-200 overflow-hidden focus-within:ring-2 focus-within:ring-green-500/30 focus-within:border-green-400 transition-all">
        {!disabled && <ToolbarPlugin />}
        <div className="relative bg-white">
          <RichTextPlugin
            contentEditable={
              <ContentEditable
                className="px-4 py-3 text-[14px] text-gray-800 focus:outline-none"
                style={{ minHeight }}
              />
            }
            placeholder={
              <div
                className="absolute top-3 left-4 text-[14px] text-gray-400 pointer-events-none select-none"
                style={{ userSelect: "none" }}>
                {placeholder}
              </div>
            }
            ErrorBoundary={LexicalErrorBoundary}
          />
          <HistoryPlugin />
          <ListPlugin />
          <LinkPlugin />
          <OnChangePlugin onChange={handleChange} />
          <InitialContentPlugin initialHTML={initialHTML} />
        </div>
      </div>
    </LexicalComposer>
  );
}
