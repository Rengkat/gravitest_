import { describe, expect, it } from 'vitest';
import { plainText, splitMath, upgradeLegacyMath } from '../math';

describe('splitMath (explicit delimiters)', () => {
  it('splits text, inline and display maths', () => {
    expect(splitMath('So \\(x=2\\) and $$y^2$$ done')).toEqual([
      { kind: 'text', value: 'So ' },
      { kind: 'math', value: 'x=2', display: false },
      { kind: 'text', value: ' and ' },
      { kind: 'math', value: 'y^2', display: true },
      { kind: 'text', value: ' done' },
    ]);
  });

  it('supports \\[ \\] blocks spanning several lines (multi-line equations)', () => {
    const [seg] = splitMath('\\[\\begin{aligned}x+y&=3\\\\x-y&=1\\end{aligned}\\]');
    expect(seg).toMatchObject({ kind: 'math', display: true });
    expect(seg.value).toContain('\\begin{aligned}');
    expect(seg.value).toContain('\\\\');
  });

  it('supports $…$ inline maths', () => {
    expect(splitMath('Let $a^2+b^2=c^2$.')[1]).toEqual({ kind: 'math', value: 'a^2+b^2=c^2', display: false });
  });

  it('does not mistake prices for maths', () => {
    expect(splitMath('It costs $5 and then $10 more.')).toEqual([{ kind: 'text', value: 'It costs $5 and then $10 more.' }]);
    expect(splitMath('Pay $5, get $20 back')).toEqual([{ kind: 'text', value: 'Pay $5, get $20 back' }]);
  });

  it('honours an escaped dollar sign', () => {
    expect(plainText('Cost: \\$5 only')).toBe('Cost: $5 only');
  });

  it('never treats an arbitrary backslash as a maths command', () => {
    expect(splitMath('C:\\Users\\ada and a\\b')).toEqual([{ kind: 'text', value: 'C:\\Users\\ada and a\\b' }]);
  });

  it('leaves an unclosed delimiter as text', () => {
    expect(splitMath('The set \\(x > 2')).toEqual([{ kind: 'text', value: 'The set \\(x > 2' }]);
  });

  it('returns plain text unchanged', () => {
    expect(splitMath('Just words.')).toEqual([{ kind: 'text', value: 'Just words.' }]);
  });
});

describe('upgradeLegacyMath — the cases from real questions', () => {
  it('typesets the reported fraction as a real fraction', () => {
    expect(upgradeLegacyMath('The expression (5x + 3)/[6x(x + 1)] will be undefined when x equals')).toBe(
      'The expression \\(\\frac{5x + 3}{6x(x + 1)}\\) will be undefined when x equals',
    );
  });

  it.each([
    ['(a+b)/(c+d)', '\\(\\frac{a+b}{c+d}\\)'],
    ['(x^2 + 1)/(x - 1)', '\\(\\frac{x^{2} + 1}{x - 1}\\)'],
    ['[2x+1]/[x-3]', '\\(\\frac{2x+1}{x-3}\\)'],
    ['(sin x)/(cos x)', '\\(\\frac{\\sin x}{\\cos x}\\)'],
    ['(3)/(4)', '\\(\\frac{3}{4}\\)'],
  ])('fraction %s', (input, expected) => expect(upgradeLegacyMath(input)).toBe(expected));

  it.each([
    ['x^2', '\\(x^{2}\\)'],
    ['(a+b)^2', '\\((a+b)^{2}\\)'],
    ['10^-3', '\\(10^{-3}\\)'],
    ['a^2+b^2=c^2', '\\(a^{2}+b^{2}=c^{2}\\)'],
    ['H_2O', '\\(H_{2}O\\)'],
    ['N_A', '\\(N_{A}\\)'],
    ['2H_2+O_2→2H_2O', '\\(2H_{2}+O_{2}\\rightarrow 2H_{2}O\\)'],
  ])('token %s', (input, expected) => expect(upgradeLegacyMath(input)).toBe(expected));

  it('keeps trailing punctuation outside the maths', () => {
    expect(upgradeLegacyMath('Find x^2, then y_1.')).toBe('Find \\(x^{2}\\), then \\(y_{1}\\).');
  });

  it('handles several expressions in one sentence', () => {
    expect(upgradeLegacyMath('If (a+1)/(b+2) = x^2 then')).toContain('\\(\\frac{a+1}{b+2}\\)');
    expect(upgradeLegacyMath('If (a+1)/(b+2) = x^2 then')).toContain('\\(x^{2}\\)');
  });
});

describe('upgradeLegacyMath — leaves prose and ambiguous text alone', () => {
  it.each([
    'He said and/or.',
    'Score was 3/4 on the test.',
    'The ratio 3:4 and the date 12/05/2024.',
    '(a)/(b) are the two parts.',
    '(the cat)/(the dog)',
    'f(x)/(x+1)',
    'my_file_name and user_id',
    'see https://example.com/a_b/c',
    'Use C:\\path\\file',
    'Plain sentence with no maths at all.',
    'H2O is water and CO2 is a gas.', // no underscores/carets → not converted (too ambiguous)
    'x ^ y', // spaced → not a token
  ])('%s', (s) => expect(upgradeLegacyMath(s)).toBe(s));

  it('does not touch maths that is already delimited', () => {
    const s = 'Given \\(\\frac{a}{b}\\) and $x^2$ and $$(a+b)^2$$ end';
    expect(upgradeLegacyMath(s)).toBe(s);
  });

  it('does not touch code spans or fences', () => {
    expect(upgradeLegacyMath('use `x^2` here')).toBe('use `x^2` here');
    expect(upgradeLegacyMath('```\n(a+1)/(b+2)\n```')).toBe('```\n(a+1)/(b+2)\n```');
  });

  it('is idempotent', () => {
    const once = upgradeLegacyMath('The (5x + 3)/[6x(x + 1)] and x^2 and H_2O');
    expect(upgradeLegacyMath(once)).toBe(once);
  });

  it('keeps ordinary text around upgraded maths exactly as typed', () => {
    const out = upgradeLegacyMath('Solve  x^2   now');
    expect(out).toBe('Solve  \\(x^{2}\\)   now');
  });
});
