import { useMemo } from "react";
import { motion } from "framer-motion";
import { type CenterId, CENTERS, UNIQUE_CHANNELS, getDefinedCenters } from "@/lib/humandesign";

// ─── Bodygraph ──────────────────────────────────────────────────
// Brand-tinted: red with a gentle gray hue; black softened to charcoal with gray hue.
const DESIGN_C  = "hsl(2 48% 50%)";     // red, hint of gray (Design)
const PERSON_C  = "hsl(220 10% 24%)";   // charcoal, hint of gray (Personality)
const OPEN_GRAY = "hsl(220 12% 72%)";
const TUBE_OFF  = "hsl(30 25% 95%)";    // soft cream tube band (matches reference)
const TUBE_EDGE = "hsl(25 18% 78%)";    // tube outline

// Branded muted pastels with a grayish hue.
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

// ─── Canonical geometry — modeled after the standard HD chart reference ─
// Canvas 600 x 840. Centers are balanced in size; Heart is the smallest.
// Square centers (Throat, Sacral, Root) share the same 100x90 footprint.
// Head & Ajna triangles share width; Spleen & Solar Plexus are mirrored
// horizontal triangles flanking the Sacral.
const SQ_W = 100, SQ_H = 90;
const CX = 300; // chart centerline

export const CENTER_SHAPES: Record<CenterId, { shape: Shape; labelAt: [number, number] }> = {
  // Head — upward triangle
  head: {
    shape: { kind: "triangle", points: [[CX, 30], [CX - 50, 110], [CX + 50, 110]] },
    labelAt: [CX, 95],
  },
  // Ajna — downward triangle, same width as Head
  ajna: {
    shape: { kind: "triangle", points: [[CX - 50, 130], [CX + 50, 130], [CX, 210]] },
    labelAt: [CX, 158],
  },
  // Throat — square
  throat: {
    shape: { kind: "rect", x: CX - SQ_W / 2, y: 235, w: SQ_W, h: SQ_H },
    labelAt: [CX, 280],
  },
  // G — diamond
  g: {
    shape: { kind: "diamond", cx: CX, cy: 420, r: 55 },
    labelAt: [CX, 425],
  },
  // Heart / Ego — slightly enlarged triangle: top vertex, left vertex, bottom-right vertex
  heart: {
    shape: { kind: "triangle", points: [[CX + 105, 455], [CX + 62, 498], [CX + 150, 525]] },
    labelAt: [CX + 105, 495],
  },
  // Sacral — square
  sacral: {
    shape: { kind: "rect", x: CX - SQ_W / 2, y: 555, w: SQ_W, h: SQ_H },
    labelAt: [CX, 603],
  },
  // Spleen — enlarged triangle, apex right toward Sacral (lifted above Sacral to form V with 50-27)
  splenic: {
    shape: { kind: "triangle", points: [[15, 510], [15, 614], [120, 562]] },
    labelAt: [50, 562],
  },
  // Solar Plexus — mirror of Spleen, apex points left (lifted above Sacral to form V with 6-59)
  solar: {
    shape: { kind: "triangle", points: [[585, 510], [585, 614], [480, 562]] },
    labelAt: [550, 562],
  },
  // Root — square
  root: {
    shape: { kind: "rect", x: CX - SQ_W / 2, y: 700, w: SQ_W, h: SQ_H },
    labelAt: [CX, 748],
  },
};

// All gate dots sit INSIDE the bounds of their parent center shape.
// Coordinates derived to match canonical HD chart layout.
const GATE_POS_INTERNAL: Record<number, [number, number]> = {
  // HEAD — three gates along the bottom edge
  64: [CX - 25, 102], 61: [CX, 102], 63: [CX + 25, 102],
  // AJNA — top edge (47, 24, 4), middle (17, 11), apex (43)
  47: [CX - 28, 142], 24: [CX, 142], 4:  [CX + 28, 142],
  17: [CX - 16, 170], 11: [CX + 16, 170],
  43: [CX, 195],
  // THROAT — top row (62, 23, 56), left col (16, 20), right col (35, 12, 45), bottom row (31, 8, 33)
  62: [270, 248], 23: [300, 248], 56: [330, 248],
  16: [262, 272], 20: [262, 295],
  35: [338, 263], 12: [338, 283], 45: [338, 303],
  31: [272, 315], 8:  [300, 315], 33: [328, 315],
  // G — diamond perimeter & interior (gate 10 pushed to left vertex for horizontal exit)
  1:  [CX, 378],
  7:  [CX - 22, 398], 13: [CX + 22, 398],
  10: [CX - 50, 420], 25: [CX + 38, 420],
  15: [CX - 22, 444], 46: [CX + 22, 444],
  2:  [CX, 460],
  // EGO — top vertex (21), interior (51), left vertex (26), bottom-right vertex (40)
  21: [CX + 108, 475], 51: [CX + 95, 488], 26: [CX + 75, 500],
  40: [CX + 135, 512],
  // SPLEEN — top edge from left vertex (48) → 57 → 44 → apex (50); bottom edge 18 (vertex) → 28 → 32
  48: [28, 527], 57: [55, 540], 44: [82, 552],
  50: [100, 562],
  18: [28, 597], 28: [55, 584], 32: [82, 572],
  // SACRAL — top (5, 14, 29), 34 below top-left, mid (27, 59), bottom (42, 3, 9)
  5:  [CX - 30, 568], 14: [CX, 568], 29: [CX + 30, 568],
  34: [CX - 30, 590],
  27: [CX - 30, 613],
  59: [CX + 30, 613],
  42: [CX - 30, 636], 3:  [CX, 636], 9:  [CX + 30, 636],
  // SOLAR — top-right vertex (36) → 22 → 37 → apex-left (6); bottom 49 → 55 → 30 (vertex)
  36: [572, 527], 22: [545, 540], 37: [518, 552],
  6:  [500, 562],
  49: [518, 572], 55: [545, 584], 30: [572, 597],
  // ROOT — top (53, 60, 52), left (54, 38, 58), right (19, 39, 41)
  53: [CX - 30, 712], 60: [CX, 712], 52: [CX + 30, 712],
  54: [CX - 40, 738], 38: [CX - 40, 758],
  58: [CX - 40, 778],
  19: [CX + 40, 738], 39: [CX + 40, 758], 41: [CX + 40, 778],
};

