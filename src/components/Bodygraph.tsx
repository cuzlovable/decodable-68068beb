import { useMemo } from "react";
import { motion } from "framer-motion";
import { type CenterId, CENTERS, UNIQUE_CHANNELS, getDefinedCenters } from "@/lib/humandesign";

// ─── Bodygraph ──────────────────────────────────────────────────
const DESIGN_C  = "hsl(0 70% 52%)";     // red (Design)
const PERSON_C  = "hsl(220 15% 14%)";   // black (Personality)
const OPEN_GRAY = "hsl(220 12% 72%)";
const CHANNEL_OFF = "hsl(25 18% 86%)";  // soft taupe tube when inactive

// Branded muted pastels with a grayish hue (pastel orange/blue palette family).
const CENTER_COLORS: Record<CenterId, { fill: string; stroke: string }> = {
  head:    { fill: "hsl(40 38% 80%)",  stroke: "hsl(35 28% 55%)"  },
  ajna:    { fill: "hsl(155 22% 76%)", stroke: "hsl(155 22% 50%)" },
  throat:  { fill: "hsl(28 25% 72%)",  stroke: "hsl(28 22% 48%)"  },
  g:       { fill: "hsl(35 45% 80%)",  stroke: "hsl(30 35% 55%)"  },
  heart:   { fill: "hsl(8 45% 72%)",   stroke: "hsl(8 45% 50%)"   },
  splenic: { fill: "hsl(155 22% 76%)", stroke: "hsl(155 22% 50%)" },
  solar:   { fill: "hsl(155 22% 76%)", stroke: "hsl(155 22% 50%)" },
  sacral:  { fill: "hsl(15 50% 76%)",  stroke: "hsl(15 45% 52%)"  },
  root:    { fill: "hsl(18 32% 68%)",  stroke: "hsl(18 30% 45%)"  },
};

type Shape =
  | { kind: "triangle"; points: [number, number][] }
  | { kind: "rect"; x: number; y: number; w: number; h: number }
  | { kind: "diamond"; cx: number; cy: number; r: number };

// Canvas 560x800 — generous spacing between centers; Ego is the smallest shape.
export const CENTER_SHAPES: Record<CenterId, { shape: Shape; labelAt: [number, number] }> = {
  head:    { shape: { kind: "triangle", points: [[280, 40], [240, 110], [320, 110]] }, labelAt: [280, 95] },
  ajna:    { shape: { kind: "triangle", points: [[240, 130], [320, 130], [280, 200]] }, labelAt: [280, 158] },
  throat:  { shape: { kind: "rect", x: 230, y: 220, w: 100, h: 85 }, labelAt: [280, 265] },
  g:       { shape: { kind: "diamond", cx: 280, cy: 420, r: 55 }, labelAt: [280, 425] },
  // EGO — smallest of the 9 centers; pushed right to clear the 12-22 / 35-36 channel lines.
  heart:   { shape: { kind: "triangle", points: [[460, 400], [438, 450], [485, 450]] }, labelAt: [462, 442] },
  // SPLEEN — apex points right (toward Sacral). Moved further left for spacing.
  splenic: { shape: { kind: "triangle", points: [[50, 545], [50, 630], [190, 587]] }, labelAt: [90, 587] },
  sacral:  { shape: { kind: "rect", x: 230, y: 545, w: 100, h: 85 }, labelAt: [280, 590] },
  // SOLAR — apex points left (toward Sacral). Moved further right.
  solar:   { shape: { kind: "triangle", points: [[510, 545], [510, 630], [370, 587]] }, labelAt: [470, 587] },
  root:    { shape: { kind: "rect", x: 230, y: 680, w: 100, h: 80 }, labelAt: [280, 722] },
};

