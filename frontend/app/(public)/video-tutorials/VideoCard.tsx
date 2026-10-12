import { CATEGORIES, Video } from "@/lib/constants/video-tutorial";
import { Clock, GraduationCap, Play, PlayCircle, Users } from "lucide-react";
import { useState } from "react";

export default function VideoCard({ video, index }: { video: Video; index: number }) {
  const [hovered, setHovered] = useState(false);
  const CategoryIcon = CATEGORIES.find((c) => c.id === video.category)?.icon || PlayCircle;

  return (
    <div
      className="group rounded-2xl overflow-hidden border transition-all duration-300 hover:-translate-y-1"
      style={{
        background: "white",
        border: hovered ? "1px solid rgba(46,139,87,0.25)" : "1px solid rgba(30,80,50,0.1)",
        boxShadow: hovered ? "0 12px 32px rgba(13,43,26,0.1)" : "none",
        animation: `fadeUp 0.6s ${0.05 * index}s ease both`,
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}>
      {/* Thumbnail */}
      <div className="relative aspect-video bg-gradient-to-br from-green-900 to-green-700 overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center">
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 group-hover:scale-110"
            style={{
              background: "rgba(0,0,0,0.7)",
              backdropFilter: "blur(4px)",
            }}>
            <Play size={24} strokeWidth={2} style={{ color: "white", marginLeft: 2 }} />
          </div>
        </div>

        {/* Duration badge */}
        <div
          className="absolute bottom-3 right-3 px-2 py-1 rounded-md text-[11px] font-mono font-bold"
          style={{ background: "rgba(0,0,0,0.75)", color: "white" }}>
          {video.duration}
        </div>

        {/* Level badge */}
        {video.level && (
          <div
            className="absolute top-3 left-3 px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wide"
            style={{ background: "rgba(26,74,46,0.9)", color: "#f5c842" }}>
            {video.level}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-5">
        <div className="flex items-center gap-2 mb-3">
          <CategoryIcon size={14} strokeWidth={1.8} style={{ color: "#8aab98" }} />
          <span className="text-[11px] text-text-muted uppercase tracking-wide">
            {CATEGORIES.find((c) => c.id === video.category)?.label}
          </span>
          {video.featured && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gold/15 text-gold-dark">
              Featured
            </span>
          )}
        </div>

        <h3
          style={{
            fontFamily: "'Sora', sans-serif",
            fontSize: 16,
            fontWeight: 600,
            color: "#0d2b1a",
            marginBottom: 8,
            lineHeight: 1.4,
          }}>
          {video.title}
        </h3>

        <p style={{ fontSize: 13, color: "#4a6357", lineHeight: 1.5, marginBottom: 12 }}>
          {video.description}
        </p>

        {/* Metadata */}
        <div className="flex items-center gap-4 text-[11px] text-text-light">
          <div className="flex items-center gap-1">
            <Clock size={12} />
            <span>{video.duration}</span>
          </div>
          {video.views && (
            <div className="flex items-center gap-1">
              <Users size={12} />
              <span>{video.views} views</span>
            </div>
          )}
          {video.instructor && (
            <div className="flex items-center gap-1">
              <GraduationCap size={12} />
              <span>{video.instructor.split(" ")[0]}</span>
            </div>
          )}
        </div>

        {/* Watch button */}
        <button
          className="w-full mt-4 py-2.5 rounded-xl text-[13px] font-semibold transition-all duration-200"
          style={{
            background: hovered ? "#1a4a2e" : "rgba(26,74,46,0.05)",
            color: hovered ? "white" : "#1a4a2e",
          }}>
          Watch Now →
        </button>
      </div>
    </div>
  );
}
