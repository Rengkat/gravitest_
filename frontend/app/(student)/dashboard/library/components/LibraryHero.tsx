import { Library as LibraryIcon } from "lucide-react";
import { LIBRARY_STATS } from "@/lib/mock/library";
import { formatNumber } from "@/lib/constants/helpers";

export default function LibraryHero() {
  return (
    <div className="relative bg-green-900 text-white overflow-hidden">
      {/* Dot grid texture */}
      <div
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />
      {/* Glow blobs */}
      <div className="absolute -top-20 -left-20 w-72 h-72 bg-emerald-500 rounded-full blur-3xl opacity-10" />
      <div className="absolute -bottom-10 right-0 w-96 h-96 bg-green-400 rounded-full blur-3xl opacity-10" />

      <div className="relative max-w-7xl mx-auto px-6 py-12 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/20 mb-5">
          <LibraryIcon size={14} />
          <span className="text-[12px] font-semibold tracking-wide uppercase">Digital Library</span>
        </div>

        <h1 className="text-3xl md:text-4xl font-bold mb-3">Your Learning Resources Hub</h1>
        <p className="text-green-200 max-w-xl mx-auto text-sm leading-relaxed">
          Thousands of eBooks, video tutorials, infographics, and study materials to help you
          excel in JAMB, WAEC, NECO and beyond.
        </p>

        {/* Quick stats */}
        <div className="flex flex-wrap justify-center gap-8 mt-8">
          {[
            [formatNumber(LIBRARY_STATS.totalResources) + "+", "Resources"],
            [LIBRARY_STATS.videoHours + "+", "Video Hours"],
            [formatNumber(LIBRARY_STATS.totalStudents) + "+", "Students"],
            [formatNumber(LIBRARY_STATS.premiumResources) + "+", "Premium Titles"],
          ].map(([val, label]) => (
            <div key={label}>
              <div className="text-2xl font-bold">{val}</div>
              <div className="text-[12px] text-green-300 mt-0.5">{label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
