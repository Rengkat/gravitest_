import { randomUUID } from 'crypto';
import { EssayPart } from '../types/essay-part.interface';

/**
 * Gives every node of an essay structure a permanent `id`.
 *
 * Discussions (and anything else that must outlive an edit) attach to a
 * sub-question by this id — never to its position or to its display label
 * like "(a)", which an admin can legitimately fix or renumber.
 *
 *  - A node that already carries an id keeps it.
 *  - Otherwise, if the previous version of the question had a node at the
 *    same label-path, it inherits THAT node's id. This is what keeps threads
 *    attached when an admin edits a question through a form that doesn't
 *    round-trip ids.
 *  - Otherwise it is a genuinely new part and gets a fresh id.
 *
 * An id is never given to two nodes of the same structure, so a copy-pasted
 * node can't end up sharing a thread with its original.
 */
export function assignPartIds(
  next: EssayPart[] | null | undefined,
  prev?: EssayPart[] | null,
): EssayPart[] | null {
  if (!next) return null;

  const prevByPath = new Map<string, string>();
  const collect = (parts: EssayPart[], parent = '') => {
    for (const p of parts) {
      const path = parent ? `${parent}.${p.label}` : p.label;
      if (p.id) prevByPath.set(path, p.id);
      if (p.children?.length) collect(p.children, path);
    }
  };
  if (prev?.length) collect(prev);

  const used = new Set<string>();
  const walk = (parts: EssayPart[], parent = ''): EssayPart[] =>
    parts.map((p) => {
      const path = parent ? `${parent}.${p.label}` : p.label;
      let id = p.id && !used.has(p.id) ? p.id : undefined;
      if (!id) {
        const inherited = prevByPath.get(path);
        id = inherited && !used.has(inherited) ? inherited : undefined;
      }
      if (!id) id = randomUUID();
      used.add(id);
      return {
        ...p,
        id,
        ...(p.children?.length ? { children: walk(p.children, path) } : {}),
      };
    });

  return walk(next);
}
