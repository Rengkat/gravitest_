import { assignPartIds } from './assign-part-ids.util';
import { flattenEssayParts } from './flatten-essay-parts.util';
import { EssayPart } from '../types/essay-part.interface';

const tree = (): EssayPart[] => [
  { label: '1', text: 'Stem', children: [{ label: '(a)', text: 'A', maxScore: 2 }, { label: '(b)', text: 'B', maxScore: 3 }] },
  { label: '2', text: 'Standalone', maxScore: 5 },
];
const idsOf = (p: EssayPart[]) => flattenEssayParts(p).map((l) => l.id);

describe('assignPartIds', () => {
  it('gives every node a unique id, including headings', () => {
    const out = assignPartIds(tree())!;
    const all: string[] = [];
    const walk = (ps: EssayPart[]) => ps.forEach((p) => { all.push(p.id!); if (p.children) walk(p.children); });
    walk(out);
    expect(all).toHaveLength(4);
    expect(all.every(Boolean)).toBe(true);
    expect(new Set(all).size).toBe(4);
  });

  it('keeps ids the node already has', () => {
    const first = assignPartIds(tree())!;
    expect(idsOf(assignPartIds(first)!)).toEqual(idsOf(first));
  });

  it('preserves ids across an edit that does not round-trip them (matched by label path)', () => {
    const first = assignPartIds(tree())!;
    const edited = tree();
    edited[0].children![0].text = 'Reworded A'; // admin form re-sent the structure with no ids
    const second = assignPartIds(edited, first)!;
    expect(idsOf(second)).toEqual(idsOf(first));
    expect(flattenEssayParts(second)[0].text).toBe('Reworded A');
  });

  it('gives a newly added part a NEW id and leaves the others untouched', () => {
    const first = assignPartIds(tree())!;
    const edited = tree();
    edited[0].children!.push({ label: '(c)', text: 'C', maxScore: 1 });
    const second = assignPartIds(edited, first)!;
    const before = idsOf(first);
    const after = idsOf(second);
    expect(after.slice(0, 2)).toEqual(before.slice(0, 2));
    expect(before).not.toContain(after[2]);
  });

  it('never reuses a removed part’s id for a different part (a thread can never move to another question part)', () => {
    const first = assignPartIds(tree())!;
    const removedId = idsOf(first)[1]; // (b)
    const edited: EssayPart[] = [{ label: '1', text: 'Stem', children: [{ label: '(a)', text: 'A', maxScore: 2 }, { label: '(z)', text: 'New', maxScore: 3 }] }];
    expect(idsOf(assignPartIds(edited, first)!)).not.toContain(removedId);
  });

  it('does not let a duplicated id (copy-pasted node) share a thread', () => {
    const dup: EssayPart[] = [{ label: '1', id: 'same', text: 'x', maxScore: 1 }, { label: '2', id: 'same', text: 'y', maxScore: 1 }];
    const ids = idsOf(assignPartIds(dup)!);
    expect(new Set(ids).size).toBe(2);
  });

  it('is renumber-safe only for what it can know: a renamed label is a new part, not a mix-up', () => {
    const first = assignPartIds(tree())!;
    const edited = tree();
    edited[0].children![0].label = '(i)';
    const second = idsOf(assignPartIds(edited, first)!);
    expect(second[0]).not.toBe(idsOf(first)[0]);
    expect(second[1]).toBe(idsOf(first)[1]);
  });

  it('handles null / empty', () => {
    expect(assignPartIds(null)).toBeNull();
    expect(assignPartIds([])).toEqual([]);
  });
});
