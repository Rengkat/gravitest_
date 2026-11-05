import { BadRequestException } from '@nestjs/common';

/**
 * Declarative schema for admin-managed public website content.
 *
 * ONE source of truth: the server validates writes against these specs and
 * also ships them to the admin dashboard (GET /admin/site-content/schema),
 * which renders its editing forms from them. Adding a new editable section
 * or list is therefore a matter of adding a definition here — no new
 * controller, entity or admin screen.
 */

export type FieldType =
  | 'text'
  | 'textarea'
  | 'markdown'
  | 'url'
  | 'image'
  | 'email'
  | 'number'
  | 'boolean'
  | 'select'
  | 'icon'
  | 'color'
  | 'date'
  | 'list';

export interface SelectOption {
  value: string;
  label: string;
}

export interface FieldSpec {
  name: string;
  label: string;
  type: FieldType;
  required?: boolean;
  /** Max characters (text types) or max items (list). */
  max?: number;
  min?: number;
  help?: string;
  placeholder?: string;
  options?: SelectOption[];
  /** For `list`: the fields of each item. A list with no `item` is a list of plain strings. */
  item?: FieldSpec[];
  /** For `list` of strings: label shown for each entry. */
  itemLabel?: string;
}

export interface BlockDefinition {
  key: string;
  title: string;
  description: string;
  /** Where it appears, shown to admins so they know what they're editing. */
  group: string;
  fields: FieldSpec[];
}

export interface CollectionDefinition {
  key: string;
  title: string;
  description: string;
  group: string;
  /** Singular noun for buttons: "Add video". */
  noun: string;
  /** Field whose value is used as the row title in admin lists. */
  titleField: string;
  /** Field shown as secondary text in admin lists. */
  subtitleField?: string;
  fields: FieldSpec[];
}

// ─── Reusable fragments ──────────────────────────────────────────────────────

const LINK_ITEM: FieldSpec[] = [
  { name: 'label', label: 'Label', type: 'text', required: true, max: 80 },
  { name: 'href', label: 'Link', type: 'url', required: true, max: 500 },
];

const ICON_TITLE_DESC: FieldSpec[] = [
  { name: 'icon', label: 'Icon', type: 'icon' },
  { name: 'title', label: 'Title', type: 'text', required: true, max: 120 },
  { name: 'description', label: 'Description', type: 'textarea', required: true, max: 600 },
];

const VALUE_LABEL_ICON: FieldSpec[] = [
  { name: 'icon', label: 'Icon', type: 'icon' },
  { name: 'value', label: 'Value', type: 'text', required: true, max: 40 },
  { name: 'label', label: 'Label', type: 'text', required: true, max: 80 },
];

const SECTION_HEAD: FieldSpec[] = [
  { name: 'eyebrow', label: 'Small label above title', type: 'text', max: 60 },
  { name: 'title', label: 'Title', type: 'text', max: 160 },
  { name: 'subtitle', label: 'Subtitle', type: 'textarea', max: 500 },
];

// ─── Singleton page blocks ───────────────────────────────────────────────────

