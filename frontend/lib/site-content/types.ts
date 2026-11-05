/** Typed shapes of the public content the CMS serves. Mirrors BLOCK_/COLLECTION_DEFINITIONS in the backend. */

export interface IconTitleDesc { icon: string; title: string; description: string }
export interface ValueLabelIcon { icon: string; value: string; label: string }
export interface LinkItem { label: string; href: string }

export interface SiteContact {
  supportEmail?: string; salesEmail?: string; phone?: string;
  whatsapp?: string; address?: string; supportHours?: string;
}
export interface SiteSocial { links?: { platform: string; url: string }[] }
export interface SiteFooter {
  tagline?: string;
  columns?: { title: string; links: LinkItem[] }[];
  legalLinks?: LinkItem[];
  copyright?: string;
}

export interface HomeHero {
  badge?: string; titleLead?: string; titleHighlight?: string; subtitle?: string;
  primaryCtaLabel?: string; primaryCtaHref?: string;
  secondaryCtaLabel?: string; secondaryCtaHref?: string; trustNote?: string;
}
export interface SectionHead { eyebrow?: string; title?: string; subtitle?: string }
export interface HomeStats { items?: ValueLabelIcon[] }
export interface HomeFeatures extends SectionHead {
  items?: (IconTitleDesc & { tag?: string; featured?: boolean })[];
}
export type HomeTestimonials = SectionHead;
export interface HomeExamModules extends SectionHead {
  items?: { badge?: string; name: string; description?: string; tags?: string[]; href?: string }[];
}
export interface HomeHowItWorks extends SectionHead { items?: { title: string; description: string }[] }
export interface HomeAiTutor extends SectionHead { items?: IconTitleDesc[] }
export interface HomeCta {
  title?: string; titleHighlight?: string; subtitle?: string;
  buttonLabel?: string; buttonHref?: string; secondaryButtonLabel?: string; secondaryButtonHref?: string;
}

export interface CommunityPage {
  heroTitleLead?: string; heroTitleHighlight?: string; heroSubtitle?: string;
  stats?: ValueLabelIcon[]; benefitsTitle?: string; benefitsSubtitle?: string; benefits?: IconTitleDesc[];
  rulesTitle?: string; rulesSubtitle?: string; rules?: string[];
  ctaTitle?: string; ctaTitleHighlight?: string; ctaSubtitle?: string;
}
export interface VideosPage {
  heroTitle?: string; heroTitleHighlight?: string; heroSubtitle?: string;
  featuredTitle?: string; statsTitle?: string; stats?: ValueLabelIcon[];
  ctaTitle?: string; ctaTitleHighlight?: string; ctaSubtitle?: string;
  ctaButtonLabel?: string; ctaButtonHref?: string; ctaSecondaryLabel?: string; ctaSecondaryHref?: string;
}
export interface HelpPage {
  heroTitle?: string; heroSubtitle?: string;
  popularLinks?: { icon: string; label: string; href: string }[];
  stats?: ValueLabelIcon[];
  categoriesTitle?: string; faqTitle?: string; faqSubtitle?: string; contactTitle?: string;
  contactOptions?: { icon: string; title: string; description?: string; ctaLabel: string; href: string; primary?: boolean }[];
  ctaTitle?: string; ctaTitleHighlight?: string; ctaSubtitle?: string; ctaButtonLabel?: string; ctaButtonHref?: string;
}
export interface PricingPage {
  heroTitle?: string; heroTitleHighlight?: string; heroSubtitle?: string;
  trustItems?: { icon: string; text: string }[];
  faqTitle?: string; faqSubtitle?: string; faqStats?: ValueLabelIcon[];
  faqContactTitle?: string; faqContactText?: string;
  ctaTitle?: string; ctaTitleHighlight?: string; ctaSubtitle?: string;
  ctaButtonLabel?: string; ctaButtonHref?: string; ctaSecondaryLabel?: string; ctaSecondaryHref?: string;
}
export interface BlogPage {
  heroEyebrow?: string; heroTitle?: string; heroTitleHighlight?: string; heroSubtitle?: string;
  heroStats?: { value: string; label: string }[];
  sidebarTitle?: string; sidebarSubtitle?: string; sidebarButtonLabel?: string; sidebarButtonHref?: string;
  popularTitle?: string; topicsTitle?: string;
  promoTitle?: string; promoText?: string; promoButtonLabel?: string; promoButtonHref?: string;
  ctaEyebrow?: string; ctaTitle?: string; ctaTitleHighlight?: string; ctaSubtitle?: string;
  ctaButtonLabel?: string; ctaButtonHref?: string; ctaSecondaryLabel?: string; ctaSecondaryHref?: string;
}

export interface BlockMap {
  "site.contact": SiteContact;
  "site.social": SiteSocial;
  "site.footer": SiteFooter;
  "home.hero": HomeHero;
  "home.stats": HomeStats;
  "home.features": HomeFeatures;
  "home.exam-modules": HomeExamModules;
  "home.how-it-works": HomeHowItWorks;
  "home.ai-tutor": HomeAiTutor;
  "home.testimonials": HomeTestimonials;
  "home.cta": HomeCta;
  "community.page": CommunityPage;
  "videos.page": VideosPage;
  "help.page": HelpPage;
  "pricing.page": PricingPage;
  "blog.page": BlogPage;
}
export type BlockKey = keyof BlockMap;

export interface BlogCategoryItem { slug: string; label: string; icon?: string; gradient?: "green" | "deep-green" | "teal" | "gold" | "" }
export interface VideoCategoryItem { slug: string; label: string; icon?: string }
export interface VideoItem {
  title: string; description: string; category: string; videoUrl: string;
  thumbnail?: string; duration?: string; instructor?: string;
  level?: string; views?: string; date?: string; featured?: boolean;
}
export interface CommunityLinkItem {
  platform: string; kind: "whatsapp" | "telegram" | "discord" | "facebook" | "other";
  members?: string; description?: string; inviteUrl: string; buttonLabel?: string;
}
export interface FaqItem { question: string; answer: string; category: string; showOnPricing?: boolean }
export interface HelpArticle { title: string; slug?: string; body?: string; status?: "" | "new" | "updated" }
export interface HelpCategoryItem {
  title: string; description?: string; icon?: string; color?: string;
  articles?: HelpArticle[];
}
export interface TestimonialItem {
  name: string; role?: string; quote: string; avatar?: string; score?: string; featured?: boolean;
}

export interface CollectionMap {
  "blog-categories": BlogCategoryItem;
  "video-categories": VideoCategoryItem;
  videos: VideoItem;
  "community-links": CommunityLinkItem;
  faqs: FaqItem;
  "help-categories": HelpCategoryItem;
  testimonials: TestimonialItem;
}
export type CollectionKey = keyof CollectionMap;
