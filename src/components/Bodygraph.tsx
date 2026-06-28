import { useMemo } from "react";
import { motion } from "framer-motion";
import { type CenterId, CENTERS, UNIQUE_CHANNELS, getDefinedCenters } from "@/lib/humandesign";

// ─── Premium Bodygraph ────────────────────────────────────────────
// Brand-aligned, professional Human Design chart.
// Canvas 900 x 1080. Centered chart, planet columns flanking it,
// 4 Variable arrows hugging the Head/Ajna corners.
//
// Color tokens (all from index.css HSL vars):
//   Design / Body         → hsl(var(--foreground))      dark neutral
//   Personality / Mind    → hsl(14 75% 58%)             muted coral (brand-aligned)
//   Undefined center      → transparent w/ soft border
//   Defined centers       → soft, brand-tinted fills

const DESIGN_C = "hsl(230 25% 18%)";       // body / unconscious
const PERSON_C = "hsl(14 78% 56%)";        // mind / conscious — muted coral
const NEUTRAL  = "hsl(30 20% 88%)";        // border / inactive
const SOFT_BG  = "hsl(30 40% 97%)";        // card-like surface

type Shape =
  | { kind: "triangle"; points: [number, number][] }
  | { kind: "rect"; x: number; y: number; w: number; h: number }
  | { kind: "diamond"; cx: number; cy: number; r: number };

const SHIFT_X = 160;
const s = (x: number) => x + SHIFT_X;

export const CENTER_SHAPES: Record<CenterId, { shape: Shape; labelAt: [number, number] }> = {
  head: {
    shape: { kind: "triangle", points: [[s(200), 60], [s(400), 60], [s(300), 195]] },
    labelAt: [s(300), 46],
  },
  ajna: {
    shape: { kind: "triangle", points: [[s(180), 215], [s(420), 215], [s(300), 365]] },
    labelAt: [s(300), 385],
  },
  throat: {
    shape: { kind: "rect", x: s(210), y: 375, w: 180, h: 110 },
    labelAt: [s(300), 503],
  },
  g: {
    shape: { kind: "diamond", cx: s(300), cy: 560, r: 78 },
    labelAt: [s(300), 657],
  },
  heart: {
    shape: { kind: "triangle", points: [[s(445), 510], [s(445), 590], [s(380), 550]] },
    labelAt: [s(478), 605],
  },
  splenic: {
    shape: { kind: "triangle", points: [[s(45), 645], [s(45), 775], [s(218), 710]] },
    labelAt: [s(45), 800],
  },
  sacral: {
    shape: { kind: "rect", x: s(220), y: 665, w: 160, h: 125 },
    labelAt: [s(300), 808],
  },
  solar: {
    shape: { kind: "triangle", points: [[s(555), 645], [s(555), 775], [s(382), 710]] },
    labelAt: [s(555), 800],
  },
  root: {
    shape: { kind: "rect", x: s(220), y: 820, w: 160, h: 110 },
    labelAt: [s(300), 950],
  },
};

// Soft, brand-tuned defined center palette (light, harmonious)
const CENTER_PALETTE: Record<CenterId, { fill: string; stroke: string }> = {
  head:    { fill: "hsl(45 75% 88%)",  stroke: "hsl(40 50% 60%)"  },
  ajna:    { fill: "hsl(140 35% 78%)", stroke: "hsl(140 30% 45%)" },
  throat:  { fill: "hsl(25 30% 70%)",  stroke: "hsl(25 30% 38%)"  },
  g:       { fill: "hsl(45 80% 82%)",  stroke: "hsl(40 55% 55%)"  },
  heart:   { fill: "hsl(14 72% 72%)",  stroke: "hsl(14 65% 45%)"  },
  sacral:  { fill: "hsl(14 75% 75%)",  stroke: "hsl(14 65% 48%)"  },
  splenic: { fill: "hsl(25 30% 68%)",  stroke: "hsl(25 30% 38%)"  },
  solar:   { fill: "hsl(35 75% 78%)",  stroke: "hsl(30 55% 48%)"  },
  root:    { fill: "hsl(25 30% 68%)",  stroke: "hsl(25 30% 38%)"  },
};

