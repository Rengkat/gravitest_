"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Bold, Italic, Sigma, Underline } from "lucide-react";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import {
  $createParagraphNode,
  $createTextNode,
  $getNodeByKey,
  $getRoot,
  $getSelection,
  $insertNodes,
  $isElementNode,
  $isLineBreakNode,
  $isNodeSelection,
  $isRangeSelection,
  $isTextNode,
  $setSelection,
  COMMAND_PRIORITY_HIGH,
  COMMAND_PRIORITY_LOW,
  FORMAT_TEXT_COMMAND,
  KEY_DOWN_COMMAND,
  KEY_ENTER_COMMAND,
  SELECTION_CHANGE_COMMAND,
  type BaseSelection,
  type LexicalNode,
  type NodeKey,
} from "lexical";
import EquationDialog from "./EquationDialog";
import {
  $createEquationNode,
  $isEquationNode,
  EDIT_EQUATION_COMMAND,
  EquationNode,
} from "./answer-editor/EquationNode";
import {
  parseAnswer,
  pickFormat,
  serializeAnswer,
  type AnswerDoc,
  type AnswerRun,
  type TextFormat,
} from "@/lib/content/answerDoc";

const SYMBOLS = ["²", "³", "½", "±", "×", "÷", "°", "π", "√", "∞", "≤", "≥", "≠", "∝"];
const FORMATS: TextFormat[] = ["bold", "italic", "underline"];

/* ── editor ⇄ document model ─────────────────────────────────────────── */

function $loadDoc(doc: AnswerDoc) {
  const root = $getRoot();
  root.clear();
  for (const runs of doc) {
    const p = $createParagraphNode();
    for (const run of runs) {
      if (run.kind === "math") p.append($createEquationNode(run.tex, run.display));
      else {
        const t = $createTextNode(run.text);
        if (run.format) t.toggleFormat(run.format);
        p.append(t);
      }
    }
    root.append(p);
  }
}

function $readDoc(): AnswerDoc {
  const doc: AnswerDoc = [];
  const pushRun = (line: AnswerRun[], run: AnswerRun) => {
    const prev = line[line.length - 1];
    if (run.kind === "text" && prev?.kind === "text" && prev.format === run.format) prev.text += run.text;
    else line.push(run);
  };
  for (const block of $getRoot().getChildren()) {
    let line: AnswerRun[] = [];
    doc.push(line);
    const walk = (nodes: LexicalNode[]) => {
      for (const n of nodes) {
        if ($isEquationNode(n)) pushRun(line, { kind: "math", tex: n.getTex(), display: n.getDisplay() });
        else if ($isLineBreakNode(n)) doc.push((line = []));
        else if ($isTextNode(n))
          pushRun(line, {
            kind: "text",
            text: n.getTextContent(),
            format: pickFormat({
              bold: n.hasFormat("bold"),
              italic: n.hasFormat("italic"),
              underline: n.hasFormat("underline"),
            }),
          });
        else if ($isElementNode(n)) walk(n.getChildren());
        else pushRun(line, { kind: "text", text: n.getTextContent(), format: null });
      }
    };
    if ($isElementNode(block)) walk(block.getChildren());
    else pushRun(line, { kind: "text", text: block.getTextContent(), format: null });
  }
  return doc;
}

/* ── behaviour: formatting, Alt+=, edit-equation ─────────────────────── */

/** The last text the editor and the parent agreed on, so an echo of our own onChange never reloads the editor. */
interface Sync {
  isCurrent: (v: string) => boolean;
  remember: (v: string) => void;
}

interface DialogState {
  /** Set when editing an existing equation. */
  nodeKey: NodeKey | null;
  tex: string;
  display: boolean;
  /** Where to put a NEW equation (the dialog steals focus, so remember the caret). */
  selection: BaseSelection | null;
}

function Behaviors({ openDialog }: { openDialog: (nodeKey: NodeKey | null) => void }) {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    const offFormat = editor.registerCommand(
      FORMAT_TEXT_COMMAND,
      (format) => {
        if (!FORMATS.includes(format as TextFormat)) return false; // let Lexical handle anything else
        const sel = $getSelection();
        if (!$isRangeSelection(sel)) return true;
        const f = format as TextFormat;
        const collapsed = sel.isCollapsed();
        // Read the real text nodes — a selection's own cached format flags can be stale.
        const textNodes = () => sel.getNodes().filter($isTextNode);
        const others = FORMATS.filter((o) => o !== f);

        sel.formatText(f);

        // Bold / italic / underline are mutually exclusive: the saved text format can't nest them,
        // so turning one ON turns the other two OFF.
        if (collapsed) {
          if (sel.hasFormat(f)) for (const o of others) if (sel.hasFormat(o)) sel.toggleFormat(o);
        } else {
          const nodes = textNodes();
          if (nodes.length > 0 && nodes.every((n) => n.hasFormat(f))) {
            for (const n of nodes) for (const o of others) if (n.hasFormat(o)) n.toggleFormat(o);
          }
        }
        return true;
      },
      COMMAND_PRIORITY_HIGH,
    );

    const offKey = editor.registerCommand(
      KEY_DOWN_COMMAND,
      (e: KeyboardEvent) => {
        // Alt+= is Word's "insert equation" shortcut.
        if (e.altKey && (e.key === "=" || e.key === "+")) {
          e.preventDefault();
          openDialog(null);
          return true;
        }
        return false;
      },
      COMMAND_PRIORITY_LOW,
    );

    const offEnter = editor.registerCommand(
      KEY_ENTER_COMMAND,
      (e: KeyboardEvent | null) => {
        const sel = $getSelection();
        if ($isNodeSelection(sel)) {
          const node = sel.getNodes()[0];
          if ($isEquationNode(node)) {
            e?.preventDefault();
            openDialog(node.getKey());
            return true;
          }
        }
        return false;
      },
      COMMAND_PRIORITY_HIGH,
    );

    const offEdit = editor.registerCommand(
      EDIT_EQUATION_COMMAND,
      (key) => {
        openDialog(key);
        return true;
      },
      COMMAND_PRIORITY_LOW,
    );

    return () => {
      offFormat();
      offKey();
      offEnter();
      offEdit();
    };
  }, [editor, openDialog]);

  return null;
}

