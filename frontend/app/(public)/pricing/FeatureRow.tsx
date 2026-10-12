import { Check, X } from "lucide-react";

export type Feature = { text: string; included: boolean };

/** One bullet on a pricing card. `popular` = rendered on the dark highlighted card. */
export default function FeatureRow({ text, included, popular }: Feature & { popular?: boolean }) {
  if (included) {
    return (
      <div className="flex items-center gap-2.5 text-[13.5px]">
        <div
          className={`w-[18px] h-[18px] rounded-full flex items-center justify-center shrink-0 ${popular ? "bg-white/15 text-green-300" : "bg-green-500/[0.12] text-green-600"}`}>
          <Check size={10} strokeWidth={3} />
        </div>
        <span className={popular ? "text-white/75" : "text-text-muted"}>{text}</span>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-2.5 text-[13.5px] opacity-35">
      <div className="w-[18px] h-[18px] rounded-full flex items-center justify-center shrink-0 bg-black/[0.05] text-text-light">
        <X size={10} strokeWidth={3} />
      </div>
      <span className="text-text-muted">{text}</span>
    </div>
  );
}
