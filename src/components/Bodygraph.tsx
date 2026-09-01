import { useMemo } from "react";
import { motion } from "framer-motion";
import { type CenterId, CENTERS, UNIQUE_CHANNELS, getDefinedCenters } from "@/lib/humandesign";
import silhouette from "@/assets/bodygraph-silhouette.png.asset.json";


// ─── Bodygraph ──────────────────────────────────────────────────
// AuraChem bodygraph color tokens (provided design system).
const DESIGN_C          = "#E11D48"; // channel / Design (Body)
const PERSON_C          = "#0F172A"; // channel / Personality (Mind)
const TRANSIT_C         = "#0284C7"; // future transit channels
const OPEN_GRAY         = "#94A3B8"; // undefined center stroke / inactive gates
const TUBE_OFF          = "#FFFFFF"; // channel base
const TUBE_EDGE         = "#94A3B8"; // channel border
const CANVAS_BG         = "#F7F0E5"; // bodygraph canvas background
const PANEL_FILL        = "#FFFFFF"; // planet-list panel fill
const PANEL_STROKE      = "#CBD5E1"; // planet-list panel stroke
const PANEL_SYMBOL      = "#475569"; // planet glyph color
const ACTIVE_GATE_BADGE = "#2563EB"; // generic active-gate badge accent

const DEFINED_CENTER_FILL: Record<CenterId, string> = {
  head:    "#FACC15",
  ajna:    "#4ADE80",
  throat:  "#A16207",
  g:       "#FACC15",
  heart:   "#FB7185",
  splenic: "#A16207",
  solar:   "#A16207",
  sacral:  "#FB7185",
  root:    "#A16207",
};

// Defined-center strokes are a slightly darker shade of each fill so shapes read cleanly.
const DEFINED_CENTER_STROKE: Record<CenterId, string> = {
  head:    "#CA8A04",
  ajna:    "#16A34A",
  throat:  "#713F12",
  g:       "#CA8A04",
  heart:   "#E11D48",
  splenic: "#713F12",
  solar:   "#713F12",
  sacral:  "#E11D48",
  root:    "#713F12",
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
    shape: { kind: "triangle", points: [[CX, 30], [CX - 55, 115], [CX + 55, 115]] },
    labelAt: [CX, 95],
  },
  // Ajna — downward triangle
  ajna: {
    shape: { kind: "triangle", points: [[CX - 55, 130], [CX + 55, 130], [CX, 215]] },
    labelAt: [CX, 158],
  },
  // Throat — square
  throat: {
    shape: { kind: "rect", x: CX - SQ_W / 2, y: 235, w: SQ_W, h: SQ_H },
    labelAt: [CX, 280],
  },
  // G — diamond (enlarged so vertical gate columns at CX±22 sit inside)
  g: {
    shape: { kind: "diamond", cx: CX, cy: 420, r: 62 },
    labelAt: [CX, 425],
  },
  // Ego — equilateral, rotated ~20° clockwise
  heart: {
    shape: { kind: "triangle", points: [[CX + 87, 464], [CX + 134, 519], [CX + 63, 532]] },
    labelAt: [CX + 95, 505],
  },



  // Sacral — extra space below G
  sacral: {
    shape: { kind: "rect", x: CX - SQ_W / 2, y: 635, w: SQ_W, h: SQ_H },
    labelAt: [CX, 683],
  },
  // Spleen — triangle, apex right (sits low, close to Root)
  splenic: {
    shape: { kind: "triangle", points: [[15, 600], [15, 704], [95, 652]] },
    labelAt: [45, 652],
  },
  // Solar Plexus — mirror of Spleen
  solar: {
    shape: { kind: "triangle", points: [[585, 600], [585, 704], [505, 652]] },
    labelAt: [555, 652],
  },



  // Root — square (pushed down with Sacral)
  root: {
    shape: { kind: "rect", x: CX - SQ_W / 2, y: 785, w: SQ_W, h: SQ_H },
    labelAt: [CX, 830],
  },
};

