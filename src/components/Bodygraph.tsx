import { useMemo } from "react";
import { motion } from "framer-motion";
import { type CenterId, CENTERS, UNIQUE_CHANNELS, getDefinedCenters } from "@/lib/humandesign";

// ─── Center positions for the bodygraph SVG layout ─────────
const CENTER_POS: Record<CenterId, { x: number; y: number; shape: "triangle" | "square" | "diamond"; size: number }> = {
  head:    { x: 260, y: 70,  shape: "triangle", size: 58 },
  ajna:    { x: 260, y: 200, shape: "triangle", size: 58 },
  throat:  { x: 260, y: 320, shape: "square",   size: 56 },
  g:       { x: 260, y: 450, shape: "diamond",  size: 56 },
  heart:   { x: 130, y: 430, shape: "triangle", size: 46 },
  sacral:  { x: 260, y: 580, shape: "square",   size: 56 },
  splenic: { x: 100, y: 560, shape: "triangle", size: 50 },
  solar:   { x: 420, y: 560, shape: "triangle", size: 50 },
  root:    { x: 260, y: 720, shape: "square",   size: 56 },
};

// Gate positions (offset within each center). Approximated to fit inside shape.
const GATE_OFFSETS: Record<number, [number, number]> = {
  // Head (triangle up) — 64, 61, 63
  64: [-26, 10], 61: [0, -8], 63: [26, 10],
  // Ajna — 47, 24, 4, 17, 43, 11
  47: [-30, 12], 24: [-10, -8], 4: [-30, -8], 17: [30, 12], 43: [10, -8], 11: [30, -8],
  // Throat — 62, 23, 56, 35, 12, 45, 33, 8, 31, 20, 16
  62: [-38, -28], 23: [-18, -28], 56: [38, -28],
  35: [-38, -8], 12: [-18, -8], 45: [0, -8],
  33: [-38, 12], 8: [-18, 12], 31: [38, 12],
  20: [18, -8], 16: [38, -8],
  // G — 7, 1, 13, 25, 46, 2, 15, 10
  7: [-22, 22], 1: [0, 28], 13: [22, 22],
  25: [-30, 0], 46: [30, 0],
  2: [-22, -22], 15: [0, -28], 10: [22, -22],
  // Heart (triangle) — 21, 51, 26, 40
  21: [-14, -10], 51: [14, -10], 26: [-14, 14], 40: [14, 14],
  // Sacral — 5, 14, 29, 59, 9, 3, 42, 27, 34
  5: [-36, -28], 14: [0, -28], 29: [36, -28],
  59: [-36, 0], 9: [0, 0], 3: [36, 0],
  42: [-36, 28], 27: [0, 28], 34: [36, 28],
  // Spleen — 48, 57, 44, 50, 32, 28, 18
  48: [-20, -16], 57: [10, -8], 44: [-20, 4], 50: [10, 12], 32: [-20, 24], 28: [10, 32], 18: [-8, -28],
  // Solar — 6, 37, 22, 36, 30, 55, 49
  6: [-12, -28], 37: [12, -16], 22: [-12, 0], 36: [12, 4], 30: [-12, 18], 55: [12, 24], 49: [0, 32],
  // Root — 53, 60, 52, 19, 39, 41, 58, 38, 54
  53: [-36, -22], 60: [0, -22], 52: [36, -22],
  19: [-36, 0], 39: [0, 0], 41: [36, 0],
  58: [-36, 22], 38: [0, 22], 54: [36, 22],
};

const GATE_RADIUS = 9;

