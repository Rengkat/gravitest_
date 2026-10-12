import { EssayPart } from '../types/essay-part.interface';

export interface EssayLeaf {
  /** Dot-joined labels from the root, e.g. "1.(a).(i)". Stable key for a leaf. */
  path: string;
  label: string;
  text: string;
  maxScore: number;
  /** Ancestor headings' labels + text, so a leaf like (b)(i) is scored with its parent's stem. */
  context: string;
}

/**
 * Flattens a nested EssayPart tree into its answerable leaves. Only nodes
 * with no children are answerable — nodes that have children are section
 * headings (e.g. "(a) Radioactivity and Nuclear Reactions") and get no
 * answer box or score of their own.
 */
export function flattenEssayParts(
  parts: EssayPart[] | null | undefined,
  parentPath = '',
  parentContext = '',
): EssayLeaf[] {
  if (!parts?.length) return [];
  const leaves: EssayLeaf[] = [];
  for (const part of parts) {
    const path = parentPath ? `${parentPath}.${part.label}` : part.label;
    if (part.children?.length) {
      const ctx = [parentContext, `${part.label} ${part.text ?? ''}`.trim()]
        .filter(Boolean)
        .join('\n');
      leaves.push(...flattenEssayParts(part.children, path, ctx));
    } else {
      leaves.push({
        path,
        label: part.label,
        text: part.text ?? '',
        maxScore: Math.max(0, Math.round(Number(part.maxScore ?? 0))),
        context: parentContext,
      });
    }
  }
  return leaves;
}