// Gate positions — kept aligned so channels are parallel & uncrossed
export const GATE_POS: Record<number, [number, number]> = {
  // HEAD (downward triangle, apex at bottom)
  64: [s(250), 95], 61: [s(300), 80], 63: [s(350), 95],
  // AJNA (downward triangle)
  47: [s(250), 235], 24: [s(300), 220], 4:  [s(350), 235],
  17: [s(270), 318], 43: [s(300), 335], 11: [s(330), 318],
  // THROAT
  62: [s(250), 395], 23: [s(300), 395], 56: [s(350), 395],
  35: [s(225), 430], 12: [s(225), 460],
  45: [s(335), 430],
  16: [s(375), 430], 20: [s(375), 460],
  33: [s(255), 472], 8:  [s(300), 472], 31: [s(345), 472],
  // G / SELF (diamond)
  13: [s(258), 510], 1:  [s(300), 495], 7:  [s(342), 510],
  2:  [s(248), 545], 46: [s(352), 545],
  15: [s(248), 580], 10: [s(352), 580],
  25: [s(300), 620],
  // HEART
  40: [s(403), 538], 26: [s(425), 555], 21: [s(425), 522], 51: [s(442), 545],
  // SPLEEN (sideways triangle, apex pointing right)
  48: [s(70), 670], 44: [s(70), 710], 32: [s(70), 750],
  28: [s(115), 690], 50: [s(115), 730],
  18: [s(155), 710], 57: [s(195), 710],
  // SACRAL — 3×3
  5:  [s(258), 695], 14: [s(300), 695], 29: [s(342), 695],
  59: [s(258), 728], 9:  [s(300), 728], 3:  [s(342), 728],
  42: [s(258), 762], 27: [s(300), 762], 34: [s(342), 762],
  // SOLAR PLEXUS (sideways triangle, apex pointing left)
  36: [s(530), 670], 22: [s(530), 710], 49: [s(530), 750],
  6:  [s(485), 690], 30: [s(485), 730],
  37: [s(445), 710], 55: [s(405), 710],
  // ROOT — 3×3
  53: [s(258), 845], 60: [s(300), 845], 52: [s(342), 845],
  19: [s(258), 875], 39: [s(300), 875], 41: [s(342), 875],
  58: [s(258), 905], 38: [s(300), 905], 54: [s(342), 905],
};

const GATE_R = 11;

const PLANETS = [
  { glyph: "☉", name: "Sun" },
  { glyph: "⊕", name: "Earth" },
  { glyph: "☊", name: "N. Node" },
  { glyph: "☋", name: "S. Node" },
  { glyph: "☽", name: "Moon" },
  { glyph: "☿", name: "Mercury" },
  { glyph: "♀", name: "Venus" },
  { glyph: "♂", name: "Mars" },
  { glyph: "♃", name: "Jupiter" },
  { glyph: "♄", name: "Saturn" },
  { glyph: "⛢", name: "Uranus" },
  { glyph: "♆", name: "Neptune" },
  { glyph: "♇", name: "Pluto" },
];