// All gate dots sit INSIDE the bounds of their parent center shape.
const GATE_POS_INTERNAL: Record<number, [number, number]> = {
  // HEAD
  64: [255, 100], 61: [280, 100], 63: [305, 100],
  // AJNA
  47: [252, 142], 24: [280, 142], 4:  [308, 142],
  17: [262, 168], 11: [298, 168],
  43: [280, 188],
  // THROAT
  62: [250, 235], 23: [280, 235], 56: [310, 235],
  16: [245, 258], 20: [245, 282],
  35: [315, 248], 12: [315, 268], 45: [315, 288],
  31: [250, 295], 8:  [280, 295], 33: [310, 295],
  // G
  1:  [280, 378],
  7:  [256, 392], 13: [304, 392],
  10: [240, 420], 25: [320, 420],
  15: [256, 448], 46: [304, 448],
  2:  [280, 462],
  // EGO / HEART (smallest)
  21: [458, 414], 51: [453, 428], 26: [450, 443],
  40: [475, 443],
  // SPLEEN — top slant 48→44→57 (base→apex), bottom slant 18→28→32 (base→apex), 50 interior
  48: [75, 558], 44: [115, 568], 57: [165, 583],
  50: [125, 587],
  18: [75, 618], 28: [115, 605], 32: [160, 592],
  // SACRAL
  5:  [250, 558], 14: [280, 558], 29: [310, 558],
  34: [245, 583], 27: [245, 608],
  59: [315, 595],
  42: [250, 620], 3:  [280, 620], 9:  [310, 620],
  // SOLAR — top slant 36→22→37 (base→apex), bottom slant 49→55→30 (apex→base), 6 interior
  36: [485, 558], 22: [445, 568], 37: [395, 583],
  6:  [435, 587],
  49: [395, 593], 55: [445, 605], 30: [485, 618],
  // ROOT
  53: [250, 692], 60: [280, 692], 52: [310, 692],
  54: [245, 720], 38: [245, 740], 58: [245, 758],
  19: [315, 720], 39: [315, 740], 41: [315, 758],
};

export const GATE_POS = GATE_POS_INTERNAL;

// All canonical channels render as tubes.
const HIDDEN_CHANNELS = new Set<string>();

function shapeEl(shape: Shape, fill: string, stroke: string, dashed: boolean) {
  const strokeW = dashed ? 1.5 : 2;
  const dash = dashed ? "5 4" : undefined;
  switch (shape.kind) {
    case "triangle":
      return (
        <polygon
          points={shape.points.map((p) => p.join(",")).join(" ")}
          fill={fill} stroke={stroke} strokeWidth={strokeW}
          strokeLinejoin="round" strokeDasharray={dash}
        />
      );
    case "rect":
      return (
        <rect x={shape.x} y={shape.y} width={shape.w} height={shape.h} rx={4}
          fill={fill} stroke={stroke} strokeWidth={strokeW} strokeDasharray={dash} />
      );
    case "diamond": {
      const { cx, cy, r } = shape;
      const pts = `${cx},${cy - r} ${cx + r},${cy} ${cx},${cy + r} ${cx - r},${cy}`;
      return (
        <polygon points={pts} fill={fill} stroke={stroke} strokeWidth={strokeW}
          strokeLinejoin="round" strokeDasharray={dash} />
      );
    }
  }
}

function CenterEl({ center, isDefined }: { center: CenterId; isDefined: boolean }) {
  const { shape, labelAt } = CENTER_SHAPES[center];
  const { fill, stroke } = CENTER_COLORS[center];
  return (
    <g>
      {shapeEl(
        shape,
        isDefined ? fill : "transparent",
        isDefined ? stroke : OPEN_GRAY,
        !isDefined,
      )}
      <text
        x={labelAt[0]} y={labelAt[1]}
        textAnchor="middle"
        fill="hsl(230 20% 30%)"
        fontSize="10"
        fontFamily="DM Sans, sans-serif"
        fontWeight={600}
        opacity={0.7}
      >
        {CENTERS[center].label.toLowerCase()}
      </text>
    </g>
  );
}

function GateEl({
  gate, point, activeGates, designSet, personalitySet,
}: {
  gate: number;
  point: [number, number];
  activeGates: Set<number>;
  designSet: Set<number>;
  personalitySet: Set<number>;
}) {
  const isActive = activeGates.has(gate);
  const inDesign = designSet.has(gate);
  const inPersonality = personalitySet.has(gate);
  const fill = !isActive
    ? "hsl(var(--card))"
    : inDesign && inPersonality
      ? "url(#gateSplit)"
      : inDesign ? DESIGN_C : PERSON_C;
  const stroke = isActive ? fill : "hsl(220 15% 62%)";
  const textFill = isActive ? "hsl(var(--primary-foreground))" : "hsl(220 15% 35%)";
  return (
    <g>
      <circle cx={point[0]} cy={point[1]} r={7.5} fill={fill} stroke={stroke} strokeWidth={1.2} />
      <text x={point[0]} y={point[1] + 2.8} textAnchor="middle" fill={textFill}
        fontSize={gate >= 10 ? 6.8 : 7.8}
        fontFamily="DM Sans, sans-serif" fontWeight={700} pointerEvents="none">
        {gate}
      </text>
    </g>
  );
}