function CenterShape({
  center,
  isDefined,
  isMind,
  definedGateSet,
}: {
  center: CenterId;
  isDefined: boolean;
  isMind: boolean;
  definedGateSet: Set<number>;
}) {
  const pos = CENTER_POS[center];
  const label = CENTERS[center].label;
  const size = pos.size;

  const fillColor = isDefined
    ? isMind ? "url(#mindGradient)" : "url(#definedGradient)"
    : "transparent";
  const strokeColor = isDefined
    ? isMind ? "hsl(260, 50%, 68%)" : "hsl(24, 90%, 65%)"
    : "hsl(215, 60%, 72%)";
  const strokeWidth = isDefined ? 2.5 : 2;
  const strokeDash = isDefined ? undefined : "4 3";

  const renderShape = () => {
    switch (pos.shape) {
      case "triangle": {
        const points = `${pos.x},${pos.y - size} ${pos.x - size},${pos.y + size * 0.7} ${pos.x + size},${pos.y + size * 0.7}`;
        return <polygon points={points} fill={fillColor} stroke={strokeColor} strokeWidth={strokeWidth} strokeDasharray={strokeDash} />;
      }
      case "square":
        return (
          <rect
            x={pos.x - size} y={pos.y - size}
            width={size * 2} height={size * 2}
            rx={6}
            fill={fillColor} stroke={strokeColor}
            strokeWidth={strokeWidth} strokeDasharray={strokeDash}
          />
        );
      case "diamond": {
        const dp = `${pos.x},${pos.y - size} ${pos.x + size},${pos.y} ${pos.x},${pos.y + size} ${pos.x - size},${pos.y}`;
        return <polygon points={dp} fill={fillColor} stroke={strokeColor} strokeWidth={strokeWidth} strokeDasharray={strokeDash} />;
      }
    }
  };

  return (
    <g>
      {renderShape()}

      {/* Gates inside the center */}
      {CENTERS[center].gates.map((gateNum) => {
        const offset = GATE_OFFSETS[gateNum];
        if (!offset) return null;
        const [dx, dy] = offset;
        const cx = pos.x + dx;
        const cy = pos.y + dy;
        const gateActive = definedGateSet.has(gateNum);
        return (
          <g key={gateNum}>
            <circle
              cx={cx}
              cy={cy}
              r={GATE_RADIUS}
              fill={gateActive ? "hsl(24, 90%, 60%)" : "hsl(0, 0%, 100%)"}
              stroke={gateActive ? "hsl(24, 90%, 45%)" : "hsl(215, 30%, 60%)"}
              strokeWidth={1.2}
            />
            <text
              x={cx}
              y={cy + 3}
              textAnchor="middle"
              fill={gateActive ? "hsl(0, 0%, 100%)" : "hsl(215, 30%, 35%)"}
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

      {/* Label */}
      <text
        x={pos.x}
        y={pos.y + size + 16}
        textAnchor="middle"
        fill={isDefined ? "hsl(24, 90%, 55%)" : "hsl(215, 40%, 55%)"}
        fontSize="11"
        fontFamily="DM Sans, sans-serif"
        fontWeight={isDefined ? "600" : "400"}
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
      <svg viewBox="0 0 520 800" className="w-full max-w-[420px] mx-auto" xmlns="http://www.w3.org/2000/svg">
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

        {/* Channel lines */}
        {UNIQUE_CHANNELS.map((ch) => {
          const from = CENTER_POS[ch.centers[0]];
          const to = CENTER_POS[ch.centers[1]];
          const isActive = activeChannels.some((a) => a.id === ch.id);
          return (
            <line
              key={ch.id}
              x1={from.x} y1={from.y}
              x2={to.x} y2={to.y}
              stroke={isActive ? "hsl(24, 90%, 65%)" : "hsl(var(--border))"}
              strokeWidth={isActive ? 3 : 1}
              strokeOpacity={isActive ? 0.9 : 0.2}
              filter={isActive ? "url(#glow)" : undefined}
            />
          );
        })}

        {/* Centers (rendered after lines so they sit on top) */}
        {(Object.keys(CENTERS) as CenterId[]).map((centerId) => (
          <CenterShape
            key={centerId}
            center={centerId}
            isDefined={definedCenters.has(centerId)}
            isMind={centerId === "head" || centerId === "ajna"}
            definedGateSet={gateSet}
          />
        ))}
      </svg>
    </motion.div>
  );
};

export default Bodygraph;
