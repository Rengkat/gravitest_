import {
  FeatureAccessMode,
  FeatureKey,
  QuotaPeriod,
  SubscriptionTier,
} from 'src/common/enums/enums';

/**
 * The gate-able features, with the DEFAULT rule each is seeded with.
 *
 * Defaults reproduce the app's behaviour from before rules were configurable
 * (AI Tutor/Explain blocked for FREE, everything else open), so deploying this
 * changes nothing until an admin edits a rule. After seeding, the database is
 * the source of truth — editing a default here does NOT alter existing rules.
 *
 * Adding a feature = add a FeatureKey, an entry here, and one
 * `entitlements.assertAccess(userId, FeatureKey.X)` at the spot in code that
 * performs it. (Which features exist is code; who may use them is data.)
 */
export interface FeatureDefinition {
  key: FeatureKey;
  label: string;
  description: string;
  /** How the rule is enforced, shown to admins so expectations match reality. */
  enforcement: string;
  /** Modes that have an effect for this feature. */
  supportedModes: FeatureAccessMode[];
  default: {
    mode: FeatureAccessMode;
    minTier: SubscriptionTier | null;
    freeQuota: number | null;
    quotaPeriod: QuotaPeriod | null;
  };
}

const ALL_MODES = [
  FeatureAccessMode.FREE,
  FeatureAccessMode.PAID,
  FeatureAccessMode.DISABLED,
];

export const FEATURE_CATALOG: FeatureDefinition[] = [
  {
    key: FeatureKey.CBT_PRACTICE,
    label: 'Past-question practice',
    description: 'Starting a practice-mode CBT session on past questions.',
    enforcement: 'Checked (and a free-quota use counted) each time a practice session starts.',
    supportedModes: ALL_MODES,
    default: { mode: FeatureAccessMode.FREE, minTier: null, freeQuota: null, quotaPeriod: null },
  },
  {
    key: FeatureKey.CBT_MOCK,
    label: 'Timed mock exams',
    description: 'Starting a timed mock-exam CBT session.',
    enforcement: 'Checked (and a free-quota use counted) each time a mock session starts.',
    supportedModes: ALL_MODES,
    default: { mode: FeatureAccessMode.FREE, minTier: null, freeQuota: null, quotaPeriod: null },
  },
  {
    key: FeatureKey.AI_TUTOR,
    label: 'AI Tutor (Sabi Tutor chat)',
    description: 'Chatting with the AI tutor.',
    enforcement:
      'Checked on every tutor message. Per-tier request/token caps are separate: Admin → AI → Rate limits.',
    supportedModes: ALL_MODES,
    default: { mode: FeatureAccessMode.PAID, minTier: SubscriptionTier.BASIC, freeQuota: null, quotaPeriod: null },
  },
  {
    key: FeatureKey.AI_EXPLAIN,
    label: 'AI Explain (after scoring)',
    description:
      'Asking Sabi AI to explain a question — and why an answer was right or wrong — from the results/review screen.',
    enforcement:
      'Checked on every explain request, including ones answered from the shared explanation cache (a cached answer is never a free pass). Per-tier request/token caps are separate: Admin → AI → Rate limits.',
    supportedModes: ALL_MODES,
    default: { mode: FeatureAccessMode.PAID, minTier: SubscriptionTier.BASIC, freeQuota: null, quotaPeriod: null },
  },
  {
    key: FeatureKey.AI_EXPLAIN_MORE,
    label: 'AI Explain: "Explain more"',
    description:
      'The deeper, step-by-step follow-up explanation a student can request after the first one. Controlled separately, so you can e.g. make the first explanation free and the deeper one paid.',
    enforcement:
      'Checked on every "Explain more" request. Independent of the "AI Explain" rule above — each has its own free/paid setting and its own free allowance.',
    supportedModes: ALL_MODES,
    default: { mode: FeatureAccessMode.PAID, minTier: SubscriptionTier.BASIC, freeQuota: null, quotaPeriod: null },
  },
  {
    key: FeatureKey.AI_ESSAY_SCORING,
    label: 'AI essay scoring',
    description: 'AI grading of theory/essay answers.',
    enforcement:
      'Checked on every AI scoring call (one per essay, or per sub-part of structured questions). If blocked mid-exam, the answer is left for manual review, so submissions never fail.',
    supportedModes: ALL_MODES,
    default: { mode: FeatureAccessMode.FREE, minTier: null, freeQuota: null, quotaPeriod: null },
  },
  {
    key: FeatureKey.AI_ESSAY_ELABORATE,
    label: 'AI essay: detailed breakdown',
    description:
      'The deeper, quote-by-quote explanation of an essay score (with a suggested rewrite) that a student can ask for after an essay has been scored, or when reviewing their answer.',
    enforcement:
      'Checked when the breakdown is first generated. A breakdown the student already has is shown again without counting another use. Independent of "AI essay scoring".',
    supportedModes: ALL_MODES,
    default: { mode: FeatureAccessMode.FREE, minTier: null, freeQuota: null, quotaPeriod: null },
  },
  {
    key: FeatureKey.LIBRARY_PREMIUM,
    label: 'Library: subscription-locked content',
    description:
      'Library items that are unlocked by a subscription tier (each item still sets its own required tier). Items sold individually for a price are separate: they are bought one by one, whatever plan the student is on.',
    enforcement:
      'Only "Free" has an effect here: it opens ALL tier-locked library items to everyone (promo). Otherwise each item’s own required tier applies. Items sold individually by price are never affected.',
    supportedModes: [FeatureAccessMode.FREE, FeatureAccessMode.PAID],
    default: { mode: FeatureAccessMode.PAID, minTier: SubscriptionTier.BASIC, freeQuota: null, quotaPeriod: null },
  },
];

export const FEATURE_BY_KEY = new Map(FEATURE_CATALOG.map((f) => [f.key, f]));
