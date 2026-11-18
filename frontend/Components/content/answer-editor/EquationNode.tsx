"use client";

import type { ReactNode } from "react";
import {
  $applyNodeReplacement,
  createCommand,
  DecoratorNode,
  type LexicalNode,
  type NodeKey,
  type SerializedLexicalNode,
  type Spread,
} from "lexical";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { useLexicalNodeSelection } from "@lexical/react/useLexicalNodeSelection";
import MathSpan from "../MathSpan";

/** Fired by an equation in the text (click / Enter) to ask the editor to open the equation dialog on it. */
export const EDIT_EQUATION_COMMAND = createCommand<NodeKey>("EDIT_EQUATION_COMMAND");

export type SerializedEquationNode = Spread<{ tex: string; display: boolean }, SerializedLexicalNode>;

/**
 * An equation sitting inside the student's text, drawn as real typeset maths. The editor stores it as
 * \( … \) (inline) or \[ … \] (display) — see lib/content/answerDoc.ts.
 */
export class EquationNode extends DecoratorNode<ReactNode> {
  __tex: string;
  __display: boolean;

  static getType(): string {
    return "equation";
  }

  static clone(node: EquationNode): EquationNode {
    return new EquationNode(node.__tex, node.__display, node.__key);
  }

  static importJSON(json: SerializedEquationNode): EquationNode {
    return $createEquationNode(json.tex, json.display);
  }

  constructor(tex: string, display = false, key?: NodeKey) {
    super(key);
    this.__tex = tex;
    this.__display = display;
  }

  exportJSON(): SerializedEquationNode {
    return { ...super.exportJSON(), type: "equation", version: 1, tex: this.__tex, display: this.__display };
  }

  createDOM(): HTMLElement {
    const el = document.createElement("span");
    el.className = this.__display ? "gt-equation gt-equation-display" : "gt-equation";
    return el;
  }

  updateDOM(prev: EquationNode): boolean {
    return prev.__display !== this.__display;
  }

  getTex(): string {
    return this.getLatest().__tex;
  }

  getDisplay(): boolean {
    return this.getLatest().__display;
  }

  setEquation(tex: string, display: boolean): this {
    const self = this.getWritable();
    self.__tex = tex;
    self.__display = display;
    return self;
  }

  getTextContent(): string {
    const { __tex: tex, __display: display } = this.getLatest();
    return display ? `\\[${tex}\\]` : `\\(${tex}\\)`;
  }

  isInline(): boolean {
    return true;
  }

  isKeyboardSelectable(): boolean {
    return true;
  }

  decorate(): ReactNode {
    return <EquationChip nodeKey={this.__key} tex={this.__tex} display={this.__display} />;
  }
}

export function $createEquationNode(tex: string, display = false): EquationNode {
  return $applyNodeReplacement(new EquationNode(tex, display));
}

export function $isEquationNode(node: LexicalNode | null | undefined): node is EquationNode {
  return node instanceof EquationNode;
}

function EquationChip({ nodeKey, tex, display }: { nodeKey: NodeKey; tex: string; display: boolean }) {
  const [editor] = useLexicalComposerContext();
  const [selected, setSelected, clearSelection] = useLexicalNodeSelection(nodeKey);

  const open = () => {
    clearSelection();
    setSelected(true);
    editor.dispatchCommand(EDIT_EQUATION_COMMAND, nodeKey);
  };

  return (
    <span
      role="button"
      tabIndex={-1}
      contentEditable={false}
      data-testid="answer-equation"
      aria-label={`Equation ${tex}. Press Enter or click to edit.`}
      title="Click to edit this equation"
      onClick={open}
      className={`cursor-pointer rounded px-0.5 align-middle text-[1.15em] transition-colors hover:bg-green-100/70 ${
        display ? "block text-center" : "inline-block"
      } ${selected ? "bg-green-100 ring-2 ring-green-700" : ""}`}>
      <MathSpan tex={tex} display={display} className="!my-0" />
    </span>
  );
}
