import { Lock, RefreshCw, Smartphone, Zap, Flag } from "lucide-react";
import type { LucideIcon } from "lucide-react";

type TrustItem = { Icon: LucideIcon; label: string };

const ITEMS: TrustItem[] = [
  { Icon: Lock,        label: "No credit card required"    },
  { Icon: RefreshCw,   label: "Cancel anytime"             },
  { Icon: Smartphone,  label: "Works on any Android device" },
  { Icon: Zap,         label: "Instant account activation" },
  { Icon: Flag,        label: "Made for Nigeria"            },
];

export default function TrustBar() {
  return (
    <div className="flex items-center justify-center gap-8 flex-wrap px-[5%] py-7 border-t border-cream-border border-b border-b-cream-border bg-white mt-18">
      {ITEMS.map(({ Icon, label }) => (
        <div key={label} className="flex items-center gap-2 text-[13px] text-text-muted font-medium">
          <div className="w-7 h-7 rounded-lg bg-green-500/10 flex items-center justify-center shrink-0">
            <Icon size={14} strokeWidth={1.75} className="text-green-600" />
          </div>
          {label}
        </div>
      ))}
    </div>
  );
}
