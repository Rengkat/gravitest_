import { clampPages, clampSeconds } from './library-preview.processor';
import { MAX_PREVIEW_FRACTION, PREVIEW_SAFETY_MARGIN_SECONDS } from 'src/library/providers/library-preview.constants';

// These two pure functions are the entire security boundary for the free
// preview feature: everything else (ffmpeg args, upload, caching) just acts
// on whatever number comes out of here. If this clamp is ever wrong, the
// "preview" can end up being most or all of a paid file.
describe('clampSeconds', () => {
  it('uses the requested length when the source has plenty of room', () => {
    expect(clampSeconds(90, 300)).toBe(90);
    expect(clampSeconds(30, 200)).toBe(30);
  });

  it('never returns more than the source duration minus the safety margin', () => {
    // 80s source, 90s requested — the source doesn't have 90s to give.
    expect(clampSeconds(90, 80)).toBeLessThanOrEqual(80 - PREVIEW_SAFETY_MARGIN_SECONDS);
  });

  it('returns null (do not generate) when the source is too short to preview safely', () => {
    expect(clampSeconds(90, 8)).toBeNull();
    expect(clampSeconds(90, 9)).toBeNull();
    expect(clampSeconds(5, 4)).toBeNull();
  });

  it('never previews more than MAX_PREVIEW_FRACTION of the source, for any input', () => {
    // A flat safety margin alone under-protects short content (a 3s margin
    // on a 10s video would still allow an ~70% clip) — this sweep is the
    // regression test for that gap.
    const actuals = [5, 6, 7, 8, 9, 10, 15, 20, 30, 45, 60, 90, 120, 300, 600, 3600];
    const requests = [5, 10, 30, 60, 90, 120, 600, 3600];
    for (const actual of actuals) {
      for (const requested of requests) {
        const got = clampSeconds(requested, actual);
        if (got != null) {
          expect(got).toBeLessThanOrEqual(actual * MAX_PREVIEW_FRACTION + 1e-9);
        }
      }
    }
  });

  it('is monotonic: a longer source never yields a shorter clamped preview for the same request', () => {
    let prev = 0;
    for (const actual of [10, 20, 40, 80, 160, 320, 640]) {
      const got = clampSeconds(90, actual) ?? 0;
      expect(got).toBeGreaterThanOrEqual(prev);
      prev = got;
    }
  });
});

describe('clampPages', () => {
  it('uses the requested count when the document has plenty of pages', () => {
    expect(clampPages(2, 40)).toBe(2);
    expect(clampPages(5, 100)).toBe(5);
  });

  it('always withholds at least one page', () => {
    expect(clampPages(2, 2)).toBe(1);
    expect(clampPages(5, 3)).toBeLessThan(3);
  });

  it('returns null for a document too short to preview safely (1 page or fewer)', () => {
    expect(clampPages(2, 1)).toBeNull();
    expect(clampPages(2, 0)).toBeNull();
  });

  it('never previews more than MAX_PREVIEW_FRACTION of the document, for any input', () => {
    const totals = [1, 2, 3, 4, 5, 6, 8, 10, 20, 50, 100];
    const requests = [1, 2, 3, 5, 10, 50];
    for (const total of totals) {
      for (const requested of requests) {
        const got = clampPages(requested, total);
        if (got != null) {
          expect(got).toBeLessThanOrEqual(Math.floor(total * MAX_PREVIEW_FRACTION) || 1);
        }
      }
    }
  });
});
