import { useMemo } from "react";
import { motion } from "framer-motion";
import { type CenterId, CENTERS, UNIQUE_CHANNELS, getDefinedCenters } from "@/lib/humandesign";

// ─── Bodygraph ──────────────────────────────────────────────────
const DESIGN_C  = "hsl(0 75% 55%)";     // red (Design)
const PERSON_C  = "hsl(220 15% 15%)";   // black (Personality)
const OPEN_GRAY = "hsl(220 15% 75%)";
const CHANNEL_OFF = "hsl(220 15% 82%)";

const CENTER_COLORS: Record<CenterId, { fill: string; stroke: string }> = {
  head:    { fill: "hsl(48 95% 60%)",  stroke: "hsl(48 70% 45%)"  },
  ajna:    { fill: "hsl(140 55% 55%)", stroke: "hsl(140 50% 40%)" },
  throat:  { fill: "hsl(35 45% 55%)",  stroke: "hsl(30 35% 35%)"  },
  g:       { fill: "hsl(48 95% 60%)",  stroke: "hsl(48 70% 45%)"  },
  heart:   { fill: "hsl(0 75% 55%)",   stroke: "hsl(0 70% 40%)"   },
  splenic: { fill: "hsl(140 55% 55%)", stroke: "hsl(140 50% 40%)" },
  solar:   { fill: "hsl(140 55% 55%)", stroke: "hsl(140 50% 40%)" },
  sacral:  { fill: "hsl(0 75% 55%)",   stroke: "hsl(0 70% 40%)"   },
  root:    { fill: "hsl(0 75% 55%)",   stroke: "hsl(0 70% 40%)"   },
};

type Shape =
  | { kind: "triangle"; points: [number, number][] }
  | { kind: "rect"; x: number; y: number; w: number; h: number }
  | { kind: "diamond"; cx: number; cy: number; r: number };

// Canvas 500x780 — uniform center sizing.
export const CENTER_SHAPES: Record<CenterId, { shape: Shape; labelAt: [number, number] }> = {
  head:    { shape: { kind: "triangle", points: [[250, 40], [210, 110], [290, 110]] }, labelAt: [250, 95] },
  ajna:    { shape: { kind: "triangle", points: [[210, 130], [290, 130], [250, 200]] }, labelAt: [250, 160] },
  throat:  { shape: { kind: "rect", x: 200, y: 220, w: 100, h: 85 }, labelAt: [250, 265] },
  g:       { shape: { kind: "diamond", cx: 250, cy: 410, r: 55 }, labelAt: [250, 415] },
  // Heart sits clearly right of G — triangle: top apex, left base, right base
  heart:   { shape: { kind: "triangle", points: [[380, 400], [335, 475], [425, 475]] }, labelAt: [380, 460] },
  // Spleen — apex points right toward Sacral
  splenic: { shape: { kind: "triangle", points: [[40, 510], [40, 640], [170, 575]] }, labelAt: [75, 580] },
  sacral:  { shape: { kind: "rect", x: 200, y: 510, w: 100, h: 85 }, labelAt: [250, 555] },
  // Solar — apex points left toward Sacral
  solar:   { shape: { kind: "triangle", points: [[460, 510], [460, 640], [330, 575]] }, labelAt: [425, 580] },
  root:    { shape: { kind: "rect", x: 200, y: 620, w: 100, h: 80 }, labelAt: [250, 660] },
};

// Gates anchored to center outlines per reference image, with straight vertical
// alignment for paired channels and 32/28/18 + 49/55/30 along bottom edges.
const GATE_POS_INTERNAL: Record<number, [number, number]> = {
  // HEAD — base
  64: [218, 110], 61: [250, 110], 63: [282, 110],
  // AJNA — top, sides, apex
  47: [218, 130], 24: [250, 130], 4:  [282, 130],
  17: [225, 165], 11: [275, 165],
  43: [250, 197],
  // THROAT — top row, side cols, bottom row
  62: [225, 220], 23: [250, 220], 56: [275, 220],
  16: [200, 245], 20: [200, 285],
  35: [300, 245], 12: [300, 265], 45: [300, 285],
  31: [220, 305], 8:  [250, 305], 33: [280, 305],
  // G — diamond perimeter
  1:  [250, 360],
  7:  [220, 375], 13: [280, 375],
  10: [197, 420], 25: [303, 410],
  15: [220, 445], 46: [280, 445],
  2:  [250, 463],
  // HEART — 21/51/26 left edge (top→bottom), 40 right apex (per reference)
  21: [378, 418], 51: [358, 448], 26: [346, 472],
  40: [418, 472],
  // SPLEEN — top slant 48/57/44, bottom slant 32/28/18, 50 near apex interior
  48: [50, 522], 57: [95, 548], 44: [140, 572],
  50: [150, 588],
  32: [50, 628], 28: [95, 604], 18: [140, 580],
  // SACRAL — top, side cols, bottom
  5:  [220, 510], 14: [250, 510], 29: [280, 510],
  34: [200, 535], 27: [200, 570],
  59: [300, 545],
  42: [220, 595], 3:  [250, 595], 9:  [280, 595],
  // SOLAR — top slant 36/22/37, bottom slant 49/55/30, 6 near apex
  36: [450, 522], 22: [405, 548], 37: [360, 572],
  6:  [345, 580],
  49: [450, 628], 55: [405, 604], 30: [360, 580],
  // ROOT — top row, left col (root↔spleen), right col (root↔solar)
  53: [220, 620], 60: [250, 620], 52: [280, 620],
  54: [200, 645], 38: [200, 670], 58: [200, 695],
  19: [300, 645], 39: [300, 670], 41: [300, 695],
};

export const GATE_POS = GATE_POS_INTERNAL;

// Channels we intentionally don't render as a direct line.
const HIDDEN_CHANNELS = new Set<string>(["10-57"]);

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

// Tube-style channel: two parallel offset lines, split-colored at midpoint
function TubeChannel({
  a, b, color1, color2, active,
}: {
  a: [number, number]; b: [number, number];
  color1: string; color2: string; active: boolean;
}) {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const len = Math.hypot(dx, dy) || 1;
  const offset = 2.2;
  const ox = (-dy / len) * offset;
  const oy = (dx / len) * offset;
  const mx = (a[0] + b[0]) / 2;
  const my = (a[1] + b[1]) / 2;
  const sw = active ? 1.6 : 1;
  const opacity = active ? 1 : 0.5;
  return (
    <g opacity={opacity}>
      <line x1={a[0] + ox} y1={a[1] + oy} x2={mx + ox} y2={my + oy}
        stroke={color1} strokeWidth={sw} strokeLinecap="round" />
      <line x1={mx + ox} y1={my + oy} x2={b[0] + ox} y2={b[1] + oy}
        stroke={color2} strokeWidth={sw} strokeLinecap="round" />
      <line x1={a[0] - ox} y1={a[1] - oy} x2={mx - ox} y2={my - oy}
        stroke={color1} strokeWidth={sw} strokeLinecap="round" />
      <line x1={mx - ox} y1={my - oy} x2={b[0] - ox} y2={b[1] - oy}
        stroke={color2} strokeWidth={sw} strokeLinecap="round" />
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
