"use client";

import { useEffect } from "react";
import { Flame, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Props {
  name: string;
  destination: string;
}

export default function LoginSuccess({ name, destination }: Props) {
  const router = useRouter();

  // Auto-continue after a beat so the confirmation still registers, but
  // the "Go to Dashboard" button below also works immediately if the
  // person doesn't want to wait.
  useEffect(() => {
    const id = setTimeout(() => router.replace(destination), 1400);
    return () => clearTimeout(id);
  }, [destination, router]);

  return (
    <div className="text-center py-8 [animation:fadeUp_0.4s_ease_both]">
      <div className="relative w-24 h-24 mx-auto mb-6">
        <div className="w-24 h-24 rounded-3xl bg-green-500/10 border-2 border-green-500/20 flex items-center justify-center text-5xl [animation:float_6s_ease-in-out_infinite]">
          🎓
        </div>
        <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-xl bg-gold flex items-center justify-center shadow-md">
          <Flame size={16} strokeWidth={1.5} className="text-green-900" />
        </div>
      </div>

      <h2 className="font-serif text-[30px] text-green-900 tracking-tight mb-2">
        You&apos;re back!
      </h2>
      <p className="text-green-700/55 text-sm mb-8">
        Welcome back, <strong className="text-green-800">{name}</strong>
      </p>

      <Link
        href={destination}
        className="w-full py-4 bg-green-800 text-white font-bold text-[15px] rounded-xl hover:bg-green-700 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_28px_rgba(26,74,46,0.3)] flex items-center justify-center gap-2 no-underline">
        Go to Dashboard
        <ArrowRight size={16} strokeWidth={2.5} />
      </Link>
    </div>
  );
}