function CenterEl({ center, isDefined }: { center: CenterId; isDefined: boolean }) {
  const { shape, labelAt } = CENTER_SHAPES[center];
  const label = CENTERS[center].label;
  const palette = CENTER_PALETTE[center];

  const fillColor = isDefined ? palette.fill : SOFT_BG;
  const strokeColor = isDefined ? palette.stroke : NEUTRAL;
  const strokeWidth = isDefined ? 2 : 1.2;

  let el: JSX.Element;
  switch (shape.kind) {
    case "triangle":
      el = (
        <polygon
          points={shape.points.map((p) => p.join(",")).join(" ")}
          fill={fillColor}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeLinejoin="round"
        />
      );
      break;
    case "rect":
      el = (
        <rect
          x={shape.x} y={shape.y} width={shape.w} height={shape.h}
          rx={6}
          fill={fillColor} stroke={strokeColor} strokeWidth={strokeWidth}
        />
      );
      break;
    case "diamond": {
      const { cx, cy, r } = shape;
      const pts = `${cx},${cy - r} ${cx + r},${cy} ${cx},${cy + r} ${cx - r},${cy}`;
      el = (
        <polygon points={pts} fill={fillColor} stroke={strokeColor} strokeWidth={strokeWidth} strokeLinejoin="round" />
      );
      break;
    }
  }

  return (
    <g>
      {el}
      <text
        x={labelAt[0]} y={labelAt[1]} textAnchor="middle"
        fill={isDefined ? "hsl(230 25% 20%)" : "hsl(230 10% 55%)"}
        fontSize="10.5"
        fontFamily="DM Sans, sans-serif"
        fontWeight={isDefined ? 700 : 500}
        letterSpacing="0.5"
      >
        {label.toUpperCase()}
      </text>
    </g>
  );
}

function VariableArrow({
  x, y, dir, label, number, side,
}: {
  x: number; y: number; dir: "left" | "right"; label: string; number: number; side: "design" | "personality";
}) {
  const color = side === "personality" ? PERSON_C : DESIGN_C;
  const w = 44, h = 18;
  const arrow = dir === "right"
    ? `${x},${y - h/2} ${x + w - 14},${y - h/2} ${x + w - 14},${y - h/2 - 5} ${x + w},${y} ${x + w - 14},${y + h/2 + 5} ${x + w - 14},${y + h/2} ${x},${y + h/2}`
    : `${x + w},${y - h/2} ${x + 14},${y - h/2} ${x + 14},${y - h/2 - 5} ${x},${y} ${x + 14},${y + h/2 + 5} ${x + 14},${y + h/2} ${x + w},${y + h/2}`;
  return (
    <g>
      <polygon points={arrow} fill={color} opacity={0.92} />
      <text
        x={x + w/2} y={y + 3.5} textAnchor="middle"
        fontSize="10" fontWeight="700" fill="white" fontFamily="DM Sans, sans-serif"
      >
        {number}
      </text>
      <text
        x={x + w/2} y={y + h + 12} textAnchor="middle"
        fontSize="9" fill={color} fontFamily="DM Sans, sans-serif" fontWeight="600" letterSpacing="0.4"
      >
        {label.toUpperCase()}
      </text>
    </g>
  );
}

function PlanetRow({
  x, y, planet, gateLine, side, align,
}: {
  x: number; y: number; planet: { glyph: string; name: string }; gateLine: string;
  side: "design" | "personality"; align: "left" | "right";
}) {
  const color = side === "personality" ? PERSON_C : DESIGN_C;
  const boxW = 130, boxH = 28;
  const boxX = align === "right" ? x - boxW : x;
  return (
    <g>
      <rect
        x={boxX} y={y - boxH/2} width={boxW} height={boxH} rx={6}
        fill={SOFT_BG} stroke={NEUTRAL} strokeWidth={1}
      />
      <text
        x={boxX + 14} y={y + 5} textAnchor="start"
        fontSize="15" fill={color} fontFamily="serif"
      >
        {planet.glyph}
      </text>
      <text
        x={boxX + boxW - 14} y={y + 5} textAnchor="end"
        fontSize="13" fontFamily="DM Sans, sans-serif" fontWeight="600" fill={color}
      >
        {gateLine}
      </text>
    </g>
  );
}