// All gate dots sit INSIDE their parent shape.
const GATE_POS_INTERNAL: Record<number, [number, number]> = {
  // HEAD
  64: [CX - 22, 105], 61: [CX, 105], 63: [CX + 22, 105],
  // AJNA
  47: [CX - 22, 142], 24: [CX, 142], 4:  [CX + 22, 142],
  17: [CX - 22, 165], 11: [CX + 22, 165],
  43: [CX, 198],
  // THROAT
  62: [CX - 22, 248], 23: [CX, 248], 56: [CX + 22, 248],
  16: [CX - 40, 272], 20: [CX - 40, 295],
  35: [CX + 40, 263], 12: [CX + 40, 283], 45: [CX + 40, 303],
  31: [CX - 22, 315], 8:  [CX, 315], 33: [CX + 22, 315],
  // G — diamond (tightened so dots sit safely inside)
  1:  [CX, 372],
  7:  [CX - 22, 398], 13: [CX + 22, 398],
  10: [CX - 35, 420], 25: [CX + 50, 422],
  15: [CX - 22, 444], 46: [CX + 22, 444],
  2:  [CX, 470],
  // EGO — equilateral rotated CW; dots pulled inward from vertices to sit fully inside
  21: [CX + 90, 479],
  51: [CX + 82, 500],
  26: [CX + 74, 522],
  40: [CX + 120, 514],




  // SPLEEN — shifted down with center
  48: [28, 617], 57: [50, 630], 44: [70, 640],
  50: [80, 652],
  18: [28, 687], 28: [50, 674], 32: [72, 662],
  // SACRAL — shifted with the center
  5:  [CX - 22, 648], 14: [CX, 648], 29: [CX + 22, 648],
  34: [CX - 40, 670],
  27: [CX - 40, 695], 59: [CX + 40, 695],
  42: [CX - 22, 716], 3:  [CX, 716], 9:  [CX + 22, 716],
  // SOLAR — mirror of spleen
  36: [572, 617], 22: [550, 630], 37: [530, 640],
  6:  [520, 652],
  49: [528, 662], 55: [550, 674], 30: [572, 687],



  // ROOT — three columns
  53: [CX - 22, 797], 60: [CX, 797], 52: [CX + 22, 797],
  54: [CX - 40, 823], 38: [CX - 40, 843], 58: [CX - 40, 863],
  19: [CX + 40, 823], 39: [CX + 40, 843], 41: [CX + 40, 863],
};

export const GATE_POS = GATE_POS_INTERNAL;

