import { useMemo } from "react";
import { motion } from "framer-motion";
import { type CenterId, CENTERS, UNIQUE_CHANNELS, getDefinedCenters } from "@/lib/humandesign";

// ─── Premium Bodygraph (mobile-first, vertically stacked) ──────────────
// Mobile-optimized HD chart. Design column (red) left, Personality (dark)
// right, central SVG between them with all 4 Variable arrows at the top.

const DESIGN_C = "hsl(230 25% 18%)";
const PERSON_C = "hsl(14 78% 56%)";
const NEUTRAL  = "hsl(30 20% 88%)";
const SOFT_BG  = "hsl(30 40% 97%)";

type Shape =
  | { kind: "triangle"; points: [number, number][] }
  | { kind: "rect"; x: number; y: number; w: number; h: number }
  | { kind: "diamond"; cx: number; cy: number; r: number };

export const CENTER_SHAPES: Record<CenterId, { shape: Shape; labelAt: [number, number] }> = {
  head:    { shape: { kind: "triangle", points: [[140, 60], [240, 60], [190, 150]] }, labelAt: [190, 50] },
  ajna:    { shape: { kind: "triangle", points: [[125, 170], [255, 170], [190, 265]] }, labelAt: [190, 282] },
  throat:  { shape: { kind: "rect", x: 140, y: 285, w: 100, h: 110 }, labelAt: [190, 410] },
  g:       { shape: { kind: "diamond", cx: 190, cy: 445, r: 58 }, labelAt: [190, 519] },
  heart:   { shape: { kind: "triangle", points: [[312, 410], [312, 480], [255, 445]] }, labelAt: [320, 495] },
  splenic: { shape: { kind: "triangle", points: [[35, 530], [35, 640], [165, 585]] }, labelAt: [40, 660] },
  sacral:  { shape: { kind: "rect", x: 140, y: 515, w: 100, h: 100 }, labelAt: [190, 630] },
  solar:   { shape: { kind: "triangle", points: [[345, 530], [345, 640], [215, 585]] }, labelAt: [340, 660] },
  root:    { shape: { kind: "rect", x: 140, y: 640, w: 100, h: 85 }, labelAt: [190, 740] },
};

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

// Gate positions — calibrated to fit cleanly INSIDE each center shape.
export const GATE_POS: Record<number, [number, number]> = {
  // HEAD
  64: [168, 92], 61: [190, 80], 63: [212, 92],
  // AJNA
  47: [160, 195], 24: [190, 188], 4:  [220, 195],
  17: [172, 225], 11: [208, 225],
  43: [190, 248],
  // THROAT
  62: [160, 302], 23: [190, 302], 56: [220, 302],
  16: [160, 326], 35: [220, 326],
  20: [160, 352], 45: [200, 352], 12: [225, 352],
  33: [168, 378], 8:  [190, 378], 31: [212, 378],
  // G / SELF (diamond, cx=190 cy=445 r=58)
  1:  [186, 405], 13: [202, 418],
  7:  [186, 432],
  10: [156, 445], 25: [224, 445],
  15: [170, 462], 46: [212, 462],
  2:  [190, 478],
  // HEART (sideways tri, apex left at 255,445)
  21: [296, 422], 51: [300, 444],
  26: [278, 438], 40: [288, 462],
  // SPLEEN (sideways tri, apex right at 165,585)
  48: [56, 548], 44: [64, 575], 32: [64, 605],
  57: [88, 562], 50: [102, 585],
  28: [108, 605], 18: [132, 590],
  // SACRAL (3x3 inside rect x=140..240, y=515..615)
  5:  [160, 535], 14: [190, 535], 29: [220, 535],
  59: [160, 565], 9:  [190, 565], 3:  [220, 565],
  42: [160, 595], 27: [190, 595], 34: [220, 595],
  // SOLAR PLEXUS (sideways tri, apex left at 215,585)
  36: [324, 548], 22: [316, 575], 49: [316, 605],
  6:  [292, 562], 30: [278, 585],
  55: [272, 605], 37: [248, 590],
  // ROOT (3x3 inside rect x=140..240, y=640..725)
  53: [160, 658], 60: [190, 658], 52: [220, 658],
  19: [160, 684], 39: [190, 684], 41: [220, 684],
  58: [160, 710], 38: [190, 710], 54: [220, 710],
};