export const BLOCK_DEFINITIONS: BlockDefinition[] = [
  // Site-wide
  {
    key: 'site.contact',
    title: 'Contact details',
    group: 'Site-wide',
    description: 'Support and sales contact details used across the public site.',
    fields: [
      { name: 'supportEmail', label: 'Support email', type: 'email', max: 160 },
      { name: 'salesEmail', label: 'Sales email', type: 'email', max: 160 },
      { name: 'phone', label: 'Phone number', type: 'text', max: 40 },
      { name: 'whatsapp', label: 'WhatsApp number', type: 'text', max: 40 },
      { name: 'address', label: 'Office address', type: 'textarea', max: 300 },
      { name: 'supportHours', label: 'Support hours', type: 'text', max: 120 },
    ],
  },
  {
    key: 'site.social',
    title: 'Social media links',
    group: 'Site-wide',
    description: 'Shown in the footer and wherever the site links to your social profiles.',
    fields: [
      {
        name: 'links',
        label: 'Profiles',
        type: 'list',
        max: 12,
        item: [
          {
            name: 'platform',
            label: 'Platform',
            type: 'select',
            required: true,
            options: [
              { value: 'twitter', label: 'X / Twitter' },
              { value: 'linkedin', label: 'LinkedIn' },
              { value: 'instagram', label: 'Instagram' },
              { value: 'youtube', label: 'YouTube' },
              { value: 'facebook', label: 'Facebook' },
              { value: 'tiktok', label: 'TikTok' },
              { value: 'whatsapp', label: 'WhatsApp' },
              { value: 'telegram', label: 'Telegram' },
            ],
          },
          { name: 'url', label: 'Profile URL', type: 'url', required: true, max: 500 },
        ],
      },
    ],
  },
  {
    key: 'site.footer',
    title: 'Footer',
    group: 'Site-wide',
    description: 'Footer tagline, link columns and copyright line.',
    fields: [
      { name: 'tagline', label: 'Tagline', type: 'textarea', max: 300 },
      {
        name: 'columns',
        label: 'Link columns',
        type: 'list',
        max: 6,
        item: [
          { name: 'title', label: 'Column title', type: 'text', required: true, max: 60 },
          { name: 'links', label: 'Links', type: 'list', max: 15, item: LINK_ITEM },
        ],
      },
      { name: 'legalLinks', label: 'Legal links (bottom row)', type: 'list', max: 8, item: LINK_ITEM },
      { name: 'copyright', label: 'Copyright text', type: 'text', max: 200, help: 'The © and current year are added automatically.' },
    ],
  },

  // Home
  {
    key: 'home.hero',
    title: 'Home — hero',
    group: 'Home page',
    description: 'The first section visitors see on the home page.',
    fields: [
      { name: 'badge', label: 'Badge text', type: 'text', max: 120 },
      { name: 'titleLead', label: 'Headline (first part)', type: 'text', required: true, max: 160 },
      { name: 'titleHighlight', label: 'Headline (highlighted part)', type: 'text', max: 160 },
      { name: 'subtitle', label: 'Subtitle', type: 'textarea', max: 500 },
      { name: 'primaryCtaLabel', label: 'Primary button label', type: 'text', max: 60 },
      { name: 'primaryCtaHref', label: 'Primary button link', type: 'url', max: 500 },
      { name: 'secondaryCtaLabel', label: 'Secondary button label', type: 'text', max: 60 },
      { name: 'secondaryCtaHref', label: 'Secondary button link', type: 'url', max: 500 },
      { name: 'trustNote', label: 'Small note under the buttons', type: 'text', max: 200 },
    ],
  },
  {
    key: 'home.stats',
    title: 'Home — stats bar',
    group: 'Home page',
    description: 'The row of headline numbers below the hero.',
    fields: [{ name: 'items', label: 'Stats', type: 'list', max: 8, item: VALUE_LABEL_ICON }],
  },
  {
    key: 'home.features',
    title: 'Home — features',
    group: 'Home page',
    description: 'The "what you get" feature grid.',
    fields: [
      ...SECTION_HEAD,
      { name: 'items', label: 'Features', type: 'list', max: 12, item: [
        ...ICON_TITLE_DESC,
        { name: 'tag', label: 'Small tag under the text', type: 'text', max: 60 },
        { name: 'featured', label: 'Highlight this card (dark green)', type: 'boolean' },
      ] },
    ],
  },
  {
    key: 'home.exam-modules',
    title: 'Home — exam modules',
    group: 'Home page',
    description: 'The exams you support (JAMB, WAEC, ICAN …).',
    fields: [
      ...SECTION_HEAD,
      {
        name: 'items',
        label: 'Exams',
        type: 'list',
        max: 12,
        item: [
          { name: 'badge', label: 'Badge', type: 'text', max: 40, placeholder: 'JAMB / UTME' },
          { name: 'name', label: 'Exam name', type: 'text', required: true, max: 80 },
          { name: 'description', label: 'Description', type: 'textarea', max: 400 },
          { name: 'tags', label: 'Highlights', type: 'list', max: 4, itemLabel: 'Highlight' },
          { name: 'href', label: 'Link', type: 'url', max: 500 },
        ],
      },
    ],
  },
  {
    key: 'home.how-it-works',
    title: 'Home — how it works',
    group: 'Home page',
    description: 'The numbered steps section.',
    fields: [
      ...SECTION_HEAD,
      {
        name: 'items',
        label: 'Steps',
        type: 'list',
        max: 8,
        item: [
          { name: 'title', label: 'Title', type: 'text', required: true, max: 120 },
          { name: 'description', label: 'Description', type: 'textarea', required: true, max: 400 },
        ],
      },
    ],
  },
  {
    key: 'home.ai-tutor',
    title: 'Home — AI tutor',
    group: 'Home page',
    description: 'The AI tutor showcase section.',
    fields: [
      ...SECTION_HEAD,
      { name: 'items', label: 'AI features', type: 'list', max: 8, item: ICON_TITLE_DESC },
    ],
  },
  {
    key: 'home.cta',
    title: 'Home — closing call to action',
    group: 'Home page',
    description: 'The banner at the bottom of the home page.',
    fields: [
      { name: 'title', label: 'Title', type: 'text', required: true, max: 160 },
      { name: 'titleHighlight', label: 'Title (highlighted last line)', type: 'text', max: 160 },
      { name: 'subtitle', label: 'Subtitle', type: 'textarea', max: 400 },
      { name: 'buttonLabel', label: 'Button label', type: 'text', max: 60 },
      { name: 'buttonHref', label: 'Button link', type: 'url', max: 500 },
      { name: 'secondaryButtonLabel', label: 'Second button label', type: 'text', max: 60 },
      { name: 'secondaryButtonHref', label: 'Second button link', type: 'url', max: 500 },
    ],
  },
  {
    key: 'home.testimonials',
    title: 'Home — student stories heading',
    group: 'Home page',
    description: 'Heading above the testimonials. The testimonials themselves are listed below.',
    fields: [...SECTION_HEAD],
  },

  // Community
  {
    key: 'community.page',
    title: 'Community page',
    group: 'Community',
    description: 'Headline copy, stats and benefits on the community page. Invite links live under “Community links”.',
    fields: [
      { name: 'heroTitleLead', label: 'Headline (first part)', type: 'text', max: 160 },
      { name: 'heroTitleHighlight', label: 'Headline (highlighted part)', type: 'text', max: 160 },
      { name: 'heroSubtitle', label: 'Subtitle', type: 'textarea', max: 500 },
      { name: 'stats', label: 'Stats', type: 'list', max: 6, item: VALUE_LABEL_ICON },
      { name: 'benefitsTitle', label: 'Benefits section title', type: 'text', max: 160 },
      { name: 'benefitsSubtitle', label: 'Benefits section subtitle', type: 'textarea', max: 300 },
      { name: 'benefits', label: 'Benefits', type: 'list', max: 12, item: ICON_TITLE_DESC },
      { name: 'rulesTitle', label: 'Guidelines section title', type: 'text', max: 160 },
      { name: 'rulesSubtitle', label: 'Guidelines section subtitle', type: 'textarea', max: 300 },
      { name: 'rules', label: 'Community guidelines', type: 'list', max: 15, itemLabel: 'guideline' },
      { name: 'ctaTitle', label: 'Closing banner title', type: 'text', max: 160 },
      { name: 'ctaTitleHighlight', label: 'Closing banner highlighted line', type: 'text', max: 160 },
      { name: 'ctaSubtitle', label: 'Closing banner subtitle', type: 'textarea', max: 400 },
    ],
  },

  // Video tutorials
  {
    key: 'videos.page',
    title: 'Video tutorials page',
    group: 'Video tutorials',
    description: 'Headline copy, featured section, stats and closing banner on the video tutorials page.',
    fields: [
      { name: 'heroTitle', label: 'Headline (first part)', type: 'text', max: 160 },
      { name: 'heroTitleHighlight', label: 'Headline (highlighted part)', type: 'text', max: 160 },
      { name: 'heroSubtitle', label: 'Subtitle', type: 'textarea', max: 500 },
      { name: 'featuredTitle', label: 'Featured videos heading', type: 'text', max: 160 },
      { name: 'statsTitle', label: 'Stats heading', type: 'text', max: 160 },
      { name: 'stats', label: 'Stats', type: 'list', max: 4, item: VALUE_LABEL_ICON },
      { name: 'ctaTitle', label: 'Closing banner title', type: 'text', max: 160 },
      { name: 'ctaTitleHighlight', label: 'Closing banner highlighted line', type: 'text', max: 160 },
      { name: 'ctaSubtitle', label: 'Closing banner subtitle', type: 'textarea', max: 400 },
      { name: 'ctaButtonLabel', label: 'Banner button label', type: 'text', max: 60 },
      { name: 'ctaButtonHref', label: 'Banner button link', type: 'url', max: 500 },
      { name: 'ctaSecondaryLabel', label: 'Banner second button label', type: 'text', max: 60 },
      { name: 'ctaSecondaryHref', label: 'Banner second button link', type: 'url', max: 500 },
    ],
  },

  // Help
  {
    key: 'help.page',
    title: 'Help centre page',
    group: 'Help centre',
    description: 'Headline copy, stats, contact options and closing banner on the help centre. Topic cards, articles and FAQs are listed below.',
    fields: [
      { name: 'heroTitle', label: 'Headline', type: 'text', max: 160 },
      { name: 'heroSubtitle', label: 'Subtitle', type: 'textarea', max: 500 },
      { name: 'popularLinks', label: 'Popular topics (quick links)', type: 'list', max: 10, item: [
        { name: 'icon', label: 'Icon', type: 'icon' },
        { name: 'label', label: 'Label', type: 'text', required: true, max: 120 },
        { name: 'href', label: 'Link', type: 'url', required: true, max: 500 },
      ] },
      { name: 'stats', label: 'Stats bar', type: 'list', max: 4, item: VALUE_LABEL_ICON },
      { name: 'categoriesTitle', label: 'Topics section heading', type: 'text', max: 160 },
      { name: 'faqTitle', label: 'FAQ section heading', type: 'text', max: 160 },
      { name: 'faqSubtitle', label: 'FAQ section text', type: 'text', max: 200, help: 'A "Email our team" link is added automatically when a support email is set.' },
      { name: 'contactTitle', label: 'Contact section heading', type: 'text', max: 160 },
      {
        name: 'contactOptions',
        label: 'Contact options',
        type: 'list',
        max: 6,
        item: [
          { name: 'icon', label: 'Icon', type: 'icon' },
          { name: 'title', label: 'Title', type: 'text', required: true, max: 80 },
          { name: 'description', label: 'Description', type: 'textarea', max: 300 },
          { name: 'ctaLabel', label: 'Button label', type: 'text', required: true, max: 60 },
          { name: 'href', label: 'Button link', type: 'url', required: true, max: 500 },
          { name: 'primary', label: 'Highlight as primary', type: 'boolean' },
        ],
      },
      { name: 'ctaTitle', label: 'Closing banner title', type: 'text', max: 160 },
      { name: 'ctaTitleHighlight', label: 'Closing banner highlighted line', type: 'text', max: 160 },
      { name: 'ctaSubtitle', label: 'Closing banner subtitle', type: 'textarea', max: 400 },
      { name: 'ctaButtonLabel', label: 'Banner button label', type: 'text', max: 60 },
      { name: 'ctaButtonHref', label: 'Banner button link', type: 'url', max: 500 },
    ],
  },

  // Pricing page copy (plans, prices and the comparison table are generated
  // from Plans & Access, so they can never drift from what's actually sold)
  {
    key: 'pricing.page',
    title: 'Pricing page copy',
    group: 'Pricing',
    description: 'Headline copy, trust badges, FAQ framing and closing banner. Plans, prices and the comparison table come from Plans & Access.',
    fields: [
      { name: 'heroTitle', label: 'Headline (first part)', type: 'text', max: 160 },
      { name: 'heroTitleHighlight', label: 'Headline (highlighted part)', type: 'text', max: 160 },
      { name: 'heroSubtitle', label: 'Subtitle', type: 'textarea', max: 500 },
      { name: 'trustItems', label: 'Trust badges', type: 'list', max: 8, item: [
        { name: 'icon', label: 'Icon', type: 'icon' },
        { name: 'text', label: 'Text', type: 'text', required: true, max: 120 },
      ] },
      { name: 'faqTitle', label: 'FAQ title', type: 'text', max: 160 },
      { name: 'faqSubtitle', label: 'FAQ subtitle', type: 'textarea', max: 300 },
      { name: 'faqStats', label: 'Stat tiles above the FAQ', type: 'list', max: 4, item: VALUE_LABEL_ICON },
      { name: 'faqContactTitle', label: '"Still have questions" title', type: 'text', max: 120 },
      { name: 'faqContactText', label: '"Still have questions" text', type: 'textarea', max: 300 },
      { name: 'ctaTitle', label: 'Closing banner title', type: 'text', max: 160 },
      { name: 'ctaTitleHighlight', label: 'Closing banner highlighted line', type: 'text', max: 160 },
      { name: 'ctaSubtitle', label: 'Closing banner subtitle', type: 'textarea', max: 400 },
      { name: 'ctaButtonLabel', label: 'Banner button label', type: 'text', max: 60 },
      { name: 'ctaButtonHref', label: 'Banner button link', type: 'url', max: 500 },
      { name: 'ctaSecondaryLabel', label: 'Banner second button label', type: 'text', max: 60 },
      { name: 'ctaSecondaryHref', label: 'Banner second button link', type: 'url', max: 500 },
    ],
  },

  // Blog page chrome
  {
    key: 'blog.page',
    title: 'Blog page copy',
    group: 'Blog',
    description: 'Hero, sidebar newsletter box and closing banner on the blog.',
    fields: [
      { name: 'heroEyebrow', label: 'Small label above headline', type: 'text', max: 80 },
      { name: 'heroTitle', label: 'Headline (first part)', type: 'text', max: 160 },
      { name: 'heroTitleHighlight', label: 'Headline (highlighted part)', type: 'text', max: 160 },
      { name: 'heroSubtitle', label: 'Subtitle', type: 'textarea', max: 500 },
      { name: 'heroStats', label: 'Stats under the search box', type: 'list', max: 4, item: [
        { name: 'value', label: 'Value', type: 'text', required: true, max: 30 },
        { name: 'label', label: 'Label', type: 'text', required: true, max: 60 },
      ] },
      { name: 'sidebarTitle', label: 'Sidebar box title', type: 'text', max: 120 },
      { name: 'sidebarSubtitle', label: 'Sidebar box text', type: 'textarea', max: 300 },
      { name: 'sidebarButtonLabel', label: 'Sidebar box button label', type: 'text', max: 60 },
      { name: 'sidebarButtonHref', label: 'Sidebar box button link', type: 'url', max: 500 },
      { name: 'popularTitle', label: '"Most read" heading', type: 'text', max: 60 },
      { name: 'topicsTitle', label: 'Topics heading', type: 'text', max: 60 },
      { name: 'promoTitle', label: 'Promo card title', type: 'text', max: 120 },
      { name: 'promoText', label: 'Promo card text', type: 'textarea', max: 300 },
      { name: 'promoButtonLabel', label: 'Promo card button label', type: 'text', max: 60 },
      { name: 'promoButtonHref', label: 'Promo card button link', type: 'url', max: 500 },
      { name: 'ctaEyebrow', label: 'Closing banner small label', type: 'text', max: 80 },
      { name: 'ctaTitleHighlight', label: 'Closing banner highlighted line', type: 'text', max: 160 },
      { name: 'ctaSecondaryLabel', label: 'Closing banner second button label', type: 'text', max: 60 },
      { name: 'ctaSecondaryHref', label: 'Closing banner second button link', type: 'url', max: 500 },
      { name: 'ctaTitle', label: 'Closing banner title', type: 'text', max: 160 },
      { name: 'ctaSubtitle', label: 'Closing banner subtitle', type: 'textarea', max: 400 },
      { name: 'ctaButtonLabel', label: 'Closing banner button label', type: 'text', max: 60 },
      { name: 'ctaButtonHref', label: 'Closing banner button link', type: 'url', max: 500 },
    ],
  },
];

