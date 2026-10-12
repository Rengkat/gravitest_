import { ArrowRight, Users2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export default function CommunityCard({
  platform,
  icon: Icon,
  members,
  description,
  inviteLink,
  color,
  bgColor,
  buttonColor,
}: {
  platform: string;
  icon: React.ElementType;
  members: string;
  description: string;
  inviteLink: string;
  color: string;
  bgColor: string;
  buttonColor: string;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className="rounded-[28px] p-8 border transition-all duration-300 hover:-translate-y-1"
      style={{
        background: "white",
        border: hovered ? `1px solid ${color}30` : "1px solid rgba(30,80,50,0.1)",
        boxShadow: hovered ? `0 12px 40px ${color}10` : "none",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}>
      {/* Icon & Platform */}
      <div
        className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6"
        style={{ background: bgColor }}>
        <Icon size={28} strokeWidth={1.5} style={{ color: color }} />
      </div>

      <h3
        style={{
          fontFamily: "'DM Serif Display', serif",
          fontSize: 28,
          color: "#0d2b1a",
          marginBottom: 8,
        }}>
        {platform}
      </h3>

      <div className="flex items-center gap-2 mb-4">
        <Users2 size={14} strokeWidth={1.8} style={{ color: "#8aab98" }} />
        <span style={{ fontSize: 13, color: "#4a6357" }}>{members} members</span>
      </div>

      <p style={{ fontSize: 14, color: "#4a6357", lineHeight: 1.6, marginBottom: 24 }}>
        {description}
      </p>

      <Link
        href={inviteLink}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center justify-between w-full px-5 py-3 rounded-xl font-sans text-[14px] font-semibold no-underline transition-all duration-200 group"
        style={{
          background: buttonColor,
          color: platform === "WhatsApp" ? "#075E54" : "#2AABEE",
        }}>
        <span>Join {platform} Community →</span>
        <ArrowRight
          size={16}
          strokeWidth={2}
          className="transition-transform group-hover:translate-x-1"
        />
      </Link>
    </div>
  );
}