const GATE_R = 10;

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
  const strokeWidth = isDefined ? 1.8 : 1;

  let el: JSX.Element;
  switch (shape.kind) {
    case "triangle":
      el = <polygon points={shape.points.map((p) => p.join(",")).join(" ")} fill={fillColor} stroke={strokeColor} strokeWidth={strokeWidth} strokeLinejoin="round" />;
      break;
    case "rect":
      el = <rect x={shape.x} y={shape.y} width={shape.w} height={shape.h} rx={5} fill={fillColor} stroke={strokeColor} strokeWidth={strokeWidth} />;
      break;
    case "diamond": {
      const { cx, cy, r } = shape;
      const pts = `${cx},${cy - r} ${cx + r},${cy} ${cx},${cy + r} ${cx - r},${cy}`;
      el = <polygon points={pts} fill={fillColor} stroke={strokeColor} strokeWidth={strokeWidth} strokeLinejoin="round" />;
      break;
    }
  }
  return (
    <g>
      {el}
      <text x={labelAt[0]} y={labelAt[1]} textAnchor="middle" fill={isDefined ? "hsl(230 25% 20%)" : "hsl(230 10% 55%)"} fontSize="8.5" fontFamily="DM Sans, sans-serif" fontWeight={isDefined ? 700 : 500} letterSpacing="0.4">
        {label.toUpperCase()}
      </text>
    </g>
  );
}