// Hide tubes that overlap/cross awkwardly with neighbors.
const HIDDEN_CHANNELS = new Set<string>(["10-57", "10-34", "34-57", "10-20", "20-34"]);


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
  const { shape } = CENTER_SHAPES[center];
  const fill = isDefined ? DEFINED_CENTER_FILL[center] : "#FFFFFF";
  const stroke = isDefined ? DEFINED_CENTER_STROKE[center] : OPEN_GRAY;
  return (
    <g>
      {shapeEl(shape, fill, stroke, !isDefined)}
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
  const hasSideInfo = designSet.size > 0 || personalitySet.size > 0;

  let fill: string;
  if (!isActive) fill = "#FFFFFF";
  else if (inDesign && inPersonality) fill = "url(#gateSplit)";
  else if (inDesign) fill = DESIGN_C;
  else if (inPersonality) fill = PERSON_C;
  else if (!hasSideInfo) fill = ACTIVE_GATE_BADGE; // generic active badge when no side data
  else fill = PERSON_C;

  const stroke = isActive ? (fill === "url(#gateSplit)" ? OPEN_GRAY : fill) : OPEN_GRAY;
  const textFill = isActive ? "#FFFFFF" : "#475569";
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

type SideMode = "off" | "design" | "personality" | "both";

// Tube-style channel: a cream band that fills with the activating side's color.
// When a gate is in BOTH Design and Personality, its half splits red/black stacked.
function TubeChannel({
  a, b, g1Mode, g2Mode,
}: {
  a: [number, number]; b: [number, number];
  g1Mode: SideMode; g2Mode: SideMode;
}) {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const len = Math.hypot(dx, dy) || 1;
  const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
  const mx = (a[0] + b[0]) / 2;
  const my = (a[1] + b[1]) / 2;
  const bandW = 9;
  const inset = 7.5; // matches the gate-dot radius so tube ends meet the dot's outer edge exactly
  const halfLen = Math.max(0, len / 2 - inset);


  const innerH = bandW - 3;
  const innerY = -bandW / 2 + 1.5;

  const renderHalf = (mode: SideMode, x: number) => {
    if (mode === "off") return null;
    if (mode === "both") {
      return (
        <g>
          <rect x={x} y={innerY} width={halfLen} height={innerH / 2}
            fill={DESIGN_C} />
          <rect x={x} y={innerY + innerH / 2} width={halfLen} height={innerH / 2}
            fill={PERSON_C} />
        </g>
      );
    }
    const c = mode === "design" ? DESIGN_C : PERSON_C;
    return <rect x={x} y={innerY} width={halfLen} height={innerH}
      rx={innerH / 2} fill={c} />;
  };

  return (
    <g transform={`translate(${mx}, ${my}) rotate(${angle})`}>
      <rect
        x={-(len / 2) + inset} y={-bandW / 2}
        width={Math.max(0, len - inset * 2)} height={bandW}
        rx={bandW / 2}
        fill={TUBE_OFF}
        stroke={TUBE_EDGE}
        strokeWidth={1}
      />
      {renderHalf(g1Mode, -(len / 2) + inset)}
      {renderHalf(g2Mode, 0)}
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
  const textColor = side === "personality" ? PANEL_SYMBOL : PANEL_SYMBOL;
  const valueColor = side === "personality" ? PERSON_C : DESIGN_C;
  const align = side === "personality" ? "items-end text-right" : "items-start text-left";
  return (
    <div
      className={`flex flex-col gap-1 ${align} text-[11px] rounded-xl px-2.5 py-3`}
      style={{ background: PANEL_FILL, border: `1px solid ${PANEL_STROKE}`, color: textColor }}
    >
      <div className="font-bold uppercase tracking-wider text-[10px] mb-1" style={{ color: valueColor }}>
        {side === "personality" ? "Personality" : "Design"}
      </div>
      {PLANETS.map((p, i) => {
        const v = items[i];
        return (
          <div key={p.name} className="flex items-center gap-1.5 leading-tight">
            {side === "personality" ? (
              <>
                <span className="tabular-nums" style={{ color: valueColor }}>{v ? `${v.gate}.${v.line}` : "—"}</span>
                <span className="w-4 text-center" style={{ color: PANEL_SYMBOL }}>{p.glyph}</span>
              </>
            ) : (
              <>
                <span className="w-4 text-center" style={{ color: PANEL_SYMBOL }}>{p.glyph}</span>
                <span className="tabular-nums" style={{ color: valueColor }}>{v ? `${v.gate}.${v.line}` : "—"}</span>
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

  const modeForGate = (g: number): SideMode => {
    const inD = designSet.has(g);
    const inP = personalitySet.has(g);
    if (inD && inP) return "both";
    if (inD) return "design";
    if (inP) return "personality";
    return "off";
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
        <div className="flex-1 max-w-[400px]">
          <svg viewBox="0 0 600 900" className="w-full block" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="gateSplit" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor={DESIGN_C} />
                <stop offset="50%" stopColor={DESIGN_C} />
                <stop offset="50%" stopColor={PERSON_C} />
                <stop offset="100%" stopColor={PERSON_C} />
              </linearGradient>
            </defs>

            {/* Human silhouette backdrop — reference image, covers whole bodygraph */}
            <image
              href={silhouette.url}
              x="20"
              y="0"
              width="560"
              height="900"
              preserveAspectRatio="xMidYMid slice"
              opacity="0.5"
              pointerEvents="none"
            />



            {/* Tube channels (under centers so they tuck behind shapes) */}
            {UNIQUE_CHANNELS.map((ch) => {
              const key = [...ch.gates].sort((x, y) => x - y).join("-");
              if (HIDDEN_CHANNELS.has(key)) return null;
              const a = GATE_POS_INTERNAL[ch.gates[0]];
              const b = GATE_POS_INTERNAL[ch.gates[1]];
              if (!a || !b) return null;
              return (
                <TubeChannel
                  key={ch.id}
                  a={a} b={b}
                  g1Mode={modeForGate(ch.gates[0])}
                  g2Mode={modeForGate(ch.gates[1])}
                />
              );
            })}

            {/* Extra decorative tube: 40↔37 (Ego to Solar Plexus) */}
            {([[40, 37]] as Array<[number, number]>).map(([g1, g2]) => {

              const a = GATE_POS_INTERNAL[g1];
              const b = GATE_POS_INTERNAL[g2];
              if (!a || !b) return null;
              return (
                <TubeChannel key={`extra-${g1}-${g2}`} a={a} b={b}
                  g1Mode={modeForGate(g1)} g2Mode={modeForGate(g2)} />
              );
            })}


            {/* Decorative stubs: gates 10 & 34 → extend to fully touch the 20-57 channel tube.
                Both halves take the originating gate's mode so the entire stub colors when active. */}
            {([
              { gate: 10, target: [172.5, 420] as [number, number] },
              { gate: 34, target: [137.5, 470] as [number, number] },
            ]).map(({ gate, target }) => {
              const a = GATE_POS_INTERNAL[gate];
              if (!a) return null;
              // Stop at the near edge of the 20-57 tube band (half tube width ~4.5px) so the stub
              // touches the channel without crossing it.
              const dx = target[0] - a[0];
              const dy = target[1] - a[1];
              const len = Math.hypot(dx, dy) || 1;
              const pullback = 4.5;


              const b: [number, number] = [target[0] - (dx / len) * pullback, target[1] - (dy / len) * pullback];
              const mode = modeForGate(gate);
              return <TubeChannel key={`stub-${gate}`} a={a} b={b} g1Mode={mode} g2Mode={mode} />;
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
