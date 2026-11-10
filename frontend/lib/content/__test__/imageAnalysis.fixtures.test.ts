import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { PNG } from 'pngjs';
import { analyzePixels, chooseBackdrop, detectGraph } from '../imageAnalysis';

/**
 * REAL rendered images (not hand-built pixel grids), shrunk to the size the browser analyses them at.
 * graph_* / chart_*  : axes with ticks, labels or gridlines → must be treated as graphs (more height).
 * diagram_*          : geometry, pie charts, number lines, tables, framed pictures → must stay compact.
 * sketch_*           : bare axes with no ticks — either answer is acceptable, it just must not crash.
 */
const DIR = join(__dirname, 'fixtures');
const files = readdirSync(DIR).filter((f) => f.endsWith('.png')).sort();

const load = (f: string) => {
  const png = PNG.sync.read(readFileSync(join(DIR, f)));
  return { data: png.data, width: png.width, height: png.height };
};

describe('detectGraph on real images', () => {
  it('has fixtures for each kind', () => {
    expect(files.filter((f) => /^(graph|chart)_/.test(f)).length).toBeGreaterThanOrEqual(6);
    expect(files.filter((f) => f.startsWith('diagram_')).length).toBeGreaterThanOrEqual(8);
  });

  it.each(files.filter((f) => /^(graph|chart)_/.test(f)))('%s is a graph', (f) => {
    const { data, width, height } = load(f);
    expect(detectGraph(data, width, height)).toBe(true);
  });

  it.each(files.filter((f) => f.startsWith('diagram_')))('%s stays a compact diagram', (f) => {
    const { data, width, height } = load(f);
    expect(detectGraph(data, width, height)).toBe(false);
  });

  it.each(files.filter((f) => f.startsWith('sketch_')))('%s is classified without error', (f) => {
    const { data, width, height } = load(f);
    expect(typeof detectGraph(data, width, height)).toBe('boolean');
  });

  it('every white-paper image keeps the white paper backdrop', () => {
    for (const f of files) {
      const { data } = load(f);
      expect(chooseBackdrop(analyzePixels(data))).toBe('paper');
    }
  });
});
