import { checkContent, fingerprint, MAX_CONTENT_LENGTH, normalizeContent } from './content-guard.util';

describe('content guard', () => {
  it('accepts a normal contribution', () => {
    expect(checkContent('Why did you multiply the moles by Avogadro’s number?')).toEqual({ ok: true });
  });
  it('rejects over-long text', () => {
    expect(checkContent('a b '.repeat(MAX_CONTENT_LENGTH)).ok).toBe(false);
  });
  it('allows up to two links but not a link dump', () => {
    expect(checkContent('see https://a.com and https://b.com').ok).toBe(true);
    expect(checkContent('https://a.com https://b.com https://c.com').ok).toBe(false);
  });
  it('rejects obvious abuse but not innocent words that merely contain a blocked substring', () => {
    expect(checkContent('you are an idiot').ok).toBe(false);
    expect(checkContent('Scunthorpe classic shitake mushrooms and the assistant').ok).toBe(true);
  });
  it('rejects keyboard-mash spam', () => {
    expect(checkContent('aaaaaaaaaaaaaaaaaaaa').ok).toBe(false);
  });
  it('strips zero-width / control characters used to evade filters', () => {
    expect(normalizeContent('i\u200Bd\u200Bi\u200Bo\u200Bt')).toBe('idiot');
    expect(checkContent(normalizeContent('i\u200Bd\u200Bi\u200Bo\u200Bt')).ok).toBe(false);
    expect(normalizeContent('  hi\u0007  ')).toBe('hi');
  });
  it('fingerprints ignore case and spacing so a re-posted duplicate is recognised', () => {
    expect(fingerprint('Hello   World ')).toBe(fingerprint('hello world'));
  });
});
