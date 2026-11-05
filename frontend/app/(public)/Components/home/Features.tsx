import Card from "@/Components/Card";
import { ICON_REGISTRY } from "@/lib/site-content/icons";
import type { HomeFeatures } from "@/lib/site-content/types";
import { Sparkles } from "lucide-react";

const DELAYS = ["", "reveal-delay-1", "reveal-delay-2", "reveal-delay-1", "reveal-delay-3"];

export default function Features({ content }: { content: HomeFeatures }) {
  const items = content.items ?? [];
  if (!items.length) return null;

  return (
    <section className="px-[5%] py-[100px] relative" id="features">
      <div className="mb-16">
        {content.eyebrow && (
          <div className="inline-flex items-center gap-2 mb-4 before:content-[''] before:block before:w-6 before:h-0.5 before:rounded-sm before:bg-green-500">
            <span className="text-[11px] font-bold text-green-600 tracking-[0.12em] uppercase">{content.eyebrow}</span>
          </div>
        )}
        {content.title && (
          <h2
            className="font-serif font-bold text-green-900 leading-[1.1] tracking-[-0.03em] mb-4 max-w-[620px]"
            style={{ fontSize: "clamp(32px, 4vw, 52px)" }}>
            {content.title}
          </h2>
        )}
        {content.subtitle && <p className="text-base text-text-muted leading-[1.7] max-w-[540px]">{content.subtitle}</p>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map((f, i) => (
          <Card
            key={`${f.title}-${i}`}
            Icon={ICON_REGISTRY[f.icon] ?? Sparkles}
            title={f.title}
            desc={f.description}
            tag={f.tag ?? ""}
            featured={f.featured}
            delay={DELAYS[i % DELAYS.length]}
          />
        ))}
      </div>
    </section>
  );
}