interface BodygraphProps {
  definedGates: number[];
  designGates?: number[];
  personalityGates?: number[];
  designPlanets?: Array<{ gate: number; line: number; planet?: string }>;
  personalityPlanets?: Array<{ gate: number; line: number; planet?: string }>;
  variables?: {
    digestion: number;      // Design Sun/Earth color  → top-left  (DIG)
    environment: number;    // Design Node color       → top-right (ENV)
    motivation?: number;    // Personality Sun/Earth   → bottom-left  (MOT)
    perspective: number;    // Personality Node color  → bottom-right (VIEW)
    awareness?: number;     // legacy alias for motivation
  };
  className?: string;
}

const Bodygraph = ({
  definedGates,
  designGates,
  personalityGates,
  designPlanets,
  personalityPlanets,
  variables,
  className = "",
}: BodygraphProps) => {
  const definedCenters = useMemo(() => getDefinedCenters(definedGates), [definedGates]);
  const gateSet = useMemo(() => new Set(definedGates), [definedGates]);

  const dGates = useMemo(
    () => new Set(designGates ?? definedGates.filter((_, i) => i % 2 === 0)),
    [designGates, definedGates]
  );
  const pGates = useMemo(
    () => new Set(personalityGates ?? definedGates.filter((_, i) => i % 2 === 1)),
    [personalityGates, definedGates]
  );

  const demoLine = (g: number) => ((g * 7) % 6) + 1;
  const dPlanets = designPlanets ?? Array.from(dGates).slice(0, 13).map((g) => ({ gate: g, line: demoLine(g) }));
  const pPlanets = personalityPlanets ?? Array.from(pGates).slice(0, 13).map((g) => ({ gate: g, line: demoLine(g) }));

  const vars = variables ?? { digestion: 3, environment: 5, motivation: 2, perspective: 4 };
  const motivationVal = vars.motivation ?? vars.awareness ?? 0;

  // Source of a gate: "design" | "personality" | "both" | "none"
  const gateSource = (g: number): "design" | "personality" | "both" | "none" => {
    const d = dGates.has(g), p = pGates.has(g);
    if (d && p) return "both";
    if (d) return "design";
    if (p) return "personality";
    return "none";
  };
  const colorFor = (src: ReturnType<typeof gateSource>) =>
    src === "personality" ? PERSON_C : src === "none" ? NEUTRAL : DESIGN_C;

  const colStartY = 215;
  const rowGap = 38;
  const designColX = 150;       // right edge of left column
  const persColX = s(620);      // left edge of right column

  const fmt = (g: number, line: number) => `${g}.${line}`;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className={className}
    >
      <svg viewBox="0 0 920 1010" className="w-full mx-auto block" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="splitStripe" patternUnits="userSpaceOnUse" width="6" height="6" patternTransform="rotate(45)">
            <rect width="3" height="6" fill={DESIGN_C} />
            <rect x="3" width="3" height="6" fill={PERSON_C} />
          </pattern>
          <filter id="softGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="1.8" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Column headers */}
        <text x={designColX - 65} y={185} textAnchor="middle" fontSize="12" fontWeight="700" fill={DESIGN_C} fontFamily="DM Sans, sans-serif" letterSpacing="1.2">DESIGN</text>
        <text x={designColX - 65} y={200} textAnchor="middle" fontSize="9" fill="hsl(230 10% 50%)" fontFamily="DM Sans, sans-serif">Body · Unconscious</text>
        <text x={persColX + 65} y={185} textAnchor="middle" fontSize="12" fontWeight="700" fill={PERSON_C} fontFamily="DM Sans, sans-serif" letterSpacing="1.2">PERSONALITY</text>
        <text x={persColX + 65} y={200} textAnchor="middle" fontSize="9" fill="hsl(14 50% 50%)" fontFamily="DM Sans, sans-serif">Mind · Conscious</text>

        {/* Planet rows */}
        {PLANETS.map((p, i) => {
          const y = colStartY + i * rowGap;
          const d = dPlanets[i];
          const pp = pPlanets[i];
          return (
            <g key={p.name}>
              <PlanetRow x={designColX} y={y} planet={p} gateLine={d ? fmt(d.gate, d.line) : "—"} side="design" align="right" />
              <PlanetRow x={persColX} y={y} planet={p} gateLine={pp ? fmt(pp.gate, pp.line) : "—"} side="personality" align="left" />
            </g>
          );
        })}

        {/* Variable arrows — 4 corners */}
        {/* TOP = Design (Body). BOTTOM = Personality (Mind). */}
        <VariableArrow x={s(210)} y={30}  dir="left"  label="DIG"  number={vars.digestion}   side="design" />
        <VariableArrow x={s(346)} y={30}  dir="right" label="ENV"  number={vars.environment} side="design" />
        <VariableArrow x={s(210)} y={980} dir="left"  label="MOT"  number={motivationVal}    side="personality" />
        <VariableArrow x={s(346)} y={980} dir="right" label="VIEW" number={vars.perspective} side="personality" />

        {/* Channels (rendered BEFORE centers so they sit underneath) */}
        {UNIQUE_CHANNELS.map((ch) => {
          const from = GATE_POS[ch.gates[0]];
          const to = GATE_POS[ch.gates[1]];
          if (!from || !to) return null;
          const dx = to[0] - from[0];
          const dy = to[1] - from[1];
          const len = Math.hypot(dx, dy) || 1;
          const ux = dx / len, uy = dy / len;
          const pad = GATE_R + 1;
          const x1 = from[0] + ux * pad, y1 = from[1] + uy * pad;
          const x2 = to[0] - ux * pad, y2 = to[1] - uy * pad;
          const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;

          const s0 = gateSource(ch.gates[0]);
          const s1 = gateSource(ch.gates[1]);
          const bothActive = s0 !== "none" && s1 !== "none";

          // Half-segment colors
          const half0Color = colorFor(s0);
          const half1Color = colorFor(s1);
          const sw0 = s0 === "none" ? 2 : bothActive ? 6 : 5;
          const sw1 = s1 === "none" ? 2 : bothActive ? 6 : 5;
          const op0 = s0 === "none" ? 0.35 : 0.95;
          const op1 = s1 === "none" ? 0.35 : 0.95;

          return (
            <g key={ch.id}>
              <line x1={x1} y1={y1} x2={mx} y2={my}
                stroke={half0Color} strokeWidth={sw0} strokeOpacity={op0} strokeLinecap="butt" />
              <line x1={mx} y1={my} x2={x2} y2={y2}
                stroke={half1Color} strokeWidth={sw1} strokeOpacity={op1} strokeLinecap="butt" />
            </g>
          );
        })}

        {/* Centers */}
        {(Object.keys(CENTERS) as CenterId[]).map((centerId) => (
          <CenterEl key={centerId} center={centerId} isDefined={definedCenters.has(centerId)} />
        ))}

        {/* Gates */}
        {Object.entries(GATE_POS).map(([gateStr, [cx, cy]]) => {
          const gateNum = Number(gateStr);
          const src = gateSource(gateNum);
          let fill = "white";
          let stroke = NEUTRAL;
          let textFill = "hsl(230 25% 35%)";
          let strokeW = 1.2;
          if (src === "both") {
            fill = "url(#splitStripe)"; stroke = DESIGN_C; textFill = "white"; strokeW = 1.6;
          } else if (src === "personality") {
            fill = PERSON_C; stroke = "hsl(14 65% 42%)"; textFill = "white"; strokeW = 1.4;
          } else if (src === "design") {
            fill = DESIGN_C; stroke = "black"; textFill = "white"; strokeW = 1.4;
          }
          return (
            <g key={gateNum}>
              <circle cx={cx} cy={cy} r={GATE_R} fill={fill} stroke={stroke} strokeWidth={strokeW} />
              <text
                x={cx} y={cy + 3.3} textAnchor="middle"
                fill={textFill} fontSize="9.5"
                fontFamily="DM Sans, sans-serif" fontWeight="700"
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
