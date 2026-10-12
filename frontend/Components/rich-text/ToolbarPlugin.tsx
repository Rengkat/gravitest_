"use client";

import { useCallback, useEffect, useState } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  $getSelection,
  $isRangeSelection,
  FORMAT_TEXT_COMMAND,
  SELECTION_CHANGE_COMMAND,
  COMMAND_PRIORITY_LOW,
} from "lexical";
import {
  $isListNode,
  INSERT_ORDERED_LIST_COMMAND,
  INSERT_UNORDERED_LIST_COMMAND,
  REMOVE_LIST_COMMAND,
  ListNode,
} from "@lexical/list";
import { $setBlocksType } from "@lexical/selection";
import { $createHeadingNode, $createQuoteNode, HeadingTagType } from "@lexical/rich-text";
import { $createParagraphNode } from "lexical";
import { $getNearestNodeOfType } from "@lexical/utils";
import { TOGGLE_LINK_COMMAND } from "@lexical/link";
import { Bold, Italic, Underline, List, ListOrdered, Link2, Heading2, Quote, Pilcrow } from "lucide-react";

function ToolbarButton({
  onClick,
  active,
  title,
  children,
}: {
  onClick: () => void;
  active?: boolean;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      onMouseDown={(e) => e.preventDefault()} // keep editor selection on click
      onClick={onClick}
      className={`p-1.5 rounded-lg transition-colors ${
        active ? "bg-green-100 text-green-800" : "text-gray-500 hover:bg-gray-100"
      }`}>
      {children}
    </button>
  );
}

export function ToolbarPlugin() {
  const [editor] = useLexicalComposerContext();
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [blockType, setBlockType] = useState<string>("paragraph");

  const updateToolbar = useCallback(() => {
    const selection = $getSelection();
    if (!$isRangeSelection(selection)) return;

    setIsBold(selection.hasFormat("bold"));
    setIsItalic(selection.hasFormat("italic"));
    setIsUnderline(selection.hasFormat("underline"));

    const anchorNode = selection.anchor.getNode();
    const element = anchorNode.getKey() === "root" ? anchorNode : anchorNode.getTopLevelElementOrThrow();
    const listNode = $getNearestNodeOfType(anchorNode, ListNode);
    if (listNode) {
      setBlockType(listNode.getListType() === "number" ? "ol" : "ul");
    } else {
      setBlockType(element.getType());
    }
  }, []);

  useEffect(() => {
    return editor.registerCommand(
      SELECTION_CHANGE_COMMAND,
      () => {
        updateToolbar();
        return false;
      },
      COMMAND_PRIORITY_LOW,
    );
  }, [editor, updateToolbar]);

  const formatHeading = (tag: HeadingTagType) => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        $setBlocksType(selection, () => $createHeadingNode(tag));
      }
    });
  };

  const formatParagraph = () => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        $setBlocksType(selection, () => $createParagraphNode());
      }
    });
  };

  const formatQuote = () => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        $setBlocksType(selection, () => $createQuoteNode());
      }
    });
  };

  const insertLink = () => {
    const url = window.prompt("Enter URL:");
    if (!url) return;
    editor.dispatchCommand(TOGGLE_LINK_COMMAND, url);
  };

  return (
    <div className="flex items-center gap-0.5 px-2 py-1.5 border-b border-gray-200 bg-gray-50 rounded-t-xl flex-wrap">
      <ToolbarButton
        title="Bold"
        active={isBold}
        onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "bold")}>
        <Bold size={14} />
      </ToolbarButton>
      <ToolbarButton
        title="Italic"
        active={isItalic}
        onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "italic")}>
        <Italic size={14} />
      </ToolbarButton>
      <ToolbarButton
        title="Underline"
        active={isUnderline}
        onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "underline")}>
        <Underline size={14} />
      </ToolbarButton>

      <div className="w-px h-5 bg-gray-200 mx-1" />

      <ToolbarButton title="Paragraph" active={blockType === "paragraph"} onClick={formatParagraph}>
        <Pilcrow size={14} />
      </ToolbarButton>
      <ToolbarButton title="Heading" active={blockType === "h2"} onClick={() => formatHeading("h2")}>
        <Heading2 size={14} />
      </ToolbarButton>
      <ToolbarButton title="Quote" active={blockType === "quote"} onClick={formatQuote}>
        <Quote size={14} />
      </ToolbarButton>

      <div className="w-px h-5 bg-gray-200 mx-1" />

      <ToolbarButton
        title="Bullet List"
        active={blockType === "ul"}
        onClick={() =>
          editor.dispatchCommand(
            blockType === "ul" ? REMOVE_LIST_COMMAND : INSERT_UNORDERED_LIST_COMMAND,
            undefined,
          )
        }>
        <List size={14} />
      </ToolbarButton>
      <ToolbarButton
        title="Numbered List"
        active={blockType === "ol"}
        onClick={() =>
          editor.dispatchCommand(
            blockType === "ol" ? REMOVE_LIST_COMMAND : INSERT_ORDERED_LIST_COMMAND,
            undefined,
          )
        }>
        <ListOrdered size={14} />
      </ToolbarButton>

      <div className="w-px h-5 bg-gray-200 mx-1" />

      <ToolbarButton title="Link" onClick={insertLink}>
        <Link2 size={14} />
      </ToolbarButton>
    </div>
  );
}
