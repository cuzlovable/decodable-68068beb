import { useMemo } from "react";
import { motion } from "framer-motion";
import { type CenterId, CENTERS, UNIQUE_CHANNELS, getDefinedCenters } from "@/lib/humandesign";

// ─── Canonical bodygraph layout (520 x 820) ─────────────────
// Standard Jovian-style chart: Head & Ajna are triangles pointing toward each other,
// Heart/Spleen/Solar Plexus are side triangles with apex pointing toward G,
// Throat / Sacral / Root are squares.

type Shape =
  | { kind: "triangle"; points: [number, number][] }
  | { kind: "rect"; x: number; y: number; w: number; h: number }
  | { kind: "diamond"; cx: number; cy: number; r: number };

const CENTER_SHAPES: Record<CenterId, { shape: Shape; labelAt: [number, number] }> = {
  head:    {
    // Down-pointing triangle, base on top, apex toward Ajna
    shape: { kind: "triangle", points: [[190, 40], [330, 40], [260, 145]] },
    labelAt: [260, 30],
  },
  ajna:    {
    // Up-pointing triangle, apex toward Head
    shape: { kind: "triangle", points: [[260, 160], [190, 260], [330, 260]] },
    labelAt: [110, 215],
  },
  throat:  {
    shape: { kind: "rect", x: 185, y: 285, w: 150, h: 90 },
    labelAt: [105, 330],
  },
  g:       {
    shape: { kind: "diamond", cx: 260, cy: 460, r: 70 },
    labelAt: [260, 555],
  },
  heart:   {
    // Triangle right of G, apex pointing LEFT toward G
    shape: { kind: "triangle", points: [[400, 420], [400, 480], [335, 450]] },
    labelAt: [435, 450],
  },
  splenic: {
    // Triangle left, apex pointing RIGHT toward Sacral
    shape: { kind: "triangle", points: [[45, 540], [45, 660], [190, 600]] },
    labelAt: [40, 685],
  },
  sacral:  {
    shape: { kind: "rect", x: 195, y: 555, w: 130, h: 110 },
    labelAt: [260, 685],
  },
  solar:   {
    // Triangle right, apex pointing LEFT toward Sacral
    shape: { kind: "triangle", points: [[475, 540], [475, 660], [330, 600]] },
    labelAt: [480, 685],
  },
  root:    {
    shape: { kind: "rect", x: 185, y: 695, w: 150, h: 90 },
    labelAt: [260, 800],
  },
};

// ─── Absolute gate coordinates (placed at standard chart positions) ───
const GATE_POS: Record<number, [number, number]> = {
  // HEAD
  64: [210, 75], 61: [260, 65], 63: [310, 75],
  // AJNA
  47: [215, 230], 24: [245, 230], 4: [215, 210],
  17: [305, 230], 43: [275, 230], 11: [305, 210],
  // THROAT
  62: [205, 297], 23: [235, 297], 56: [315, 297],
  35: [205, 320], 12: [205, 348],
  45: [260, 320],
  33: [220, 363], 8: [248, 363], 31: [275, 363],
  20: [315, 320], 16: [315, 348],
  // G
  1:  [240, 410], 13: [280, 410], 25: [300, 435],
  46: [300, 478], 7:  [280, 510], 10: [240, 510],
  15: [220, 478], 2:  [220, 435],
  // HEART
  21: [380, 433], 51: [392, 450], 26: [380, 467], 40: [350, 450],
  // SPLEEN  (vertical stack of 48/44/32 on outer edge + 28/50/57 on inner edge + 18 lower)
  48: [70, 555], 44: [70, 585], 32: [70, 615],
  28: [105, 565], 50: [125, 595], 57: [155, 605],
  18: [105, 638],
  // SACRAL
  5:  [215, 580], 14: [260, 580], 29: [305, 580],
  59: [215, 610], 9:  [260, 610], 3:  [305, 610],
  42: [215, 640], 27: [260, 640], 34: [305, 640],
  // SOLAR PLEXUS  (mirror of spleen on the right)
  6:  [415, 565], 37: [395, 595], 22: [365, 605],
  36: [450, 555], 49: [450, 585], 55: [450, 615],
  30: [415, 638],
  // ROOT
  53: [215, 715], 60: [260, 712], 52: [305, 715],
  19: [215, 740], 39: [260, 740], 41: [305, 740],
  58: [215, 768], 38: [260, 770], 54: [305, 768],
};

const GATE_R = 9;

