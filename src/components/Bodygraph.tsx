import { useMemo } from "react";
import { motion } from "framer-motion";
import { type CenterId, CENTERS, UNIQUE_CHANNELS, getDefinedCenters } from "@/lib/humandesign";

// ─── Minimal Bodygraph ─────────────────────────────────────────────
// Clean, screenshot-style chart: purple Mind centers (Head/Ajna),
// peach defined body centers, dashed outlines for open with "OPEN"
// label. No gate circles, no planet columns. Data props preserved so
// callers don't break and accuracy stays driven by the chart API.

const MIND       = "hsl(258 55% 70%)";       // lavender / purple
const MIND_SOFT  = "hsl(258 55% 70% / 0.85)";
const BODY       = "hsl(20 85% 70%)";        // peach / orange
const BODY_SOFT  = "hsl(20 85% 70% / 0.95)";
const OPEN_STROKE = "hsl(220 30% 75%)";
const CHANNEL_OFF = "hsl(220 20% 88%)";

type Shape =
  | { kind: "triangle"; points: [number, number][] }
  | { kind: "rect"; x: number; y: number; w: number; h: number }
  | { kind: "diamond"; cx: number; cy: number; r: number };

export const CENTER_SHAPES: Record<CenterId, { shape: Shape; labelAt: [number, number] }> = {
  head:    { shape: { kind: "triangle", points: [[150, 50], [250, 50], [200, 140]] }, labelAt: [200, 162] },
  ajna:    { shape: { kind: "triangle", points: [[150, 260], [250, 260], [200, 170]] }, labelAt: [200, 282] },
  throat:  { shape: { kind: "rect", x: 160, y: 300, w: 80, h: 80 }, labelAt: [200, 398] },
  g:       { shape: { kind: "diamond", cx: 200, cy: 450, r: 48 }, labelAt: [200, 520] },
  heart:   { shape: { kind: "triangle", points: [[270, 420], [270, 480], [218, 450]] }, labelAt: [275, 500] },
  splenic: { shape: { kind: "triangle", points: [[60, 530], [60, 620], [148, 575]] }, labelAt: [80, 645] },
  sacral:  { shape: { kind: "rect", x: 160, y: 525, w: 80, h: 80 }, labelAt: [200, 622] },
  solar:   { shape: { kind: "triangle", points: [[340, 530], [340, 620], [252, 575]] }, labelAt: [320, 645] },
  root:    { shape: { kind: "rect", x: 160, y: 660, w: 80, h: 70 }, labelAt: [200, 748] },
};

// Approximate gate anchor points (used only to route channel line endpoints).
const GATE_POS_INTERNAL: Record<number, [number, number]> = {
  // HEAD
  64: [170, 95], 61: [200, 88], 63: [230, 95],
  // AJNA
  47: [170, 225], 24: [200, 220], 4: [230, 225],
  17: [180, 250], 11: [220, 250], 43: [200, 198],
  // THROAT
  62: [170, 312], 23: [200, 312], 56: [230, 312],
  16: [170, 340], 35: [230, 340],
  20: [170, 360], 31: [230, 360],
  45: [200, 372], 12: [185, 372], 33: [215, 372], 8: [200, 340],
  // G
  1: [200, 415], 13: [218, 442], 7: [200, 432],
  10: [175, 450], 25: [225, 450],
  15: [185, 468], 46: [215, 468], 2: [200, 482],
  // HEART
  21: [262, 432], 51: [262, 460], 26: [240, 442], 40: [240, 462],
  // SPLEEN
  48: [78, 545], 44: [85, 575], 32: [85, 605],
  57: [105, 562], 50: [120, 580], 28: [120, 598], 18: [140, 580],
  // SACRAL
  5: [175, 540], 14: [200, 540], 29: [225, 540],
  59: [175, 565], 9: [200, 565], 3: [225, 565],
  42: [175, 590], 27: [200, 590], 34: [225, 590],
  // SOLAR
  36: [322, 545], 22: [315, 575], 49: [315, 605],
  6: [295, 562], 30: [280, 580], 55: [280, 598], 37: [260, 580],
  // ROOT
  53: [175, 675], 60: [200, 675], 52: [225, 675],
  19: [175, 695], 39: [200, 695], 41: [225, 695],
  58: [175, 715], 38: [200, 715], 54: [225, 715],
};

// Re-export so existing tests stay valid.
export const GATE_POS = GATE_POS_INTERNAL;

const MIND_CENTERS = new Set<CenterId>(["head", "ajna"]);