// ─── Collections ─────────────────────────────────────────────────────────────

const LEVELS: SelectOption[] = [
  { value: 'Beginner', label: 'Beginner' },
  { value: 'Intermediate', label: 'Intermediate' },
  { value: 'Advanced', label: 'Advanced' },
  { value: 'All Levels', label: 'All levels' },
];

export const COLLECTION_DEFINITIONS: CollectionDefinition[] = [
  {
    key: 'blog-categories',
    title: 'Blog categories',
    group: 'Blog',
    description: 'The categories posts can be filed under. Deleting a category that has posts is blocked.',
    noun: 'category',
    titleField: 'label',
    subtitleField: 'slug',
    fields: [
      { name: 'slug', label: 'Slug (permanent)', type: 'text', required: true, max: 60, help: 'Lowercase letters, numbers and hyphens. Used in URLs and filters; cannot be changed later.' },
      { name: 'label', label: 'Display name', type: 'text', required: true, max: 60 },
      { name: 'icon', label: 'Icon', type: 'icon' },
      { name: 'gradient', label: 'Cover style', type: 'select', options: [
        { value: 'green', label: 'Green' },
        { value: 'deep-green', label: 'Deep green' },
        { value: 'teal', label: 'Teal' },
        { value: 'gold', label: 'Gold' },
      ] },
    ],
  },
  {
    key: 'video-categories',
    title: 'Video categories',
    group: 'Video tutorials',
    description: 'The tabs on the video tutorials page.',
    noun: 'category',
    titleField: 'label',
    subtitleField: 'slug',
    fields: [
      { name: 'slug', label: 'Slug (permanent)', type: 'text', required: true, max: 60, help: 'Lowercase letters, numbers and hyphens.' },
      { name: 'label', label: 'Display name', type: 'text', required: true, max: 60 },
      { name: 'icon', label: 'Icon', type: 'icon' },
    ],
  },
  {
    key: 'videos',
    title: 'Video tutorials',
    group: 'Video tutorials',
    description: 'Tutorials shown on the video tutorials page.',
    noun: 'video',
    titleField: 'title',
    subtitleField: 'category',
    fields: [
      { name: 'title', label: 'Title', type: 'text', required: true, max: 160 },
      { name: 'description', label: 'Description', type: 'textarea', required: true, max: 600 },
      { name: 'category', label: 'Category slug', type: 'text', required: true, max: 60, help: 'Must match a slug under Video categories.' },
      { name: 'videoUrl', label: 'Video link or embed URL', type: 'url', required: true, max: 700, help: 'YouTube, Vimeo, or a direct video file URL.' },
      { name: 'thumbnail', label: 'Thumbnail', type: 'image', max: 700 },
      { name: 'duration', label: 'Duration', type: 'text', max: 20, placeholder: '5:23' },
      { name: 'instructor', label: 'Instructor', type: 'text', max: 120 },
      { name: 'level', label: 'Level', type: 'select', options: LEVELS },
      { name: 'views', label: 'Views label', type: 'text', max: 20, placeholder: '12.4K' },
      { name: 'date', label: 'Recorded / released', type: 'date' },
      { name: 'featured', label: 'Feature this video', type: 'boolean' },
    ],
  },
  {
    key: 'community-links',
    title: 'Community links',
    group: 'Community',
    description: 'WhatsApp, Telegram and other community invite links.',
    noun: 'community link',
    titleField: 'platform',
    subtitleField: 'members',
    fields: [
      { name: 'platform', label: 'Platform name', type: 'text', required: true, max: 60, placeholder: 'WhatsApp' },
      { name: 'kind', label: 'Platform type', type: 'select', required: true, options: [
        { value: 'whatsapp', label: 'WhatsApp' },
        { value: 'telegram', label: 'Telegram' },
        { value: 'discord', label: 'Discord' },
        { value: 'facebook', label: 'Facebook group' },
        { value: 'other', label: 'Other' },
      ] },
      { name: 'members', label: 'Members text', type: 'text', max: 80, placeholder: '8,500+ active members' },
      { name: 'description', label: 'Description', type: 'textarea', max: 500 },
      { name: 'inviteUrl', label: 'Invite link', type: 'url', required: true, max: 500 },
      { name: 'buttonLabel', label: 'Button label', type: 'text', max: 60, placeholder: 'Join WhatsApp' },
    ],
  },
  {
    key: 'faqs',
    title: 'FAQs',
    group: 'Help centre',
    description: 'Questions shown on the help centre and (when ticked) on the pricing page.',
    noun: 'FAQ',
    titleField: 'question',
    subtitleField: 'category',
    fields: [
      { name: 'question', label: 'Question', type: 'text', required: true, max: 300 },
      { name: 'answer', label: 'Answer', type: 'textarea', required: true, max: 3000 },
      { name: 'category', label: 'Category', type: 'text', required: true, max: 80, placeholder: 'Billing & Subscription' },
      { name: 'showOnPricing', label: 'Also show on the pricing page', type: 'boolean' },
    ],
  },
  {
    key: 'help-categories',
    title: 'Help centre categories',
    group: 'Help centre',
    description: 'Topic cards on the help centre, each with its article links.',
    noun: 'help category',
    titleField: 'title',
    subtitleField: 'description',
    fields: [
      { name: 'title', label: 'Title', type: 'text', required: true, max: 80 },
      { name: 'description', label: 'Description', type: 'textarea', max: 300 },
      { name: 'icon', label: 'Icon', type: 'icon' },
      { name: 'color', label: 'Accent colour', type: 'color' },
      {
        name: 'articles',
        label: 'Articles',
        type: 'list',
        max: 30,
        item: [
          { name: 'title', label: 'Article title', type: 'text', required: true, max: 200 },
          { name: 'slug', label: 'Article URL slug', type: 'text', max: 80, help: 'Lowercase letters, numbers and hyphens, e.g. reset-your-password. The article gets its own page at /help-centre/<slug> once it has content.' },
          { name: 'body', label: 'Article content (Markdown)', type: 'markdown', max: 20000, help: 'Leave empty to list the title only, without a page.' },
          { name: 'status', label: 'Badge', type: 'select', options: [
            { value: '', label: 'None' },
            { value: 'new', label: 'New' },
            { value: 'updated', label: 'Updated' },
          ] },
        ],
      },
    ],
  },
  {
    key: 'testimonials',
    title: 'Testimonials',
    group: 'Home page',
    description: 'Student stories shown on the home page.',
    noun: 'testimonial',
    titleField: 'name',
    subtitleField: 'role',
    fields: [
      { name: 'name', label: 'Name', type: 'text', required: true, max: 120 },
      { name: 'role', label: 'Role / school', type: 'text', max: 160 },
      { name: 'quote', label: 'Quote', type: 'textarea', required: true, max: 800 },
      { name: 'avatar', label: 'Photo', type: 'image', max: 700 },
      { name: 'score', label: 'Result headline', type: 'text', max: 80, placeholder: 'JAMB 312' },
      { name: 'featured', label: 'Highlight this testimonial', type: 'boolean' },
    ],
  },
];

