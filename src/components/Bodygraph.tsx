import { useMemo } from "react";
import { motion } from "framer-motion";
import { type CenterId, CENTERS, UNIQUE_CHANNELS, getDefinedCenters } from "@/lib/humandesign";

// ─── Center positions for the bodygraph SVG layout ─────────
const CENTER_POS: Record<CenterId, { x: number; y: number; shape: "triangle" | "square" | "diamond" }> = {
  head:    { x: 240, y: 60,  shape: "triangle" },
  ajna:    { x: 240, y: 160, shape: "triangle" },
  throat:  { x: 240, y: 260, shape: "square" },
  g:       { x: 240, y: 370, shape: "diamond" },
  heart:   { x: 140, y: 350, shape: "triangle" },
  sacral:  { x: 240, y: 490, shape: "square" },
  splenic: { x: 110, y: 470, shape: "triangle" },
  solar:   { x: 370, y: 470, shape: "triangle" },
  root:    { x: 240, y: 610, shape: "square" },
};

const CENTER_SIZE = 44;
const GATE_R = 9;

// Classify channels: mind lines connect head/ajna/throat upper triad;
// body lines connect everything from G downward.
const MIND_CENTERS = new Set<CenterId>(["head", "ajna", "throat"]);
function isMindChannel(centers: [CenterId, CenterId]) {
  return MIND_CENTERS.has(centers[0]) && MIND_CENTERS.has(centers[1]);
}

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

  const fillColor = isDefined
    ? isMind
      ? "url(#mindGradient)"
      : "url(#definedGradient)"
    : "transparent";
  const strokeColor = isDefined
    ? isMind
      ? "hsl(260, 50%, 68%)"
      : "hsl(24, 90%, 60%)"
    : "hsl(215, 40%, 65%)";
  const strokeWidth = isDefined ? 2.5 : 1.5;
  const strokeDash = isDefined ? undefined : "4 3";

  const renderShape = () => {
    switch (pos.shape) {
      case "triangle": {
        const s = CENTER_SIZE;
        const points = `${pos.x},${pos.y - s} ${pos.x - s},${pos.y + s * 0.6} ${pos.x + s},${pos.y + s * 0.6}`;
        return (
          <polygon points={points} fill={fillColor} stroke={strokeColor} strokeWidth={strokeWidth} strokeDasharray={strokeDash} />
        );
      }
      case "square":
        return (
          <rect
            x={pos.x - CENTER_SIZE}
            y={pos.y - CENTER_SIZE}
            width={CENTER_SIZE * 2}
            height={CENTER_SIZE * 2}
            rx={6}
            fill={fillColor}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            strokeDasharray={strokeDash}
          />
        );
      case "diamond": {
        const d = CENTER_SIZE;
        const dp = `${pos.x},${pos.y - d} ${pos.x + d},${pos.y} ${pos.x},${pos.y + d} ${pos.x - d},${pos.y}`;
        return (
          <polygon points={dp} fill={fillColor} stroke={strokeColor} strokeWidth={strokeWidth} strokeDasharray={strokeDash} />
        );
      }
    }
  };

  return (
    <g>
      {renderShape()}
      <text
        x={pos.x}
        y={pos.y + 4}
        textAnchor="middle"
        fill={isDefined ? "white" : "hsl(215, 35%, 45%)"}
        fontSize="10"
        fontFamily="DM Sans, sans-serif"
        fontWeight="600"
        style={{ pointerEvents: "none" }}
      >
        {label}
      </text>
    </g>
  );
}

// Render small gate numbers around each center perimeter
function GateNumbers({
  center,
  definedGateSet,
}: {
  center: CenterId;
  definedGateSet: Set<number>;
}) {
  const pos = CENTER_POS[center];
  const gates = CENTERS[center].gates;
  const radius = CENTER_SIZE + 14;

  return (
    <g>
      {gates.map((gate, i) => {
        const angle = (i / gates.length) * Math.PI * 2 - Math.PI / 2;
        const gx = pos.x + Math.cos(angle) * radius;
        const gy = pos.y + Math.sin(angle) * radius;
        const active = definedGateSet.has(gate);
        return (
          <g key={gate}>
            <circle
              cx={gx}
              cy={gy}
              r={GATE_R}
              fill={active ? "hsl(24, 90%, 62%)" : "hsl(0, 0%, 100%)"}
              stroke={active ? "hsl(24, 90%, 50%)" : "hsl(215, 30%, 75%)"}
              strokeWidth={1}
            />
            <text
              x={gx}
              y={gy + 3}
              textAnchor="middle"
              fontSize="9"
              fontFamily="DM Sans, sans-serif"
              fontWeight="600"
              fill={active ? "white" : "hsl(215, 35%, 45%)"}
              style={{ pointerEvents: "none" }}
            >
              {gate}
            </text>
          </g>
        );
      })}
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
        viewBox="0 0 480 690"
        className="w-full max-w-[360px] mx-auto"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="definedGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(24, 90%, 65%)" stopOpacity="0.85" />
            <stop offset="100%" stopColor="hsl(24, 90%, 75%)" stopOpacity="0.6" />
          </linearGradient>
          <linearGradient id="mindGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(260, 50%, 68%)" stopOpacity="0.85" />
            <stop offset="100%" stopColor="hsl(260, 50%, 78%)" stopOpacity="0.6" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Channel lines (mind vs body) */}
        {UNIQUE_CHANNELS.map((ch) => {
          const from = CENTER_POS[ch.centers[0]];
          const to = CENTER_POS[ch.centers[1]];
          const mind = isMindChannel(ch.centers);
          const isActive = activeChannels.some((a) => a.id === ch.id);

          const baseStroke = mind ? "hsl(260, 50%, 68%)" : "hsl(24, 90%, 62%)";
          const idleStroke = "hsl(215, 25%, 80%)";

          return (
            <line
              key={ch.id}
              x1={from.x}
              y1={from.y}
              x2={to.x}
              y2={to.y}
              stroke={isActive ? baseStroke : idleStroke}
              strokeWidth={isActive ? 4 : 1.25}
              strokeOpacity={isActive ? 0.95 : 0.35}
              strokeDasharray={mind ? "6 4" : undefined}
              strokeLinecap="round"
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

        {/* Gate numbers — rendered on top of centers */}
        {(Object.keys(CENTERS) as CenterId[]).map((centerId) => (
          <GateNumbers key={`g-${centerId}`} center={centerId} definedGateSet={gateSet} />
        ))}
      </svg>
    </motion.div>
  );
};

export default Bodygraph;
