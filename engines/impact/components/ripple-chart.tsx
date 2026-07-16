"use client";

import type { RippleRing } from "@/engines/impact/types";

export function RippleChart({ rings }: { rings: RippleRing[] }) {
  const size = 200;
  const center = size / 2;

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      className="mx-auto h-48 w-48"
      role="img"
      aria-label="Impact ripple visualization"
    >
      {rings.map((ring, i) => {
        const radius = 30 + (i + 1) * 22;
        const opacity = 0.15 + (ring.value / ring.max) * 0.45;
        return (
          <g key={ring.label}>
            <circle
              cx={center}
              cy={center}
              r={radius}
              fill="none"
              stroke={ring.color}
              strokeWidth={2}
              opacity={opacity}
            />
            <text
              x={center}
              y={center - radius + 14}
              textAnchor="middle"
              className="fill-fg-muted text-[8px]"
            >
              {ring.label} {ring.value}
            </text>
          </g>
        );
      })}
      <circle cx={center} cy={center} r={18} fill="var(--brand-primary)" opacity={0.9} />
      <circle cx={center} cy={center} r={8} fill="white" opacity={0.9} />
    </svg>
  );
}
