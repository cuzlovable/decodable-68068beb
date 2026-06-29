import { useMemo } from "react";
import { motion } from "framer-motion";
import { type CenterId, CENTERS, UNIQUE_CHANNELS, getDefinedCenters } from "@/lib/humandesign";

// ─── Bodygraph (canonical HD palette + planet columns + PHS arrows) ─────
// Colors per user spec:
//   Head: yellow, Ajna: green, Throat: beige/brown, G: yellow,
//   Heart/Ego: red, Spleen: green, Solar Plexus: green,
//   Sacral: red, Root: red.
// Design (Body) data + black on LEFT. Personality (Mind) data + red on RIGHT.

const DESIGN_C  = "hsl(0 75% 55%)";     // red (Design / Body)
const PERSON_C  = "hsl(220 15% 15%)";   // black (Personality / Mind)
const OPEN_GRAY = "hsl(220 15% 75%)";
const CHANNEL_OFF = "hsl(220 15% 88%)";

const CENTER_COLORS: Record<CenterId, { fill: string; stroke: string }> = {
  head:    { fill: "hsl(48 95% 60%)",  stroke: "hsl(48 70% 45%)"  }, // yellow
  ajna:    { fill: "hsl(140 55% 55%)", stroke: "hsl(140 50% 40%)" }, // green
  throat:  { fill: "hsl(35 45% 55%)",  stroke: "hsl(30 35% 35%)"  }, // beige/brown
  g:       { fill: "hsl(48 95% 60%)",  stroke: "hsl(48 70% 45%)"  }, // yellow
  heart:   { fill: "hsl(0 75% 55%)",   stroke: "hsl(0 70% 40%)"   }, // red
  splenic: { fill: "hsl(140 55% 55%)", stroke: "hsl(140 50% 40%)" }, // green
  solar:   { fill: "hsl(140 55% 55%)", stroke: "hsl(140 50% 40%)" }, // green
  sacral:  { fill: "hsl(0 75% 55%)",   stroke: "hsl(0 70% 40%)"   }, // red
  root:    { fill: "hsl(0 75% 55%)",   stroke: "hsl(0 70% 40%)"   }, // red
};

type Shape =
  | { kind: "triangle"; points: [number, number][] }
  | { kind: "rect"; x: number; y: number; w: number; h: number }
  | { kind: "diamond"; cx: number; cy: number; r: number };

export const CENTER_SHAPES: Record<CenterId, { shape: Shape; labelAt: [number, number] }> = {
  // Head: triangle pointing UP (apex at top)
  head:    { shape: { kind: "triangle", points: [[200, 50], [150, 140], [250, 140]] }, labelAt: [200, 162] },
  // Ajna: triangle pointing DOWN
  ajna:    { shape: { kind: "triangle", points: [[150, 170], [250, 170], [200, 260]] }, labelAt: [200, 282] },
  throat:  { shape: { kind: "rect", x: 160, y: 300, w: 80, h: 80 }, labelAt: [200, 398] },
  g:       { shape: { kind: "diamond", cx: 200, cy: 450, r: 48 }, labelAt: [200, 520] },
  // Heart: sideways triangle, apex left toward G — sits between G and Solar
  heart:   { shape: { kind: "triangle", points: [[290, 415], [290, 485], [235, 450]] }, labelAt: [305, 505] },
  // Spleen pulled further LEFT for a balanced awareness triangle (Ajna / Spleen / Solar)
  splenic: { shape: { kind: "triangle", points: [[30, 520], [30, 630], [125, 575]] }, labelAt: [55, 650] },
  sacral:  { shape: { kind: "rect", x: 160, y: 525, w: 80, h: 80 }, labelAt: [200, 622] },
  // Solar pulled further RIGHT
  solar:   { shape: { kind: "triangle", points: [[370, 520], [370, 630], [275, 575]] }, labelAt: [345, 650] },
  root:    { shape: { kind: "rect", x: 160, y: 660, w: 80, h: 70 }, labelAt: [200, 748] },
};