function shapeEl(shape: Shape, fill: string, stroke: string, dashed: boolean) {
  const strokeW = dashed ? 1.6 : 2;
  const strokeDasharray = dashed ? "5 4" : undefined;
  switch (shape.kind) {
    case "triangle":
      return (
        <polygon
          points={shape.points.map((p) => p.join(",")).join(" ")}
          fill={fill}
          stroke={stroke}
          strokeWidth={strokeW}
          strokeLinejoin="round"
          strokeDasharray={strokeDasharray}
        />
      );
    case "rect":
      return (
        <rect
          x={shape.x}
          y={shape.y}
          width={shape.w}
          height={shape.h}
          rx={4}
          fill={fill}
          stroke={stroke}
          strokeWidth={strokeW}
          strokeDasharray={strokeDasharray}
        />
      );
    case "diamond": {
      const { cx, cy, r } = shape;
      const pts = `${cx},${cy - r} ${cx + r},${cy} ${cx},${cy + r} ${cx - r},${cy}`;
      return (
        <polygon
          points={pts}
          fill={fill}
          stroke={stroke}
          strokeWidth={strokeW}
          strokeLinejoin="round"
          strokeDasharray={strokeDasharray}
        />
      );
    }
  }
}

function CenterEl({ center, isDefined }: { center: CenterId; isDefined: boolean }) {
  const { shape, labelAt } = CENTER_SHAPES[center];
  const label = CENTERS[center].label;
  const isMind = MIND_CENTERS.has(center);

  let fill = "transparent";
  let stroke = OPEN_STROKE;
  let dashed = true;

  if (isDefined) {
    dashed = false;
    if (isMind) {
      fill = MIND_SOFT;
      stroke = MIND;
    } else {
      fill = BODY_SOFT;
      stroke = BODY;
    }
  } else if (isMind) {
    // open mind centers still hint at purple
    stroke = MIND;
  }

  return (
    <g>
      {shapeEl(shape, fill, stroke, dashed)}
      <text
        x={labelAt[0]}
        y={labelAt[1]}
        textAnchor="middle"
        fill="hsl(230 20% 35%)"
        fontSize="11"
        fontFamily="DM Sans, sans-serif"
        fontWeight={600}
      >
        {label}
      </text>
      {!isDefined && (
        <text
          x={labelAt[0]}
          y={labelAt[1] + 12}
          textAnchor="middle"
          fill="hsl(220 30% 60%)"
          fontSize="8"
          fontFamily="DM Sans, sans-serif"
          fontWeight={700}
          letterSpacing="1"
        >
          OPEN
        </text>
      )}
    </g>
  );
}

interface BodygraphProps {
  definedGates: number[];
  designGates?: number[];
  personalityGates?: number[];
  // The following props are accepted to preserve the call signature, but
  // the minimal visual intentionally omits planet/variable side data.
  designPlanets?: Array<{ gate: number; line: number; planet?: string }>;
  personalityPlanets?: Array<{ gate: number; line: number; planet?: string }>;
  variables?: Record<string, number>;
  className?: string;
}

const Bodygraph = ({
  definedGates,
  designGates,
  personalityGates,
  className = "",
}: BodygraphProps) => {
  const defined = useMemo(() => new Set(definedGates), [definedGates]);
  const definedCenters = useMemo(() => getDefinedCenters(definedGates), [definedGates]);

  const activeGates = useMemo(() => {
    if (designGates || personalityGates) {
      return new Set<number>([...(designGates ?? []), ...(personalityGates ?? [])]);
    }
    return defined;
  }, [designGates, personalityGates, defined]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className={`flex justify-center ${className}`}
    >
      <div className="w-full max-w-[420px]">
        <svg viewBox="0 0 400 780" className="w-full block" xmlns="http://www.w3.org/2000/svg">
          {/* Channels — peach when both gates active, soft gray otherwise */}
          {UNIQUE_CHANNELS.map((ch) => {
            const a = GATE_POS_INTERNAL[ch.gates[0]];
            const b = GATE_POS_INTERNAL[ch.gates[1]];
            if (!a || !b) return null;
            const both = activeGates.has(ch.gates[0]) && activeGates.has(ch.gates[1]);
            return (
              <line
                key={ch.id}
                x1={a[0]}
                y1={a[1]}
                x2={b[0]}
                y2={b[1]}
                stroke={both ? BODY : CHANNEL_OFF}
                strokeWidth={both ? 3 : 1}
                strokeOpacity={both ? 0.9 : 0.55}
                strokeLinecap="round"
              />
            );
          })}

          {/* Centers on top of channels */}
          {(Object.keys(CENTERS) as CenterId[]).map((centerId) => (
            <CenterEl
              key={centerId}
              center={centerId}
              isDefined={definedCenters.has(centerId)}
            />
          ))}
        </svg>
      </div>
    </motion.div>
  );
};

export default Bodygraph;