function CenterEl({
  center,
  isDefined,
  isMind,
}: {
  center: CenterId;
  isDefined: boolean;
  isMind: boolean;
}) {
  const { shape, labelAt } = CENTER_SHAPES[center];
  const label = CENTERS[center].label;

  const fillColor = isDefined
    ? isMind ? "url(#mindGradient)" : "url(#definedGradient)"
    : "transparent";
  const strokeColor = isDefined
    ? isMind ? "hsl(260, 50%, 68%)" : "hsl(24, 90%, 60%)"
    : "hsl(215, 35%, 70%)";
  const strokeWidth = isDefined ? 2.5 : 1.5;
  const strokeDash = isDefined ? undefined : "4 3";

  let el: JSX.Element;
  switch (shape.kind) {
    case "triangle":
      el = (
        <polygon
          points={shape.points.map((p) => p.join(",")).join(" ")}
          fill={fillColor}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeDasharray={strokeDash}
          strokeLinejoin="round"
        />
      );
      break;
    case "rect":
      el = (
        <rect
          x={shape.x}
          y={shape.y}
          width={shape.w}
          height={shape.h}
          rx={4}
          fill={fillColor}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeDasharray={strokeDash}
        />
      );
      break;
    case "diamond": {
      const { cx, cy, r } = shape;
      const pts = `${cx},${cy - r} ${cx + r},${cy} ${cx},${cy + r} ${cx - r},${cy}`;
      el = (
        <polygon
          points={pts}
          fill={fillColor}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeDasharray={strokeDash}
          strokeLinejoin="round"
        />
      );
      break;
    }
  }

  return (
    <g>
      {el}
      <text
        x={labelAt[0]}
        y={labelAt[1]}
        textAnchor="middle"
        fill={isDefined ? "hsl(24, 90%, 50%)" : "hsl(215, 30%, 55%)"}
        fontSize="10"
        fontFamily="DM Sans, sans-serif"
        fontWeight={isDefined ? 600 : 400}
      >
        {label}
      </text>
    </g>
  );
}

interface BodygraphProps {
  definedGates: number[];
  className?: string;
}

const Bodygraph = ({ definedGates, className = "" }: BodygraphProps) => {
  const definedCenters = useMemo(() => getDefinedCenters(definedGates), [definedGates]);
  const gateSet = useMemo(() => new Set(definedGates), [definedGates]);

  const activeChannels = useMemo(
    () => UNIQUE_CHANNELS.filter((ch) => gateSet.has(ch.gates[0]) && gateSet.has(ch.gates[1])),
    [gateSet]
  );

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6 }}
      className={className}
    >
      <svg viewBox="0 0 520 820" className="w-full max-w-[440px] mx-auto" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="definedGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(24, 90%, 65%)" stopOpacity="0.85" />
            <stop offset="100%" stopColor="hsl(24, 90%, 75%)" stopOpacity="0.55" />
          </linearGradient>
          <linearGradient id="mindGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(260, 50%, 68%)" stopOpacity="0.85" />
            <stop offset="100%" stopColor="hsl(260, 50%, 78%)" stopOpacity="0.55" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Centers (drawn first as filled shapes) */}
        {(Object.keys(CENTERS) as CenterId[]).map((centerId) => (
          <CenterEl
            key={centerId}
            center={centerId}
            isDefined={definedCenters.has(centerId)}
            isMind={centerId === "head" || centerId === "ajna"}
          />
        ))}

        {/* Channel lines — gate to gate */}
        {UNIQUE_CHANNELS.map((ch) => {
          const from = GATE_POS[ch.gates[0]];
          const to = GATE_POS[ch.gates[1]];
          if (!from || !to) return null;
          const isActive = activeChannels.some((a) => a.id === ch.id);
          const oneSide =
            gateSet.has(ch.gates[0]) !== gateSet.has(ch.gates[1]);
          return (
            <line
              key={ch.id}
              x1={from[0]} y1={from[1]}
              x2={to[0]} y2={to[1]}
              stroke={
                isActive
                  ? "hsl(24, 90%, 60%)"
                  : oneSide
                    ? "hsl(24, 60%, 70%)"
                    : "hsl(215, 25%, 75%)"
              }
              strokeWidth={isActive ? 3 : 1.2}
              strokeOpacity={isActive ? 0.95 : oneSide ? 0.55 : 0.35}
              filter={isActive ? "url(#glow)" : undefined}
            />
          );
        })}

        {/* Gates (on top of channels) */}
        {Object.entries(GATE_POS).map(([gateStr, [cx, cy]]) => {
          const gateNum = Number(gateStr);
          const active = gateSet.has(gateNum);
          return (
            <g key={gateNum}>
              <circle
                cx={cx}
                cy={cy}
                r={GATE_R}
                fill={active ? "hsl(24, 90%, 60%)" : "hsl(0, 0%, 100%)"}
                stroke={active ? "hsl(24, 90%, 42%)" : "hsl(215, 25%, 55%)"}
                strokeWidth={1.2}
              />
              <text
                x={cx}
                y={cy + 3}
                textAnchor="middle"
                fill={active ? "hsl(0, 0%, 100%)" : "hsl(215, 35%, 30%)"}
                fontSize="8.5"
                fontFamily="DM Sans, sans-serif"
                fontWeight="600"
                pointerEvents="none"
              >
                {gateNum}
              </text>
            </g>
          );
        })}
      </svg>
    </motion.div>
  );
};

export default Bodygraph;