function VariableArrow({
  x, y, value, side,
}: { x: number; y: number; value: number; side: "design" | "personality" }) {
  const color = side === "personality" ? PERSON_C : DESIGN_C;
  // value is encoded as color + tone/10; tone 1-3 → arrow points left, 4-6 → right.
  const color1to6 = Math.max(1, Math.min(6, Math.floor(value) || 1));
  const tone = Math.round(((value - Math.floor(value)) * 10)) || 1;
  const dir: "left" | "right" = tone <= 3 ? "left" : "right";
  const w = 38, h = 20;
  const arrow = dir === "right"
    ? `${x},${y - h/2} ${x + w - 10},${y - h/2} ${x + w - 10},${y - h/2 - 4} ${x + w},${y} ${x + w - 10},${y + h/2 + 4} ${x + w - 10},${y + h/2} ${x},${y + h/2}`
    : `${x + w},${y - h/2} ${x + 10},${y - h/2} ${x + 10},${y - h/2 - 4} ${x},${y} ${x + 10},${y + h/2 + 4} ${x + 10},${y + h/2} ${x + w},${y + h/2}`;
  const labelX = dir === "right" ? x + (w - 10) / 2 : x + (w + 10) / 2;
  return (
    <g>
      <polygon points={arrow} fill={color} opacity={0.95} />
      <text x={labelX} y={y + 3.5} textAnchor="middle" fontSize="11" fontWeight="700" fill="white" fontFamily="DM Sans, sans-serif">{color1to6}</text>
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
    digestion: number;
    environment: number;
    motivation?: number;
    perspective: number;
    awareness?: number;
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

  const gateSource = (g: number): "design" | "personality" | "both" | "none" => {
    const d = dGates.has(g), p = pGates.has(g);
    if (d && p) return "both";
    if (d) return "design";
    if (p) return "personality";
    return "none";
  };
  const colorFor = (src: ReturnType<typeof gateSource>) =>
    src === "personality" ? PERSON_C : src === "none" ? NEUTRAL : DESIGN_C;

  const fmt = (g: number, line: number) => `${g}.${line}`;

  // ── Render planet rows as HTML boxes (better mobile responsiveness) ──
  const PlanetCol = ({ side }: { side: "design" | "personality" }) => {
    const list = side === "design" ? dPlanets : pPlanets;
    const colorClass = side === "design" ? "text-foreground" : "text-[hsl(14,78%,50%)]";
    return (
      <div className="flex flex-col gap-1 w-[68px] sm:w-[80px] shrink-0">
        <div className={`text-[10px] font-bold tracking-wider text-center mb-0.5 ${side === "design" ? "text-foreground" : "text-[hsl(14,78%,50%)]"}`}>
          {side === "design" ? "DESIGN" : "PERSONALITY"}
        </div>
        {PLANETS.map((p, i) => {
          const item = list[i];
          return (
            <div
              key={p.name}
              className={`flex items-center justify-between border border-border/60 rounded-md px-1.5 py-1 bg-card/70 ${colorClass}`}
            >
              <span className="text-[12px] leading-none">{p.glyph}</span>
              <span className="text-[10px] font-semibold leading-none">
                {item ? fmt(item.gate, item.line) : "—"}
              </span>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className={className}
    >
      <div className="flex items-start gap-1.5 sm:gap-3 justify-center">
        <PlanetCol side="design" />

        <div className="flex-1 min-w-0 max-w-[440px]">
          <svg viewBox="0 0 380 760" className="w-full block" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="splitStripe" patternUnits="userSpaceOnUse" width="6" height="6" patternTransform="rotate(45)">
                <rect width="3" height="6" fill={DESIGN_C} />
                <rect x="3" width="3" height="6" fill={PERSON_C} />
              </pattern>
            </defs>

            {/* ── 4 Variable arrows at top: Design (dark) top, Personality (red) below ── */}
            <VariableArrow x={6}   y={92}  value={vars.digestion}   side="design" />
            <VariableArrow x={336} y={92}  value={vars.environment} side="design" />
            <VariableArrow x={6}   y={210} value={motivationVal}    side="personality" />
            <VariableArrow x={336} y={210} value={vars.perspective} side="personality" />

            {/* Channels (under centers) */}
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

              const c0 = colorFor(s0);
              const c1 = colorFor(s1);
              const sw0 = s0 === "none" ? 1.5 : bothActive ? 5 : 4;
              const sw1 = s1 === "none" ? 1.5 : bothActive ? 5 : 4;
              const op0 = s0 === "none" ? 0.3 : 0.95;
              const op1 = s1 === "none" ? 0.3 : 0.95;

              return (
                <g key={ch.id}>
                  <line x1={x1} y1={y1} x2={mx} y2={my} stroke={c0} strokeWidth={sw0} strokeOpacity={op0} strokeLinecap="butt" />
                  <line x1={mx} y1={my} x2={x2} y2={y2} stroke={c1} strokeWidth={sw1} strokeOpacity={op1} strokeLinecap="butt" />
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
              let strokeW = 1;
              if (src === "both") {
                fill = "url(#splitStripe)"; stroke = DESIGN_C; textFill = "white"; strokeW = 1.4;
              } else if (src === "personality") {
                fill = PERSON_C; stroke = "hsl(14 65% 42%)"; textFill = "white"; strokeW = 1.2;
              } else if (src === "design") {
                fill = DESIGN_C; stroke = "black"; textFill = "white"; strokeW = 1.2;
              }
              return (
                <g key={gateNum}>
                  <circle cx={cx} cy={cy} r={GATE_R} fill={fill} stroke={stroke} strokeWidth={strokeW} />
                  <text x={cx} y={cy + 3} textAnchor="middle" fill={textFill} fontSize="8.5" fontFamily="DM Sans, sans-serif" fontWeight="700" pointerEvents="none">
                    {gateNum}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        <PlanetCol side="personality" />
      </div>
    </motion.div>
  );
};

export default Bodygraph;