// Tube-style channel: two thick parallel offset lines, split-colored at midpoint.
function TubeChannel({
  a, b, color1, color2, active,
}: {
  a: [number, number]; b: [number, number];
  color1: string; color2: string; active: boolean;
}) {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const len = Math.hypot(dx, dy) || 1;
  const offset = active ? 3.2 : 2.8;
  const ox = (-dy / len) * offset;
  const oy = (dx / len) * offset;
  const mx = (a[0] + b[0]) / 2;
  const my = (a[1] + b[1]) / 2;
  const sw = active ? 4.5 : 3.2;
  const opacity = active ? 1 : 0.6;
  return (
    <g opacity={opacity} strokeLinecap="round">
      <line x1={a[0] + ox} y1={a[1] + oy} x2={mx + ox} y2={my + oy}
        stroke={color1} strokeWidth={sw} />
      <line x1={mx + ox} y1={my + oy} x2={b[0] + ox} y2={b[1] + oy}
        stroke={color2} strokeWidth={sw} />
      <line x1={a[0] - ox} y1={a[1] - oy} x2={mx - ox} y2={my - oy}
        stroke={color1} strokeWidth={sw} />
      <line x1={mx - ox} y1={my - oy} x2={b[0] - ox} y2={b[1] - oy}
        stroke={color2} strokeWidth={sw} />
    </g>
  );
}

// ─── Variable arrows (PHS) ───────────────────────────────────────
function VariableArrow({
  value, side, dirHint,
}: { value?: number; side: "design" | "personality"; dirHint?: "left" | "right" }) {
  const color = side === "personality" ? PERSON_C : DESIGN_C;
  const v = typeof value === "number" ? value : 0;
  const color1to6 = Math.max(1, Math.min(6, Math.floor(v) || 1));
  const tone = Math.round(((v - Math.floor(v)) * 10)) || 1;
  const dir = dirHint ?? (tone <= 3 ? "left" : "right");
  return (
    <div className="flex items-center gap-1 tabular-nums">
      {dir === "left" && <span style={{ color }} className="text-base leading-none">◀</span>}
      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold text-white"
        style={{ background: color }}>{color1to6}</span>
      <span className="text-[10px] font-semibold" style={{ color }}>.{tone}</span>
      {dir === "right" && <span style={{ color }} className="text-base leading-none">▶</span>}
    </div>
  );
}

const PLANETS: { name: string; glyph: string }[] = [
  { name: "Sun", glyph: "☉" }, { name: "Earth", glyph: "⊕" },
  { name: "N. Node", glyph: "☊" }, { name: "S. Node", glyph: "☋" },
  { name: "Moon", glyph: "☽" }, { name: "Mercury", glyph: "☿" },
  { name: "Venus", glyph: "♀" }, { name: "Mars", glyph: "♂" },
  { name: "Jupiter", glyph: "♃" }, { name: "Saturn", glyph: "♄" },
  { name: "Uranus", glyph: "♅" }, { name: "Neptune", glyph: "♆" },
  { name: "Pluto", glyph: "♇" },
];

const PLANET_ALIASES: Record<string, string[]> = {
  Sun: ["sun"], Earth: ["earth"],
  "N. Node": ["north node", "n. node", "north_node", "northnode", "n.node"],
  "S. Node": ["south node", "s. node", "south_node", "southnode", "s.node"],
  Moon: ["moon"], Mercury: ["mercury"], Venus: ["venus"], Mars: ["mars"],
  Jupiter: ["jupiter"], Saturn: ["saturn"], Uranus: ["uranus"],
  Neptune: ["neptune"], Pluto: ["pluto"],
};
const normName = (s?: string) => (s ?? "").toLowerCase().replace(/[._\s-]+/g, " ").trim();
function sortByCanonical(list?: Array<{ gate: number; line: number; planet?: string }>) {
  const out: Array<{ gate: number; line: number; planet?: string } | null> = PLANETS.map(() => null);
  if (!list) return out;
  for (const item of list) {
    const n = normName(item.planet);
    for (let i = 0; i < PLANETS.length; i++) {
      const canon = PLANETS[i].name;
      if (PLANET_ALIASES[canon].includes(n) || normName(canon) === n) { out[i] = item; break; }
    }
  }
  return out;
}

