import { SITE_NAME, SITE_URL, absoluteUrl } from "./site";

// Renders a <script type="application/ld+json"> tag. Server components
// only (no client-side JS needed for search engines to read this) —
// import and drop <JsonLd data={...}/> anywhere in a page's JSX tree.
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

// Organization + WebSite (with a sitelinks search box target) — belongs
// once on the root layout so it applies site-wide. This is what lets
// Google show the Gravitest logo/name in the knowledge panel and offer
// a search box directly in search results.
export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "EducationalOrganization",
    "@id": `${SITE_URL}/#organization`,
    name: SITE_NAME,
    alternateName: "Gravitest Technologies Ltd",
    url: SITE_URL,
    logo: absoluteUrl("/icons/icon-512.png"),
    description:
      "Nigeria's AI-powered exam preparation platform for JAMB, WAEC, NECO, Post-UTME, and " +
      "professional certification exams.",
    sameAs: [
      "https://twitter.com/Gravitestng",
      "https://facebook.com/Gravitestng",
      "https://instagram.com/Gravitestng",
    ],
    areaServed: {
      "@type": "Country",
      name: "Nigeria",
    },
  };
}

export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE_URL}/#website`,
    url: SITE_URL,
    name: SITE_NAME,
    publisher: { "@id": `${SITE_URL}/#organization` },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${SITE_URL}/blog?search={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

export function articleJsonLd(params: {
  title: string;
  description: string;
  slug: string;
  authorName: string;
  publishedAt: string | null;
  modifiedAt?: string | null;
  imageUrl?: string | null;
}) {
  const url = absoluteUrl(`/blog/${params.slug}`);
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    "@id": `${url}#article`,
    headline: params.title,
    description: params.description,
    url,
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    image: params.imageUrl ? [params.imageUrl] : [absoluteUrl("/og/default.png")],
    author: {
      "@type": "Person",
      name: params.authorName,
    },
    publisher: { "@id": `${SITE_URL}/#organization` },
    datePublished: params.publishedAt ?? undefined,
    dateModified: params.modifiedAt ?? params.publishedAt ?? undefined,
  };
}

export function faqJsonLd(items: { question: string; answer: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
}
