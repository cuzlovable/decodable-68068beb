import { useMemo } from "react";
import { motion } from "framer-motion";
import { type CenterId, CENTERS, UNIQUE_CHANNELS, getDefinedCenters } from "@/lib/humandesign";

// ─── Canonical bodygraph layout — 600 x 920 canvas ─────────────────
// Larger centers + gates placed on/inside each shape so channels have
// breathing room and every gate visually belongs to its center.

type Shape =
  | { kind: "triangle"; points: [number, number][] }
  | { kind: "rect"; x: number; y: number; w: number; h: number }
  | { kind: "diamond"; cx: number; cy: number; r: number };

const CENTER_SHAPES: Record<CenterId, { shape: Shape; labelAt: [number, number] }> = {
  head: {
    // Down-pointing triangle
    shape: { kind: "triangle", points: [[200, 50], [400, 50], [300, 175]] },
    labelAt: [300, 35],
  },
  ajna: {
    // Up-pointing triangle
    shape: { kind: "triangle", points: [[300, 195], [200, 320], [400, 320]] },
    labelAt: [120, 270],
  },
  throat: {
    shape: { kind: "rect", x: 210, y: 340, w: 180, h: 110 },
    labelAt: [120, 395],
  },
  g: {
    shape: { kind: "diamond", cx: 300, cy: 525, r: 75 },
    labelAt: [300, 615],
  },
  heart: {
    // Right of G, apex pointing LEFT toward G
    shape: { kind: "triangle", points: [[445, 480], [445, 555], [385, 518]] },
    labelAt: [470, 518],
  },
  splenic: {
    // Left, apex pointing RIGHT
    shape: { kind: "triangle", points: [[50, 615], [50, 745], [215, 680]] },
    labelAt: [50, 770],
  },
  sacral: {
    shape: { kind: "rect", x: 220, y: 635, w: 160, h: 125 },
    labelAt: [300, 780],
  },
  solar: {
    // Right, apex pointing LEFT
    shape: { kind: "triangle", points: [[550, 615], [550, 745], [385, 680]] },
    labelAt: [550, 770],
  },
  root: {
    shape: { kind: "rect", x: 220, y: 790, w: 160, h: 110 },
    labelAt: [300, 915],
  },
};

// ─── Absolute gate positions (inside their center shapes) ───────────
const GATE_POS: Record<number, [number, number]> = {
  // HEAD — along top edge of down-triangle
  64: [235, 75], 61: [300, 65], 63: [365, 75],

  // AJNA — packed inside up-triangle
  4:  [260, 250], 24: [240, 285], 47: [220, 315],
  11: [340, 250], 43: [360, 285], 17: [380, 315],

  // THROAT — rectangle 210..390 × 340..450
  62: [240, 360], 23: [300, 360], 56: [360, 360],
  35: [225, 390], 12: [225, 425],
  45: [300, 395],
  16: [375, 390], 20: [375, 425],
  33: [245, 440], 8:  [300, 440], 31: [355, 440],

  // G — diamond points (top 440, right 375, bot 600, left 225)
  13: [285, 460], 25: [315, 460],
  2:  [250, 495], 46: [350, 495],
  15: [250, 555], 10: [350, 555],
  7:  [285, 590], 1:  [315, 590],

  // HEART — small right triangle
  40: [395, 518], 21: [425, 495], 26: [425, 540], 51: [445, 518],

  // SPLEEN — left triangle (base x=50, apex x=215)
  48: [65, 635], 44: [65, 680], 32: [65, 725],
  28: [105, 655], 50: [105, 705],
  18: [140, 680], 57: [180, 680],

  // SACRAL — 3×3 grid
  5:  [255, 660], 14: [300, 660], 29: [345, 660],
  59: [255, 700], 9:  [300, 700], 3:  [345, 700],
  42: [255, 740], 27: [300, 740], 34: [345, 740],

  // SOLAR PLEXUS — right triangle (mirror of spleen)
  36: [535, 635], 22: [535, 680], 49: [535, 725],
  6:  [495, 655], 30: [495, 705],
  37: [460, 680], 55: [420, 680],

  // ROOT — 3×3 grid
  53: [255, 815], 60: [300, 815], 52: [345, 815],
  19: [255, 850], 39: [300, 850], 41: [345, 850],
  58: [255, 885], 38: [300, 885], 54: [345, 885],
};

const GATE_R = 10;

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
          rx={5}
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
        fontSize="11"
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
      <svg
        viewBox="0 0 600 930"
        className="w-full max-w-[460px] mx-auto"
        xmlns="http://www.w3.org/2000/svg"
      >
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

        {/* Centers first */}
        {(Object.keys(CENTERS) as CenterId[]).map((centerId) => (
          <CenterEl
            key={centerId}
            center={centerId}
            isDefined={definedCenters.has(centerId)}
            isMind={centerId === "head" || centerId === "ajna"}
          />
        ))}

        {/* Channel lines — gate to gate, offset to start/end at gate edges */}
        {UNIQUE_CHANNELS.map((ch) => {
          const from = GATE_POS[ch.gates[0]];
          const to = GATE_POS[ch.gates[1]];
          if (!from || !to) return null;

          // Trim line so it stops at the gate circle edge
          const dx = to[0] - from[0];
          const dy = to[1] - from[1];
          const len = Math.hypot(dx, dy) || 1;
          const ux = dx / len;
          const uy = dy / len;
          const pad = GATE_R + 1;
          const x1 = from[0] + ux * pad;
          const y1 = from[1] + uy * pad;
          const x2 = to[0] - ux * pad;
          const y2 = to[1] - uy * pad;

          const isActive = activeChannels.some((a) => a.id === ch.id);
          const oneSide = gateSet.has(ch.gates[0]) !== gateSet.has(ch.gates[1]);

          return (
            <line
              key={ch.id}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke={
                isActive
                  ? "hsl(24, 90%, 60%)"
                  : oneSide
                    ? "hsl(24, 60%, 72%)"
                    : "hsl(215, 25%, 80%)"
              }
              strokeWidth={isActive ? 3 : 1.2}
              strokeOpacity={isActive ? 0.95 : oneSide ? 0.55 : 0.35}
              filter={isActive ? "url(#glow)" : undefined}
              strokeLinecap="round"
            />
          );
        })}

        {/* Gates on top of channels */}
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
                strokeWidth={1.3}
              />
              <text
                x={cx}
                y={cy + 3.2}
                textAnchor="middle"
                fill={active ? "hsl(0, 0%, 100%)" : "hsl(215, 35%, 30%)"}
                fontSize="9"
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