export const GATE_POS = GATE_POS_INTERNAL;

// Hide visual tubes that overlap/cross awkwardly with neighbors.
// Per reference: gate 10 should only expose its horizontal exit toward 20;
// gate 34 should only expose its tube toward 20 (meeting the 20-57 line).
const HIDDEN_CHANNELS = new Set<string>(["10-57", "10-34", "34-57"]);

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

// Tube-style channel: a wide, soft cream band with subtle outline.
// When active, the band splits at midpoint into the activating side's color.
function TubeChannel({
  a, b, color1, color2, active, g1Active, g2Active,
}: {
  a: [number, number]; b: [number, number];
  color1: string; color2: string;
  active: boolean; g1Active: boolean; g2Active: boolean;
}) {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const len = Math.hypot(dx, dy) || 1;
  const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
  const mx = (a[0] + b[0]) / 2;
  const my = (a[1] + b[1]) / 2;
  const bandW = 9;   // slightly thinner tube
  const inset = 7;   // shorten so it tucks under the gate circles

  // Background band (always rendered as the tube)
  return (
    <g transform={`translate(${mx}, ${my}) rotate(${angle})`}>
      {/* tube outline + cream fill */}
      <rect
        x={-(len / 2) + inset} y={-bandW / 2}
        width={Math.max(0, len - inset * 2)} height={bandW}
        rx={bandW / 2}
        fill={TUBE_OFF}
        stroke={TUBE_EDGE}
        strokeWidth={1}
      />
      {/* activated half-fills: left half = color1 when g1 active, right half = color2 when g2 active */}
      {g1Active && (
        <rect
          x={-(len / 2) + inset} y={-bandW / 2 + 1.5}
          width={Math.max(0, len / 2 - inset)} height={bandW - 3}
          rx={(bandW - 3) / 2}
          fill={color1}
        />
      )}
      {g2Active && (
        <rect
          x={0} y={-bandW / 2 + 1.5}
          width={Math.max(0, len / 2 - inset)} height={bandW - 3}
          rx={(bandW - 3) / 2}
          fill={color2}
        />
      )}
      {active && (
        <line x1={0} y1={-bandW / 2 + 1} x2={0} y2={bandW / 2 - 1}
          stroke="hsl(var(--card))" strokeWidth={0.6} opacity={0.5} />
      )}
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
    return TUBE_OFF;
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
        <div className="flex-1 max-w-[520px]">
          <svg viewBox="0 0 600 840" className="w-full block" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="gateSplit" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor={DESIGN_C} />
                <stop offset="50%" stopColor={DESIGN_C} />
                <stop offset="50%" stopColor={PERSON_C} />
                <stop offset="100%" stopColor={PERSON_C} />
              </linearGradient>
            </defs>

            {/* Tube channels (under centers so they tuck behind shapes) */}
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
                  color1={colorForGate(ch.gates[0])}
                  color2={colorForGate(ch.gates[1])}
                  active={active}
                  g1Active={g1Active}
                  g2Active={g2Active}
                />
              );
            })}

            {/* Decorative gate stubs — always-visible short tube exits matching reference chart */}
            {([
              // gate 10: short horizontal tube exiting left from G-center left vertex
              { gate: 10, dx: -42, dy: 0 },
              // gate 34: short tube exiting up-left to meet the 20-57 channel line
              { gate: 34, dx: -34, dy: -18 },
            ] as Array<{ gate: number; dx: number; dy: number }>).map(({ gate, dx, dy }) => {
              const p = GATE_POS_INTERNAL[gate];
              if (!p) return null;
              const a: [number, number] = p;
              const b: [number, number] = [p[0] + dx, p[1] + dy];
              const gActive = activeGates.has(gate);
              return (
                <TubeChannel
                  key={`stub-${gate}`}
                  a={a} b={b}
                  color1={colorForGate(gate)} color2={colorForGate(gate)}
                  active={gActive} g1Active={gActive} g2Active={gActive}
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