function PlanetCol({
  side, items,
}: {
  side: "design" | "personality";
  items: Array<{ gate: number; line: number; planet?: string } | null>;
}) {
  const color = side === "personality" ? PERSON_C : DESIGN_C;
  const align = side === "personality" ? "items-end text-right" : "items-start text-left";
  return (
    <div className={`flex flex-col gap-1 ${align} text-[11px]`} style={{ color }}>
      <div className="font-bold uppercase tracking-wider text-[10px] mb-1">
        {side === "personality" ? "Personality" : "Design"}
      </div>
      {PLANETS.map((p, i) => {
        const v = items[i];
        return (
          <div key={p.name} className="flex items-center gap-1.5 leading-tight">
            {side === "personality" ? (
              <>
                <span className="tabular-nums">{v ? `${v.gate}.${v.line}` : "—"}</span>
                <span className="w-4 text-center">{p.glyph}</span>
              </>
            ) : (
              <>
                <span className="w-4 text-center">{p.glyph}</span>
                <span className="tabular-nums">{v ? `${v.gate}.${v.line}` : "—"}</span>
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}

interface BodygraphProps {
  definedGates: number[];
  designGates?: number[];
  personalityGates?: number[];
  designPlanets?: Array<{ gate: number; line: number; planet?: string }>;
  personalityPlanets?: Array<{ gate: number; line: number; planet?: string }>;
  variables?: Record<string, number>;
  className?: string;
}

const Bodygraph = ({
  definedGates, designGates, personalityGates,
  designPlanets, personalityPlanets, variables,
  className = "",
}: BodygraphProps) => {
  const definedCenters = useMemo(() => getDefinedCenters(definedGates), [definedGates]);
  const designSet = useMemo(() => new Set(designGates ?? []), [designGates]);
  const personalitySet = useMemo(() => new Set(personalityGates ?? []), [personalityGates]);
  const activeGates = useMemo(() => {
    if (designGates || personalityGates) {
      return new Set<number>([...(designGates ?? []), ...(personalityGates ?? [])]);
    }
    return new Set(definedGates);
  }, [designGates, personalityGates, definedGates]);

  const designSorted = useMemo(() => sortByCanonical(designPlanets), [designPlanets]);
  const personalitySorted = useMemo(() => sortByCanonical(personalityPlanets), [personalityPlanets]);

  const v = variables ?? {};
  const digestion   = (v.digestion as number) ?? (v.design_digestion as number);
  const environment = (v.environment as number) ?? (v.design_environment as number);
  const motivation  = (v.motivation as number) ?? (v.personality_motivation as number) ?? (v.awareness as number);
  const perspective = (v.perspective as number) ?? (v.personality_perspective as number) ?? (v.view as number);

  const colorForGate = (g: number) => {
    const inD = designSet.has(g);
    const inP = personalitySet.has(g);
    if (inD && inP) return DESIGN_C;
    if (inD) return DESIGN_C;
    if (inP) return PERSON_C;
    return CHANNEL_OFF;
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
      className={className}
    >
      <div className="flex items-center justify-center gap-12 mb-3">
        <div className="grid grid-cols-1 gap-1.5">
          <VariableArrow value={digestion} side="design" />
          <VariableArrow value={environment} side="design" />
        </div>
        <div className="grid grid-cols-1 gap-1.5">
          <VariableArrow value={motivation} side="personality" />
          <VariableArrow value={perspective} side="personality" />
        </div>
      </div>

      <div className="flex items-start justify-center gap-2">
        <PlanetCol side="design" items={designSorted} />
        <div className="flex-1 max-w-[500px]">
          <svg viewBox="0 0 500 780" className="w-full block" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="gateSplit" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor={DESIGN_C} />
                <stop offset="50%" stopColor={DESIGN_C} />
                <stop offset="50%" stopColor={PERSON_C} />
                <stop offset="100%" stopColor={PERSON_C} />
              </linearGradient>
            </defs>

            {/* Tube channels */}
            {UNIQUE_CHANNELS.map((ch) => {
              const key = [...ch.gates].sort((x, y) => x - y).join("-");
              if (HIDDEN_CHANNELS.has(key)) return null;
              const a = GATE_POS_INTERNAL[ch.gates[0]];
              const b = GATE_POS_INTERNAL[ch.gates[1]];
              if (!a || !b) return null;
              const g1Active = activeGates.has(ch.gates[0]);
              const g2Active = activeGates.has(ch.gates[1]);
              const active = g1Active || g2Active;
              return (
                <TubeChannel
                  key={ch.id}
                  a={a} b={b}
                  color1={g1Active ? colorForGate(ch.gates[0]) : CHANNEL_OFF}
                  color2={g2Active ? colorForGate(ch.gates[1]) : CHANNEL_OFF}
                  active={active}
                />
              );
            })}

            {/* Centers */}
            {(Object.keys(CENTERS) as CenterId[]).map((c) => (
              <CenterEl key={c} center={c} isDefined={definedCenters.has(c)} />
            ))}

            {/* Gates */}
            {Object.entries(GATE_POS_INTERNAL).map(([gate, point]) => (
              <GateEl key={gate} gate={Number(gate)} point={point}
                activeGates={activeGates} designSet={designSet} personalitySet={personalitySet} />
            ))}
          </svg>
        </div>
        <PlanetCol side="personality" items={personalitySorted} />
      </div>
    </motion.div>
  );
};

export default Bodygraph;