export const BLOCK_BY_KEY = new Map(BLOCK_DEFINITIONS.map((b) => [b.key, b]));
export const COLLECTION_BY_KEY = new Map(COLLECTION_DEFINITIONS.map((c) => [c.key, c]));

// ─── Validation / sanitising ─────────────────────────────────────────────────

const SAFE_URL = /^(https?:\/\/|\/|#|mailto:|tel:)[^\s<>"']*$/i;
const EMAIL = /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/;
const HEX = /^#[0-9a-fA-F]{6}$/;
const ICON_NAME = /^[A-Za-z][A-Za-z0-9]{0,40}$/;
const MAX_LIST_ITEMS = 100;

type Json = string | number | boolean | null | Json[] | { [k: string]: Json };
type JsonObject = { [k: string]: Json };

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function clean(
  spec: FieldSpec,
  raw: unknown,
  path: string,
  errors: string[],
): Json | undefined {
  const empty =
    raw === undefined ||
    raw === null ||
    (typeof raw === 'string' && raw.trim() === '');

  if (spec.type === 'boolean') {
    if (raw === undefined || raw === null) return spec.required ? (errors.push(`${path} is required`), undefined) : false;
    if (typeof raw !== 'boolean') {
      errors.push(`${path} must be true or false`);
      return undefined;
    }
    return raw;
  }

  if (spec.type === 'list') {
    if (raw === undefined || raw === null) return [];
    if (!Array.isArray(raw)) {
      errors.push(`${path} must be a list`);
      return undefined;
    }
    const cap = Math.min(spec.max ?? MAX_LIST_ITEMS, MAX_LIST_ITEMS);
    if (raw.length > cap) {
      errors.push(`${path} can have at most ${cap} items`);
      return undefined;
    }
    const out: Json[] = [];
    raw.forEach((entry, i) => {
      const p = `${path}[${i + 1}]`;
      if (spec.item) {
        if (!isObject(entry)) {
          errors.push(`${p} must be an object`);
          return;
        }
        out.push(cleanObject(spec.item, entry, p, errors));
      } else {
        if (typeof entry !== 'string') {
          errors.push(`${p} must be text`);
          return;
        }
        const t = entry.trim();
        if (t) out.push(t.slice(0, 200));
      }
    });
    return out;
  }

  if (empty) {
    if (spec.required) errors.push(`${spec.label} is required`);
    return spec.type === 'number' ? null : '';
  }

  if (spec.type === 'number') {
    const n = typeof raw === 'number' ? raw : Number(raw);
    if (!Number.isFinite(n)) {
      errors.push(`${spec.label} must be a number`);
      return undefined;
    }
    if (spec.min !== undefined && n < spec.min) errors.push(`${spec.label} must be at least ${spec.min}`);
    if (spec.type === 'number' && spec.max !== undefined && n > spec.max) errors.push(`${spec.label} must be at most ${spec.max}`);
    return n;
  }

  if (typeof raw !== 'string') {
    errors.push(`${spec.label} must be text`);
    return undefined;
  }
  const value = raw.trim();
  const max = spec.max ?? (spec.type === 'markdown' ? 60_000 : 500);
  if (value.length > max) {
    errors.push(`${spec.label} must be ${max} characters or fewer`);
    return undefined;
  }

  switch (spec.type) {
    case 'url':
    case 'image':
      if (!SAFE_URL.test(value)) errors.push(`${spec.label} must be a valid http(s) link or a site path`);
      break;
    case 'email':
      if (!EMAIL.test(value)) errors.push(`${spec.label} must be a valid email address`);
      break;
    case 'color':
      if (!HEX.test(value)) errors.push(`${spec.label} must be a 6-digit hex colour like #2E8B57`);
      break;
    case 'icon':
      if (!ICON_NAME.test(value)) errors.push(`${spec.label} is not a valid icon name`);
      break;
    case 'select':
      if (!(spec.options ?? []).some((o) => o.value === value)) errors.push(`${spec.label} has an unknown option "${value}"`);
      break;
    case 'date':
      if (Number.isNaN(Date.parse(value))) errors.push(`${spec.label} must be a valid date`);
      break;
    default:
      break;
  }
  return value;
}

function cleanObject(
  fields: FieldSpec[],
  raw: Record<string, unknown>,
  path: string,
  errors: string[],
): JsonObject {
  const out: JsonObject = {};
  for (const f of fields) {
    // Selects that allow "" (e.g. "no badge") are optional by construction.
    const v = clean(f, raw[f.name], path ? `${path}.${f.name}` : f.name, errors);
    if (v !== undefined) out[f.name] = v;
  }
  return out;
}

/**
 * Returns a sanitised copy containing ONLY the fields in the spec (unknown
 * keys are dropped, strings trimmed, URLs scheme-checked, lengths enforced).
 * Throws one BadRequestException listing every problem.
 */
export function validateContent(fields: FieldSpec[], raw: unknown): JsonObject {
  if (!isObject(raw)) {
    throw new BadRequestException({ message: ['Content must be an object'], error: 'Bad Request', statusCode: 400 });
  }
  const errors: string[] = [];
  const out = cleanObject(fields, raw, '', errors);
  if (errors.length) {
    throw new BadRequestException({ message: errors, error: 'Bad Request', statusCode: 400 });
  }
  return out;
}