// Gates placed on the OUTLINE perimeter of each center shape, positioned
// on the edge nearest to their channel partner so lines exit cleanly.
const GATE_POS_INTERNAL: Record<number, [number, number]> = {
  // HEAD — base edge (down to Ajna)
  64: [170, 140], 61: [200, 140], 63: [230, 140],
  // AJNA — top edge (up to Head), slanted edges (to Throat sides), apex (to Throat top)
  47: [170, 170], 24: [200, 170], 4: [230, 170],
  17: [168, 210], 11: [232, 210],
  43: [200, 254],
  // THROAT — perimeter
  62: [170, 300], 23: [200, 300], 56: [230, 300],   // top → Ajna
  16: [160, 320], 20: [160, 358],                    // left → Spleen
  35: [240, 320], 12: [240, 358],                    // right → Solar
  33: [170, 380], 8: [190, 380], 31: [210, 380], 45: [230, 380], // bottom → G/Heart
  // G — diamond perimeter
  7:  [178, 426], 1:  [200, 405], 13: [222, 426],   // top → Throat
  25: [246, 450],                                    // right vertex → Heart
  2:  [178, 474], 15: [200, 495], 46: [222, 474],   // bottom → Sacral
  10: [154, 450],                                    // left vertex → Spleen
  // HEART — perimeter (apex left toward G)
  21: [285, 425], 26: [268, 438], 51: [252, 450], 40: [285, 475],
  // SPLEEN — perimeter (apex right toward G/Sacral)
  48: [30, 540], 44: [30, 575], 32: [30, 610],     // left → Root
  57: [60, 548], 50: [92, 565],                     // top → Sacral/Throat/G
  28: [60, 602], 18: [92, 585],                     // bottom → Root/Sacral
  // SACRAL — perimeter
  5: [170, 525], 14: [200, 525], 29: [230, 525],   // top → G
  27: [160, 555], 34: [160, 585],                   // left → Spleen
  59: [240, 565],                                    // right → Solar
  42: [170, 605], 3:  [200, 605], 9:  [230, 605],  // bottom → Root
  // SOLAR — perimeter (apex left toward G/Sacral)
  36: [370, 540], 22: [370, 575], 49: [370, 610],  // right → Root
  37: [340, 548], 6:  [308, 565],                   // top → Heart/Sacral
  30: [340, 602], 55: [308, 585],                   // bottom → Root/Sacral
  // ROOT — perimeter
  53: [170, 660], 60: [200, 660], 52: [230, 660],  // top → Sacral
  58: [160, 680], 54: [160, 705], 38: [160, 725],  // left → Spleen
  19: [240, 680], 39: [240, 705], 41: [240, 725],  // right → Solar
};

export const GATE_POS = GATE_POS_INTERNAL;

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
      >
        {CENTERS[center].label}
      </text>
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
      <span
        className="inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold text-white"
        style={{ background: color }}
      >
        {color1to6}
      </span>
      <span className="text-[10px] font-semibold" style={{ color }}>.{tone}</span>
      {dir === "right" && <span style={{ color }} className="text-base leading-none">▶</span>}
    </div>
  );
}

// ─── Planet columns ──────────────────────────────────────────────
const PLANETS: { name: string; glyph: string }[] = [
  { name: "Sun", glyph: "☉" },
  { name: "Earth", glyph: "⊕" },
  { name: "N. Node", glyph: "☊" },
  { name: "S. Node", glyph: "☋" },
  { name: "Moon", glyph: "☽" },
  { name: "Mercury", glyph: "☿" },
  { name: "Venus", glyph: "♀" },
  { name: "Mars", glyph: "♂" },
  { name: "Jupiter", glyph: "♃" },
  { name: "Saturn", glyph: "♄" },
  { name: "Uranus", glyph: "♅" },
  { name: "Neptune", glyph: "♆" },
  { name: "Pluto", glyph: "♇" },
];

