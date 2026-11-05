import type { HomeStats } from "@/lib/site-content/types";

/** "50k+" -> ["50", "k+"]: the number stays white, the suffix is accented. */
function splitValue(value: string): [string, string] {
  const m = /^([\d.,]+)(.*)$/.exec(value.trim());
  return m ? [m[1], m[2]] : [value, ""];
}

export default function StatsBar({ content }: { content: HomeStats }) {
  const items = content.items ?? [];
  if (!items.length) return null;

  return (
    <div className="bg-green-800 py-9 px-[5%]">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-8">
        {items.map(({ value, label }, index) => {
          const [num, suffix] = splitValue(value);
          return (
            <div
              key={`${label}-${index}`}
              className={`reveal ${index ? `reveal-delay-${Math.min(index, 3)}` : ""} text-center md:text-left`}>
              <div className="w-5 h-[2px] bg-gold/70 mb-3 mx-auto md:mx-0" />
              <div className="font-mono text-[30px] font-semibold text-white leading-none tabular-nums mb-1.5">
                {num}
                <span className="text-gold">{suffix}</span>
              </div>
              <div className="text-[11px] font-mono font-medium text-white/45 tracking-[0.1em] uppercase">
                {label}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
