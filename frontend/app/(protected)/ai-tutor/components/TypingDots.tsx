import React from "react";

const DOT_COLORS = [
  "bg-green-800/25", // dim
  "bg-green-400", // bright green
  "bg-gold", // gold
];

export default function TypingDots() {
  return (
    <div
      role="status"
      aria-label="Sabi-Tutor is thinking"
      className="flex items-center gap-1.5 py-1">
      {DOT_COLORS.map((color, i) => (
        <div
          key={i}
          aria-hidden="true"
          className={`w-[7px] h-[7px] rounded-full ${color}`}
          style={{ animation: `dot-bounce 1.4s ease-in-out infinite ${i * 0.18}s` }}
        />
      ))}
    </div>
  );
}
