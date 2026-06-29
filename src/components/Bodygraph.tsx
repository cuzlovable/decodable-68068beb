import { useMemo } from "react";
import { motion } from "framer-motion";
import { type CenterId, CENTERS, UNIQUE_CHANNELS, getDefinedCenters } from "@/lib/humandesign";

// ─── Bodygraph (canonical HD palette + planet columns + PHS arrows) ─────
// Colors per user spec:
//   Head: yellow, Ajna: green, Throat: beige/brown, G: yellow,
//   Heart/Ego: red, Spleen: green, Solar Plexus: green,
//   Sacral: red, Root: red.
// Design (Body) data + red on LEFT. Personality (Mind) data + black on RIGHT.

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
  // HEAD — upward triangle (apex top), narrow
  head:    { shape: { kind: "triangle", points: [[215, 55], [165, 132], [265, 132]] }, labelAt: [215, 150] },
  // AJNA — downward triangle (apex bottom)
  ajna:    { shape: { kind: "triangle", points: [[160, 158], [270, 158], [215, 248]] }, labelAt: [215, 268] },
  // THROAT — large square
  throat:  { shape: { kind: "rect", x: 160, y: 272, w: 110, h: 95 }, labelAt: [215, 384] },
  // G — diamond
  g:       { shape: { kind: "diamond", cx: 215, cy: 440, r: 52 }, labelAt: [215, 510] },
  // HEART — small triangle, apex LEFT toward G (sits right of G, above Solar)
  heart:   { shape: { kind: "triangle", points: [[340, 410], [340, 480], [285, 445]] }, labelAt: [355, 500] },
  // SPLEEN — large triangle, apex RIGHT toward Sacral
  splenic: { shape: { kind: "triangle", points: [[20, 500], [20, 645], [155, 572]] }, labelAt: [60, 665] },
  // SACRAL — large square
  sacral:  { shape: { kind: "rect", x: 160, y: 510, w: 110, h: 95 }, labelAt: [215, 622] },
  // SOLAR — large triangle, apex LEFT toward Sacral
  solar:   { shape: { kind: "triangle", points: [[410, 500], [410, 645], [275, 572]] }, labelAt: [370, 665] },
  // ROOT — square
  root:    { shape: { kind: "rect", x: 160, y: 670, w: 110, h: 85 }, labelAt: [215, 772] },
};

// Gates anchored on the OUTLINE perimeter of each center, positioned on the
// edge nearest their channel partner so channel lines exit cleanly.
const GATE_POS_INTERNAL: Record<number, [number, number]> = {
  // HEAD — base edge (down to Ajna)
  64: [183, 130], 61: [215, 130], 63: [247, 130],
  // AJNA — top edge (up to Head), slanted sides (to Throat), apex (to Throat top)
  47: [178, 158], 24: [215, 158], 4:  [252, 158],
  17: [188, 200], 11: [242, 200],
  43: [215, 245],
  // THROAT — perimeter
  62: [183, 272], 23: [215, 272], 56: [247, 272],   // top edge → Ajna
  16: [160, 300], 20: [160, 332],                    // left edge → Spleen/G
  35: [270, 298], 12: [270, 322], 45: [270, 348],   // right edge → Solar/Heart
  31: [183, 367], 8:  [215, 367], 33: [247, 367],   // bottom edge → G
  // G — diamond perimeter
  1:  [215, 388],                                    // top vertex → Throat
  13: [188, 415], 7:  [242, 415],                    // upper slants → Throat
  25: [267, 440],                                    // right vertex → Heart
  46: [242, 465], 2:  [215, 492], 15: [188, 465],   // lower slants → Sacral
  10: [163, 440],                                    // left vertex → Spleen
  // HEART — perimeter (apex left toward G)
  21: [335, 416],                                    // top-right → Throat (21-45)
  26: [313, 460],                                    // mid-right → Solar (26-44)
  51: [290, 445],                                    // apex left → G (25-51)
  40: [335, 474],                                    // bottom-right → Solar (40-37)
  // SPLEEN — perimeter (apex right toward G/Sacral)
  48: [60, 522], 44: [95, 545], 57: [130, 568],     // top slant → Throat / Heart / G
  50: [105, 595],                                    // lower slant → Sacral
  32: [20, 525], 28: [20, 572], 18: [20, 620],      // left edge → Root
  // SACRAL — perimeter
  5:  [183, 510], 14: [215, 510], 29: [247, 510],   // top → G
  34: [160, 540], 27: [160, 575],                    // left → Spleen
  59: [270, 555],                                    // right → Solar/Heart
  42: [183, 605], 3:  [215, 605], 9:  [247, 605],   // bottom → Root
  // SOLAR — perimeter (apex left toward Sacral)
  36: [370, 522], 22: [335, 545], 37: [300, 568],   // top slant → Throat / Heart
  6:  [278, 572],                                    // apex → Sacral
  49: [410, 525], 55: [410, 572], 30: [410, 620],   // right edge → Root
  // ROOT — perimeter
  53: [183, 670], 60: [215, 670], 52: [247, 670],   // top → Sacral
  54: [160, 695], 38: [160, 720], 58: [160, 745],   // left → Spleen
  19: [270, 695], 39: [270, 720], 41: [270, 745],   // right → Solar
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

function GateEl({
  gate,
  point,
  activeGates,
  designSet,
  personalitySet,
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
      : inDesign
        ? DESIGN_C
        : PERSON_C;
  const stroke = isActive ? fill : "hsl(220 15% 62%)";
  const textFill = isActive ? "hsl(var(--primary-foreground))" : "hsl(220 15% 28%)";

  return (
    <g>
      <circle cx={point[0]} cy={point[1]} r={7.2} fill={fill} stroke={stroke} strokeWidth={1.2} />
      <text
        x={point[0]}
        y={point[1] + 2.8}
        textAnchor="middle"
        fill={textFill}
        fontSize={gate >= 10 ? 6.5 : 7.5}
        fontFamily="DM Sans, sans-serif"
        fontWeight={800}
        pointerEvents="none"
      >
        {gate}
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
          <svg viewBox="0 0 430 780" className="w-full block" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="splitGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor={DESIGN_C} />
                <stop offset="50%" stopColor={DESIGN_C} />
                <stop offset="50%" stopColor={PERSON_C} />
                <stop offset="100%" stopColor={PERSON_C} />
              </linearGradient>
              <linearGradient id="gateSplit" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor={DESIGN_C} />
                <stop offset="50%" stopColor={DESIGN_C} />
                <stop offset="50%" stopColor={PERSON_C} />
                <stop offset="100%" stopColor={PERSON_C} />
              </linearGradient>
            </defs>
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

            {/* Gates sit directly on each center outline so channels exit from the perimeter. */}
            {Object.entries(GATE_POS_INTERNAL).map(([gate, point]) => (
              <GateEl
                key={gate}
                gate={Number(gate)}
                point={point}
                activeGates={activeGates}
                designSet={designSet}
                personalitySet={personalitySet}
              />
            ))}
          </svg>
        </div>
        <PlanetCol side="personality" items={personalitySorted} />
      </div>
    </motion.div>
  );
};

export default Bodygraph;