/** Keeps the editor in step if the parent changes the text from outside (e.g. a different part is loaded). */
function SyncValue({ value, sync }: { value: string; sync: Sync }) {
  const [editor] = useLexicalComposerContext();
  useEffect(() => {
    if (sync.isCurrent(value)) return; // it's what the editor itself just reported — nothing to do
    sync.remember(value);
    editor.update(() => $loadDoc(parseAnswer(value)), { tag: "history-merge" });
  }, [editor, value, sync]);
  return null;
}

/* ── toolbar ─────────────────────────────────────────────────────────── */

const btn =
  "rounded p-1.5 transition-colors hover:bg-gray-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-green-700";

function Toolbar({ onEquation }: { onEquation: () => void }) {
  const [editor] = useLexicalComposerContext();
  const [active, setActive] = useState<Record<TextFormat, boolean>>({ bold: false, italic: false, underline: false });

  useEffect(() => {
    const read = () => {
      const sel = $getSelection();
      setActive(
        $isRangeSelection(sel)
          ? { bold: sel.hasFormat("bold"), italic: sel.hasFormat("italic"), underline: sel.hasFormat("underline") }
          : { bold: false, italic: false, underline: false },
      );
    };
    const offUpdate = editor.registerUpdateListener(({ editorState }) => editorState.read(read));
    const offSel = editor.registerCommand(
      SELECTION_CHANGE_COMMAND,
      () => {
        read();
        return false;
      },
      COMMAND_PRIORITY_LOW,
    );
    return () => {
      offUpdate();
      offSel();
    };
  }, [editor]);

  const insertSymbol = (sym: string) => {
    editor.update(() => {
      const sel = $getSelection();
      if ($isRangeSelection(sel)) sel.insertText(sym);
      else $getRoot().selectEnd().insertText(sym);
    });
    editor.focus();
  };

  // mouseDown is cancelled on every button so clicking the toolbar never steals the caret / selection.
  const keep = (e: React.MouseEvent) => e.preventDefault();
  const fmt = (format: TextFormat) => {
    editor.dispatchCommand(FORMAT_TEXT_COMMAND, format); // act on the selection as it is…
    editor.focus(); // …then hand the caret back to the answer
  };

  return (
    <div className="flex flex-wrap gap-0.5 rounded-t-xl border-b bg-gray-50 p-2" role="toolbar" aria-label="Answer formatting">
      <button
        type="button"
        onMouseDown={keep}
        onClick={onEquation}
        title="Insert equation (Alt+=)"
        aria-label="Insert equation"
        className="flex items-center gap-1 rounded bg-green-800 px-2 py-1 text-xs font-semibold text-white hover:bg-green-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-green-700">
        <Sigma size={13} aria-hidden="true" /> Equation
      </button>
      <div className="mx-1 h-5 w-px self-center bg-gray-300" />
      {(
        [
          ["bold", "Bold", Bold],
          ["italic", "Italic", Italic],
          ["underline", "Underline", Underline],
        ] as const
      ).map(([f, label, Icon]) => (
        <button
          key={f}
          type="button"
          aria-label={label}
          aria-pressed={active[f]}
          title={label}
          onMouseDown={keep}
          onClick={() => fmt(f)}
          className={`${btn} ${active[f] ? "bg-green-100 text-green-900" : ""}`}>
          <Icon size={13} />
        </button>
      ))}
      <div className="mx-1 h-5 w-px self-center bg-gray-300" />
      {SYMBOLS.map((sym) => (
        <button
          type="button"
          key={sym}
          aria-label={`Insert ${sym}`}
          title={`Insert ${sym}`}
          onMouseDown={keep}
          onClick={() => insertSymbol(sym)}
          className="rounded px-1.5 py-1 font-mono text-xs text-gray-700 transition-colors hover:bg-gray-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-green-700">
          {sym}
        </button>
      ))}
    </div>
  );
}

/* ── the component ───────────────────────────────────────────────────── */

