/**
 * Basic, deterministic checks on a contribution's text before it is stored.
 * This is a first line of defence (obvious abuse and link-spam); reporting
 * and admin moderation handle everything a rule can't.
 */

export const MAX_CONTENT_LENGTH = 2000;
export const MAX_LINKS = 2;

// Deliberately short and obvious. Extend via ops/config if needed; a word
// list can never be complete, which is why reporting + moderation exist.
const BLOCKED_TERMS = [
  'fuck', 'fucking', 'shit', 'bitch', 'bastard', 'asshole', 'dickhead', 'motherfucker',
  'idiot', 'stupid', 'dumbass', 'moron', 'imbecile',
];

const URL_RE = /\b(?:https?:\/\/|www\.)\S+/gi;
// Zero-width and bidi control characters used to hide text or evade filters.
// eslint-disable-next-line no-misleading-character-class
const INVISIBLE_RE = /[\u200B-\u200F\u202A-\u202E\u2060-\u2064\uFEFF]/g;
// eslint-disable-next-line no-control-regex
const CONTROL_RE = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;

export function normalizeContent(raw: string): string {
  return raw
    .replace(INVISIBLE_RE, '')
    .replace(CONTROL_RE, '')
    .replace(/\r\n/g, '\n')
    .replace(/\n{4,}/g, '\n\n\n')
    .trim();
}

export type ContentVerdict = { ok: true } | { ok: false; reason: string };

export function checkContent(text: string): ContentVerdict {
  if (text.length > MAX_CONTENT_LENGTH) {
    return { ok: false, reason: `Contributions can be at most ${MAX_CONTENT_LENGTH} characters.` };
  }
  const links = text.match(URL_RE) ?? [];
  if (links.length > MAX_LINKS) {
    return { ok: false, reason: `Please include at most ${MAX_LINKS} links.` };
  }
  // Same character shouted over and over ("aaaaaaaaaaaa", "!!!!!!!!!!!!").
  if (/(.)\1{14,}/.test(text)) {
    return { ok: false, reason: 'That looks like spam. Please rewrite your contribution.' };
  }
  const lowered = ` ${text.toLowerCase().replace(/[^a-z0-9\s]/g, ' ')} `;
  if (BLOCKED_TERMS.some((w) => lowered.includes(` ${w} `))) {
    return {
      ok: false,
      reason: 'Please keep the discussion respectful — remove abusive language and try again.',
    };
  }
  return { ok: true };
}

/** Normalised text used to detect a repeated submission of the same contribution. */
export function fingerprint(text: string): string {
  return text.toLowerCase().replace(/\s+/g, ' ').trim();
}
