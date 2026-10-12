// Platform defaults for the auto-generated free preview, used whenever an
// admin hasn't set LibraryContent.previewSeconds/previewPages for a specific
// item. Deliberately kept in sync with the client's PREVIEW constant
// (app/(student)/dashboard/library/[id]/config.ts) so the number the
// paywall UI advertises ("90s free preview") matches what the server
// actually generates — but the server's copy here is the one that's
// authoritative; the client's is just a label.
export const PREVIEW_DEFAULTS = {
  VIDEO_SECONDS: 90,
  AUDIO_SECONDS: 60,
  DOC_PAGES: 2,
  EBOOK_PAGES: 5,
} as const;

// Below this, a clip/excerpt isn't worth serving — either there's nothing
// meaningful left to entice with, or (more importantly) clamping against
// the real file left so little margin that the "preview" would be near
// enough the whole thing. Content shorter/shallower than this has no
// preview generated; the paywall falls back to metadata only.
export const MIN_PREVIEW_SECONDS = 5;
export const MIN_PREVIEW_PAGES = 1;

// A one-second/one-page margin is trivial to brute-force past (open the
// preview, note where it cuts off, ask for one more unit). This is UX
// framing more than a security control — real enforcement is the size of
// the file itself, capped in generation — but leaving a slightly bigger,
// less exact-feeling gap discourages "just barely bypass it" attempts.
export const PREVIEW_SAFETY_MARGIN_SECONDS = 3;
export const PREVIEW_SAFETY_MARGIN_PAGES = 1;

// A flat margin alone isn't enough for short content — a 3-second margin on
// a 10-second video still hands over 70% of it. This caps a preview at a
// fraction of the source regardless of length, so short content withholds
// proportionally more. The absolute margin above stays the binding
// constraint for anything longer (a 10-minute video's preview is still
// capped at ~90s by the requested/default length, long before 50% would
// matter).
export const MAX_PREVIEW_FRACTION = 0.5;