export interface MathAnswerEditorProps {
  /** The stored answer text (see lib/content/answerDoc.ts for the format). */
  value: string;
  onChange: (value: string) => void;
  /** Accessible name, e.g. "Your answer for 1a". */
  label: string;
  placeholder?: string;
  describedBy?: string;
  minHeight?: number;
}

function Inner({ value, onChange, label, placeholder, describedBy, minHeight, sync }: MathAnswerEditorProps & { sync: Sync }) {
  const [editor] = useLexicalComposerContext();
  const [dialog, setDialog] = useState<DialogState | null>(null);

  const openDialog = useCallback(
    (nodeKey: NodeKey | null) => {
      editor.getEditorState().read(() => {
        // Editing: the given equation, or the one currently selected as an object.
        let key = nodeKey;
        if (!key) {
          const sel = $getSelection();
          if ($isNodeSelection(sel)) {
            const n = sel.getNodes()[0];
            if ($isEquationNode(n)) key = n.getKey();
          }
        }
        const node = key ? $getNodeByKey(key) : null;
        if ($isEquationNode(node)) {
          setDialog({ nodeKey: node.getKey(), tex: node.getTex(), display: node.getDisplay(), selection: null });
        } else {
          const sel = $getSelection();
          setDialog({ nodeKey: null, tex: "", display: false, selection: sel ? sel.clone() : null });
        }
      });
    },
    [editor],
  );

  const closeDialog = () => {
    setDialog(null);
    requestAnimationFrame(() => editor.focus());
  };

  const commit = (tex: string, display: boolean) => {
    const d = dialog;
    if (!d) return;
    editor.update(() => {
      const existing = d.nodeKey ? $getNodeByKey(d.nodeKey) : null;
      if ($isEquationNode(existing)) {
        existing.setEquation(tex, display);
        return;
      }
      if (d.selection) $setSelection(d.selection.clone());
      else $getRoot().selectEnd();
      $insertNodes([$createEquationNode(tex, display)]);
    });
    closeDialog();
  };

  const handleChange = useCallback(
    (state: import("lexical").EditorState) => {
      state.read(() => {
        const next = serializeAnswer($readDoc());
        if (sync.isCurrent(next)) return;
        sync.remember(next);
        onChange(next);
      });
    },
    [sync, onChange],
  );

  return (
    <>
      <Toolbar onEquation={() => openDialog(null)} />
      <div className="relative bg-white">
        <RichTextPlugin
          contentEditable={
            <ContentEditable
              aria-label={label}
              aria-describedby={describedBy}
              aria-multiline="true"
              spellCheck
              className="w-full px-4 py-3 text-sm leading-7 text-gray-900 focus:outline-none [&_.gt-equation-display]:my-1 [&_.gt-equation-display]:block"
              style={{ minHeight }}
            />
          }
          placeholder={
            <div className="pointer-events-none absolute left-4 top-3 select-none text-sm leading-7 text-gray-400">
              {placeholder}
            </div>
          }
          ErrorBoundary={LexicalErrorBoundary}
        />
        <HistoryPlugin />
        <OnChangePlugin onChange={handleChange} ignoreSelectionChange />
        <SyncValue value={value} sync={sync} />
        <Behaviors openDialog={openDialog} />
      </div>
      {dialog && (
        <EquationDialog
          editing={dialog.nodeKey !== null}
          initialTex={dialog.tex}
          initialDisplay={dialog.display}
          onInsert={commit}
          onClose={closeDialog}
        />
      )}
    </>
  );
}

/**
 * The typed-answer box: a WYSIWYG editor (like Word) where equations are typeset right inside the text.
 * Click Equation (or Alt+=) to build one with the equation dialog; click an equation later to edit it.
 *
 * It saves the SAME plain text the old box did (**bold**, *italic*, __underline__, \( … \), \[ … \]), so
 * submitting, AI marking and the results page work exactly as before.
 */
export default function MathAnswerEditor(props: MathAnswerEditorProps) {
  const { value, minHeight = 260 } = props;
  const lastEmitted = useRef(value);
  const [sync] = useState<Sync>(() => ({
    isCurrent: (v) => v === lastEmitted.current,
    remember: (v) => {
      lastEmitted.current = v;
    },
  }));

  // Lazy state initialiser: built once, from the first value only (later changes go through <SyncValue>).
  const [initialConfig] = useState(() => ({
    namespace: "GravitestAnswer",
    nodes: [EquationNode],
    theme: {
      paragraph: "mb-1.5 last:mb-0",
      text: { bold: "font-bold", italic: "italic", underline: "underline" },
    },
    onError: (error: Error) => {
      // A malformed state must never take the exam page down — log it and carry on.
      console.error("Answer editor error:", error);
    },
    editorState: () => $loadDoc(parseAnswer(value)),
  }));

  return (
    <LexicalComposer initialConfig={initialConfig}>
      <div
        className="rounded-xl border transition-all focus-within:border-green-700 focus-within:ring-2 focus-within:ring-green-800/30"
        style={{ borderColor: "rgba(30,80,50,0.2)" }}>
        <Inner {...props} minHeight={minHeight} sync={sync} />
      </div>
    </LexicalComposer>
  );
}
