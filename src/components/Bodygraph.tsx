import { useMemo } from "react";
import { motion } from "framer-motion";
import { type CenterId, CENTERS, UNIQUE_CHANNELS, getDefinedCenters } from "@/lib/humandesign";

// ─── Center positions for the bodygraph SVG layout ─────────
const CENTER_POS: Record<CenterId, { x: number; y: number; shape: "triangle" | "square" | "diamond" }> = {
  head:    { x: 200, y: 40,  shape: "triangle" },
  ajna:    { x: 200, y: 120, shape: "triangle" },
  throat:  { x: 200, y: 200, shape: "square" },
  g:       { x: 200, y: 300, shape: "diamond" },
  heart:   { x: 115, y: 280, shape: "triangle" },
  sacral:  { x: 200, y: 410, shape: "square" },
  splenic: { x: 100, y: 380, shape: "triangle" },
  solar:   { x: 300, y: 380, shape: "triangle" },
  root:    { x: 200, y: 510, shape: "square" },
};

const CENTER_SIZE = 28;

function CenterShape({
  center,
  isDefined,
  isMind,
}: {
  center: CenterId;
  isDefined: boolean;
  isMind: boolean;
}) {
  const pos = CENTER_POS[center];
  const label = CENTERS[center].label;

  // Colors: defined = filled gradient, open = hollow with high contrast border
  const fillColor = isDefined
    ? isMind
      ? "url(#mindGradient)"
      : "url(#definedGradient)"
    : "transparent";
  const strokeColor = isDefined
    ? isMind
      ? "hsl(260, 50%, 68%)"
      : "hsl(24, 90%, 65%)"
    : "hsl(215, 60%, 72%)";
  const strokeWidth = isDefined ? 2.5 : 2;
  const strokeDash = isDefined ? undefined : "4 3";

  const renderShape = () => {
    switch (pos.shape) {
      case "triangle":
        const s = CENTER_SIZE;
        const points = `${pos.x},${pos.y - s} ${pos.x - s},${pos.y + s * 0.6} ${pos.x + s},${pos.y + s * 0.6}`;
        return (
          <polygon
            points={points}
            fill={fillColor}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            strokeDasharray={strokeDash}
          />
        );
      case "square":
        return (
          <rect
            x={pos.x - CENTER_SIZE}
            y={pos.y - CENTER_SIZE}
            width={CENTER_SIZE * 2}
            height={CENTER_SIZE * 2}
            rx={4}
            fill={fillColor}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            strokeDasharray={strokeDash}
          />
        );
      case "diamond":
        const d = CENTER_SIZE;
        const dp = `${pos.x},${pos.y - d} ${pos.x + d},${pos.y} ${pos.x},${pos.y + d} ${pos.x - d},${pos.y}`;
        return (
          <polygon
            points={dp}
            fill={fillColor}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            strokeDasharray={strokeDash}
          />
        );
    }
  };

  return (
    <g className="cursor-pointer">
      {renderShape()}
      <text
        x={pos.x}
        y={pos.y + CENTER_SIZE + 18}
        textAnchor="middle"
        fill={isDefined ? "hsl(24, 90%, 65%)" : "hsl(215, 60%, 72%)"}
        fontSize="10"
        fontFamily="DM Sans, sans-serif"
        fontWeight={isDefined ? "600" : "400"}
      >
        {label}
      </text>
      {!isDefined && (
        <text
          x={pos.x}
          y={pos.y + CENTER_SIZE + 30}
          textAnchor="middle"
          fill="hsl(215, 60%, 72%)"
          fontSize="7"
          fontFamily="DM Sans, sans-serif"
          opacity={0.7}
        >
          OPEN
        </text>
      )}
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

  // Determine active channels
  const activeChannels = useMemo(
    () =>
      UNIQUE_CHANNELS.filter(
        (ch) => gateSet.has(ch.gates[0]) && gateSet.has(ch.gates[1])
      ),
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
        viewBox="0 0 400 580"
        className="w-full max-w-[320px] mx-auto"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="definedGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(24, 90%, 65%)" stopOpacity="0.8" />
            <stop offset="100%" stopColor="hsl(24, 90%, 75%)" stopOpacity="0.5" />
          </linearGradient>
          <linearGradient id="mindGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(260, 50%, 68%)" stopOpacity="0.8" />
            <stop offset="100%" stopColor="hsl(260, 50%, 78%)" stopOpacity="0.5" />
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
              x1={from.x}
              y1={from.y}
              x2={to.x}
              y2={to.y}
              stroke={isActive ? "hsl(24, 90%, 65%)" : "hsl(var(--border))"}
              strokeWidth={isActive ? 3 : 1}
              strokeOpacity={isActive ? 0.9 : 0.25}
              filter={isActive ? "url(#glow)" : undefined}
            />
          );
        })}

        {/* Centers */}
        {(Object.keys(CENTERS) as CenterId[]).map((centerId) => (
          <CenterShape
            key={centerId}
            center={centerId}
            isDefined={definedCenters.has(centerId)}
            isMind={centerId === "head" || centerId === "ajna"}
          />
        ))}
      </svg>
    </motion.div>
  );
};

export default Bodygraph;
