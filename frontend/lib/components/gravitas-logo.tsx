import type { SVGProps } from "react";

interface GravitasLogoMarkProps extends SVGProps<SVGSVGElement> {
  size?: number;
}

/** Square logo mark — the "G" crest on a dark green background */
export function GravitasLogoMark({ size = 38, ...props }: GravitasLogoMarkProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 38 38"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      {...props}>
      <rect width="38" height="38" rx="10" fill="#1a4a2e" />
      <text
        x="19"
        y="28"
        textAnchor="middle"
        fontFamily="'DM Serif Display', Georgia, serif"
        fontSize="24"
        fill="#f5c842"
        fontStyle="normal">
        G
      </text>
    </svg>
  );
}

/** Full wordmark: logo mark + "Gravitest" text */
export function GravitasWordmark({ size = 38 }: { size?: number }) {
  return (
    <span className="flex items-center gap-2.5 select-none" data-testid="gravitest-wordmark">
      <GravitasLogoMark size={size} />
      <span
        style={{
          fontFamily: "'DM Serif Display', serif",
          fontSize: 22,
          color: "#0d2b1a",
          letterSpacing: "-0.3px",
          lineHeight: 1,
        }}>
        Gravitest
      </span>
    </span>
  );
}

export default GravitasLogoMark;
