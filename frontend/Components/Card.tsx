import { LucideIcon } from "@/lib/constants/NavConstants";

type Feature = {
  Icon: LucideIcon;
  title: string;
  desc: string;
  tag: string;
  featured?: boolean;
  delay: string;
};
export default function Card({ Icon, title, desc, tag, featured = false, delay }: Feature) {
  if (featured) {
    return (
      <div
        className={`reveal ${delay} relative overflow-hidden cursor-default px-8 py-9 rounded-[20px] border transition-all duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-card)] bg-green-800 border-green-700`}>
        <div className="w-12 h-12 mb-6 rounded-[14px] flex items-center justify-center bg-white/10 text-white">
          <Icon size={22} strokeWidth={1.75} />
        </div>
        <h3 className="font-serif text-[20px] leading-[1.3] mb-2.5 text-white">{title}</h3>
        <p className="text-sm leading-[1.65] text-white/65">{desc}</p>
        <span className="inline-block mt-5 px-3 py-1 rounded-full text-[11px] font-bold tracking-[0.04em] uppercase bg-white/[0.12] text-gold">
          {tag}
        </span>
      </div>
    );
  }

  return (
    <div
      className={`reveal ${delay} relative overflow-hidden cursor-default px-8 py-9 rounded-[20px] border transition-all duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-card)] hover:border-green-500/25 bg-white border-cream-border after:content-[''] after:absolute after:inset-0 after:bg-gradient-to-br after:from-green-500/0 after:to-green-500/[0.04] after:opacity-0 after:transition-opacity after:duration-300 hover:after:opacity-100`}>
      <div className="w-12 h-12 mb-6 rounded-[14px] flex items-center justify-center bg-green-500/10 text-green-600">
        <Icon size={22} strokeWidth={1.75} />
      </div>
      <h3 className="font-serif text-[20px] leading-[1.3] mb-2.5 text-green-900">{title}</h3>
      <p className="text-sm leading-[1.65] text-text-muted">{desc}</p>
      <span className="inline-block mt-5 px-3 py-1 rounded-full text-[11px] font-bold tracking-[0.04em] uppercase bg-green-500/10 text-green-600">
        {tag}
      </span>
    </div>
  );
}