const PLANET_ALIASES: Record<string, string[]> = {
  Sun: ["sun"],
  Earth: ["earth"],
  "N. Node": ["north node", "n. node", "north_node", "northnode", "n.node"],
  "S. Node": ["south node", "s. node", "south_node", "southnode", "s.node"],
  Moon: ["moon"],
  Mercury: ["mercury"],
  Venus: ["venus"],
  Mars: ["mars"],
  Jupiter: ["jupiter"],
  Saturn: ["saturn"],
  Uranus: ["uranus"],
  Neptune: ["neptune"],
  Pluto: ["pluto"],
};
const normName = (s?: string) => (s ?? "").toLowerCase().replace(/[._\s-]+/g, " ").trim();
function sortByCanonical(list?: Array<{ gate: number; line: number; planet?: string }>) {
  const out: Array<{ gate: number; line: number; planet?: string } | null> = PLANETS.map(() => null);
  if (!list) return out;
  for (const item of list) {
    const n = normName(item.planet);
    for (let i = 0; i < PLANETS.length; i++) {
      const canon = PLANETS[i].name;
      if (PLANET_ALIASES[canon].includes(n) || normName(canon) === n) {
        out[i] = item;
        break;
      }
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
  definedGates,
  designGates,
  personalityGates,
  designPlanets,
  personalityPlanets,
  variables,
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

  // Variables: digestion + environment = Design (top row); motivation + perspective = Personality
  const v = variables ?? {};
  const digestion   = (v.digestion as number) ?? (v.design_digestion as number);
  const environment = (v.environment as number) ?? (v.design_environment as number);
  const motivation  = (v.motivation as number) ?? (v.personality_motivation as number) ?? (v.awareness as number);
  const perspective = (v.perspective as number) ?? (v.personality_perspective as number) ?? (v.view as number);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
      className={className}
    >
      {/* Top arrows: 2x2 grid — Design (left), Personality (right) */}
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
        <div className="flex-1 max-w-[420px]">
          <svg viewBox="0 0 400 780" className="w-full block" xmlns="http://www.w3.org/2000/svg">
            {/* Channels with split design/personality coloring */}
            {UNIQUE_CHANNELS.map((ch) => {
              const a = GATE_POS_INTERNAL[ch.gates[0]];
              const b = GATE_POS_INTERNAL[ch.gates[1]];
              if (!a || !b) return null;
              const g1Active = activeGates.has(ch.gates[0]);
              const g2Active = activeGates.has(ch.gates[1]);
              if (!g1Active && !g2Active) {
                return (
                  <line key={ch.id} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]}
                    stroke={CHANNEL_OFF} strokeWidth={1} strokeOpacity={0.55} />
                );
              }
              const colorFor = (g: number) => {
                const inD = designSet.has(g);
                const inP = personalitySet.has(g);
                if (inD && inP) return "url(#splitGrad)";
                if (inD) return DESIGN_C;
                if (inP) return PERSON_C;
                return CHANNEL_OFF;
              };
              const mid: [number, number] = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
              return (
                <g key={ch.id}>
                  <line x1={a[0]} y1={a[1]} x2={mid[0]} y2={mid[1]}
                    stroke={g1Active ? colorFor(ch.gates[0]) : CHANNEL_OFF}
                    strokeWidth={g1Active ? 3 : 1} strokeLinecap="round" />
                  <line x1={mid[0]} y1={mid[1]} x2={b[0]} y2={b[1]}
                    stroke={g2Active ? colorFor(ch.gates[1]) : CHANNEL_OFF}
                    strokeWidth={g2Active ? 3 : 1} strokeLinecap="round" />
                </g>
              );
            })}

            {/* Centers */}
            {(Object.keys(CENTERS) as CenterId[]).map((c) => (
              <CenterEl key={c} center={c} isDefined={definedCenters.has(c)} />
            ))}
          </svg>
        </div>
        <PlanetCol side="personality" items={personalitySorted} />
      </div>
    </motion.div>
  );
};

export default Bodygraph;
