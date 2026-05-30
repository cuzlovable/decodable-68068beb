import { useMemo } from "react";
import { motion } from "framer-motion";
import { type CenterId, CENTERS, UNIQUE_CHANNELS, getDefinedCenters } from "@/lib/humandesign";

// ─── Canonical Jovian-style Bodygraph ──────────────────────────────
// Layout: 920w x 980h
//   - Centered chart: 220..700 (480 wide)
//   - Left column (Design / Body): ~10..210   (BLACK)
//   - Right column (Personality / Mind): 710..910  (RED)
//   - Variable arrows in four corners
//   - Mind centers (Head + Ajna) tinted differently to call out mental vs body

type Shape =
  | { kind: "triangle"; points: [number, number][] }
  | { kind: "rect"; x: number; y: number; w: number; h: number }
  | { kind: "diamond"; cx: number; cy: number; r: number };

// Shift the chart right by +160 from a 0-based layout so we have room for the
// Design (left) planet column. Original chart canvas was 600 wide.
const SHIFT_X = 160;
const s = (x: number) => x + SHIFT_X;

const CENTER_SHAPES: Record<CenterId, { shape: Shape; labelAt: [number, number] }> = {
  head: {
    shape: { kind: "triangle", points: [[s(200), 50], [s(400), 50], [s(300), 175]] },
    labelAt: [s(300), 35],
  },
  ajna: {
    shape: { kind: "triangle", points: [[s(300), 195], [s(200), 320], [s(400), 320]] },
    labelAt: [s(300), 345],
  },
  throat: {
    shape: { kind: "rect", x: s(210), y: 360, w: 180, h: 110 },
    labelAt: [s(300), 485],
  },
  g: {
    shape: { kind: "diamond", cx: s(300), cy: 545, r: 75 },
    labelAt: [s(300), 635],
  },
  heart: {
    shape: { kind: "triangle", points: [[s(445), 500], [s(445), 575], [s(385), 538]] },
    labelAt: [s(470), 590],
  },
  splenic: {
    shape: { kind: "triangle", points: [[s(50), 635], [s(50), 765], [s(215), 700]] },
    labelAt: [s(50), 790],
  },
  sacral: {
    shape: { kind: "rect", x: s(220), y: 655, w: 160, h: 125 },
    labelAt: [s(300), 800],
  },
  solar: {
    shape: { kind: "triangle", points: [[s(550), 635], [s(550), 765], [s(385), 700]] },
    labelAt: [s(550), 790],
  },
  root: {
    shape: { kind: "rect", x: s(220), y: 810, w: 160, h: 110 },
    labelAt: [s(300), 935],
  },
};

// Canonical Jovian gate positions. Ordering chosen so Head↔Ajna and
// Ajna↔Throat channels run parallel (no crossings) and Throat↔G channels
// align vertically. All positions sit comfortably inside their center shapes.
const GATE_POS: Record<number, [number, number]> = {
  // HEAD — gates along the top edge of the down-triangle
  64: [s(245), 85], 61: [s(300), 75], 63: [s(355), 85],

  // AJNA — top row (near Head) connects 64-47, 61-24, 63-4
  //         bottom row (near Throat) connects 17-62, 43-23, 11-56
  47: [s(245), 225], 24: [s(300), 225], 4:  [s(355), 225],
  17: [s(245), 305], 43: [s(300), 305], 11: [s(355), 305],

  // THROAT — top row aligns with Ajna bottom (62/23/56)
  62: [s(245), 380], 23: [s(300), 380], 56: [s(355), 380],
  35: [s(225), 415], 12: [s(225), 445],
  45: [s(335), 415],
  16: [s(375), 415], 20: [s(375), 445],
  // Bottom row aligns with G top (33-13, 8-1, 31-7)
  33: [s(255), 455], 8:  [s(300), 455], 31: [s(345), 455],

  // G / SELF — diamond. Top three align with Throat bottom; 25 at apex.
  13: [s(255), 495], 1:  [s(300), 480], 7:  [s(345), 495],
  2:  [s(245), 530], 46: [s(355), 530],
  15: [s(245), 565], 10: [s(355), 565],
  25: [s(300), 605],

  // HEART — tiny right-triangle on the right of G
  40: [s(400), 525], 26: [s(425), 545], 21: [s(425), 510], 51: [s(445), 530],

  // SPLEEN — left triangle (base at left, apex pointing right toward Sacral)
  48: [s(70), 660], 44: [s(70), 700], 32: [s(70), 740],
  28: [s(110), 680], 50: [s(110), 720],
  18: [s(150), 700], 57: [s(190), 700],

  // SACRAL — 3×3 grid inside rectangle (220..380 × 655..780)
  5:  [s(255), 680], 14: [s(300), 680], 29: [s(345), 680],
  59: [s(255), 720], 9:  [s(300), 720], 3:  [s(345), 720],
  42: [s(255), 760], 27: [s(300), 760], 34: [s(345), 760],

  // SOLAR PLEXUS — right triangle (mirror of Spleen)
  36: [s(530), 660], 22: [s(530), 700], 49: [s(530), 740],
  6:  [s(490), 680], 30: [s(490), 720],
  37: [s(450), 700], 55: [s(410), 700],

  // ROOT — 3×3 grid inside rectangle (220..380 × 810..920)
  53: [s(255), 835], 60: [s(300), 835], 52: [s(345), 835],
  19: [s(255), 870], 39: [s(300), 870], 41: [s(345), 870],
  58: [s(255), 905], 38: [s(300), 905], 54: [s(345), 905],
};

// Canonical HD center colors when defined (matches printed Jovian charts)
const CENTER_COLORS: Record<CenterId, { fill: string; stroke: string; text: string }> = {
  head:    { fill: "#FFEC85", stroke: "#C9B340", text: "#5A4A00" },  // yellow
  ajna:    { fill: "#3AA848", stroke: "#1F6E2A", text: "#FFFFFF" },  // green
  throat:  { fill: "#8B5E3C", stroke: "#5A3A22", text: "#FFFFFF" },  // brown
  g:       { fill: "#FFEC85", stroke: "#C9B340", text: "#5A4A00" },  // yellow
  heart:   { fill: "#EC1E31", stroke: "#A0101F", text: "#FFFFFF" },  // red
  splenic: { fill: "#8B5E3C", stroke: "#5A3A22", text: "#FFFFFF" },  // brown
  sacral:  { fill: "#EC1E31", stroke: "#A0101F", text: "#FFFFFF" },  // red
  solar:   { fill: "#D68900", stroke: "#8F5C00", text: "#FFFFFF" },  // mustard
  root:    { fill: "#8B5E3C", stroke: "#5A3A22", text: "#FFFFFF" },  // brown
};


const GATE_R = 10;

// 13 planet rows (Sun → Chiron)
const PLANETS = [
  { glyph: "☉", name: "Sun" },
  { glyph: "⊕", name: "Earth" },
  { glyph: "☽", name: "Moon" },
  { glyph: "☊", name: "N. Node" },
  { glyph: "☋", name: "S. Node" },
  { glyph: "☿", name: "Mercury" },
  { glyph: "♀", name: "Venus" },
  { glyph: "♂", name: "Mars" },
  { glyph: "♃", name: "Jupiter" },
  { glyph: "♄", name: "Saturn" },
  { glyph: "⛢", name: "Uranus" },
  { glyph: "♆", name: "Neptune" },
  { glyph: "♇", name: "Pluto" },
];

function CenterEl({
  center,
  isDefined,
}: {
  center: CenterId;
  isDefined: boolean;
}) {
  const { shape, labelAt } = CENTER_SHAPES[center];
  const label = CENTERS[center].label;
  const palette = CENTER_COLORS[center];

  const fillColor = isDefined ? palette.fill : "transparent";
  const strokeColor = isDefined ? palette.stroke : "hsl(215, 25%, 70%)";
  const strokeWidth = isDefined ? 2.5 : 1.4;
  const strokeDash = isDefined ? undefined : "4 3";

  let el: JSX.Element;
  switch (shape.kind) {
    case "triangle":
      el = (
        <polygon
          points={shape.points.map((p) => p.join(",")).join(" ")}
          fill={fillColor}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeDasharray={strokeDash}
          strokeLinejoin="round"
        />
      );
      break;
    case "rect":
      el = (
        <rect
          x={shape.x}
          y={shape.y}
          width={shape.w}
          height={shape.h}
          rx={4}
          fill={fillColor}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeDasharray={strokeDash}
        />
      );
      break;
    case "diamond": {
      const { cx, cy, r } = shape;
      const pts = `${cx},${cy - r} ${cx + r},${cy} ${cx},${cy + r} ${cx - r},${cy}`;
      el = (
        <polygon
          points={pts}
          fill={fillColor}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeDasharray={strokeDash}
          strokeLinejoin="round"
        />
      );
      break;
    }
  }

  return (
    <g>
      {el}
      <text
        x={labelAt[0]}
        y={labelAt[1]}
        textAnchor="middle"
        fill={isDefined ? "hsl(0, 0%, 25%)" : "hsl(215, 20%, 55%)"}
        fontSize="11"
        fontFamily="DM Sans, sans-serif"
        fontWeight={isDefined ? 700 : 400}
      >
        {label}
      </text>
    </g>
  );
}

// ─── Variable arrows ─────────────────────────────────────────
function VariableArrow({
  x,
  y,
  dir,
  label,
  number,
  side,
}: {
  x: number;
  y: number;
  dir: "left" | "right";
  label: string;
  number: number;
  side: "design" | "personality";
}) {
  const color = side === "personality" ? "hsl(0, 70%, 50%)" : "hsl(0, 0%, 15%)";
  const arrow = dir === "right"
    ? `${x},${y - 8} ${x + 26},${y - 8} ${x + 26},${y - 14} ${x + 40},${y} ${x + 26},${y + 14} ${x + 26},${y + 8} ${x},${y + 8}`
    : `${x + 40},${y - 8} ${x + 14},${y - 8} ${x + 14},${y - 14} ${x},${y} ${x + 14},${y + 14} ${x + 14},${y + 8} ${x + 40},${y + 8}`;
  return (
    <g>
      <polygon points={arrow} fill={color} />
      <text
        x={x + 20}
        y={y + 28}
        textAnchor="middle"
        fontSize="10"
        fontFamily="DM Sans, sans-serif"
        fill={color}
      >
        {label} · {number}
      </text>
    </g>
  );
}

// ─── Planet column row ───────────────────────────────────────
function PlanetRow({
  x,
  y,
  planet,
  gateLine,
  side,
  align,
}: {
  x: number;
  y: number;
  planet: { glyph: string; name: string };
  gateLine: string;
  side: "design" | "personality";
  align: "left" | "right";
}) {
  const color = side === "personality" ? "hsl(0, 70%, 50%)" : "hsl(0, 0%, 15%)";
  const glyphX = align === "right" ? x + 130 : x;
  const numberX = align === "right" ? x : x + 130;
  return (
    <g>
      <text
        x={glyphX}
        y={y}
        textAnchor={align === "right" ? "end" : "start"}
        fontSize="18"
        fill={color}
        fontFamily="serif"
      >
        {planet.glyph}
      </text>
      <text
        x={numberX}
        y={y}
        textAnchor={align === "right" ? "end" : "start"}
        fontSize="13"
        fontFamily="DM Sans, sans-serif"
        fontWeight="600"
        fill={color}
      >
        {gateLine}
      </text>
    </g>
  );
}

interface BodygraphProps {
  definedGates: number[];
  /** Optional split: which gates came from Design (body) vs Personality (mind). If absent, we infer demo-style. */
  designGates?: number[];
  personalityGates?: number[];
  /** Optional planet activations — if missing we synthesise from definedGates for demo. */
  designPlanets?: Array<{ gate: number; line: number }>;
  personalityPlanets?: Array<{ gate: number; line: number }>;
  /** Variables: each is gate.line number for color/tone/base */
  variables?: {
    digestion: number;     // bottom-left, Design, arrow →
    environment: number;   // top-left, Design, arrow ←
    awareness: number;     // bottom-right, Personality, arrow ←
    perspective: number;   // top-right, Personality, arrow →
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

  // Demo fallback: split alternating gates into design/personality
  const dGates = useMemo(() => new Set(designGates ?? definedGates.filter((_, i) => i % 2 === 0)), [designGates, definedGates]);
  const pGates = useMemo(() => new Set(personalityGates ?? definedGates.filter((_, i) => i % 2 === 1)), [personalityGates, definedGates]);

  // Demo planets — pull from defined gates, give each a line 1..6
  const demoLine = (g: number) => ((g * 7) % 6) + 1;
  const dPlanets = designPlanets ?? Array.from(dGates).slice(0, 13).map((g) => ({ gate: g, line: demoLine(g) }));
  const pPlanets = personalityPlanets ?? Array.from(pGates).slice(0, 13).map((g) => ({ gate: g, line: demoLine(g) }));

  const vars = variables ?? { digestion: 3, environment: 5, awareness: 2, perspective: 4 };

  const activeChannels = useMemo(
    () => UNIQUE_CHANNELS.filter((ch) => gateSet.has(ch.gates[0]) && gateSet.has(ch.gates[1])),
    [gateSet]
  );

  // Planet column geometry
  const colStartY = 200;
  const rowGap = 38;
  const designColX = 30;       // left column origin
  const persColX = s(620);     // right column origin

  const fmt = (g: number, line: number) => `${g}.${line}`;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className={className}
    >
      <svg viewBox="0 0 920 990" className="w-full mx-auto" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="bodyGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="hsl(0, 0%, 25%)" stopOpacity="0.92" />
            <stop offset="100%" stopColor="hsl(0, 0%, 10%)" stopOpacity="0.92" />
          </linearGradient>
          <linearGradient id="mindGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="hsl(0, 75%, 60%)" stopOpacity="0.92" />
            <stop offset="100%" stopColor="hsl(0, 75%, 45%)" stopOpacity="0.92" />
          </linearGradient>
          <linearGradient id="splitGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="hsl(0, 0%, 15%)" />
            <stop offset="50%" stopColor="hsl(0, 0%, 15%)" />
            <stop offset="50%" stopColor="hsl(0, 70%, 50%)" />
            <stop offset="100%" stopColor="hsl(0, 70%, 50%)" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Column headers */}
        <text x={designColX + 65} y={170} textAnchor="middle" fontSize="13" fontWeight="700" fill="hsl(0, 0%, 15%)" fontFamily="DM Sans, sans-serif">DESIGN</text>
        <text x={designColX + 65} y={186} textAnchor="middle" fontSize="10" fill="hsl(0, 0%, 35%)" fontFamily="DM Sans, sans-serif">Body · Unconscious</text>
        <text x={persColX + 65} y={170} textAnchor="middle" fontSize="13" fontWeight="700" fill="hsl(0, 70%, 50%)" fontFamily="DM Sans, sans-serif">PERSONALITY</text>
        <text x={persColX + 65} y={186} textAnchor="middle" fontSize="10" fill="hsl(0, 50%, 45%)" fontFamily="DM Sans, sans-serif">Mind · Conscious</text>

        {/* Planet columns */}
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

        {/* Variable arrows — corners */}
        <VariableArrow x={designColX + 10} y={70} dir="left" label="Env" number={vars.environment} side="design" />
        <VariableArrow x={designColX + 10} y={935} dir="right" label="Dig" number={vars.digestion} side="design" />
        <VariableArrow x={persColX + 80} y={70} dir="right" label="View" number={vars.perspective} side="personality" />
        <VariableArrow x={persColX + 80} y={935} dir="left" label="Awr" number={vars.awareness} side="personality" />

        {/* Centers */}
        {(Object.keys(CENTERS) as CenterId[]).map((centerId) => (
          <CenterEl
            key={centerId}
            center={centerId}
            isDefined={definedCenters.has(centerId)}
            isMind={centerId === "head" || centerId === "ajna"}
          />
        ))}

        {/* Channels */}
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

          const isActive = activeChannels.some((a) => a.id === ch.id);
          const oneSide = gateSet.has(ch.gates[0]) !== gateSet.has(ch.gates[1]);

          // Decide color: if active and both sides come from the same source → that color, else split
          let stroke = "hsl(215, 25%, 80%)";
          if (isActive) {
            const aD = dGates.has(ch.gates[0]) && dGates.has(ch.gates[1]);
            const aP = pGates.has(ch.gates[0]) && pGates.has(ch.gates[1]);
            stroke = aD ? "hsl(0, 0%, 15%)" : aP ? "hsl(0, 70%, 50%)" : "url(#splitGradient)";
          } else if (oneSide) {
            const sideGate = gateSet.has(ch.gates[0]) ? ch.gates[0] : ch.gates[1];
            stroke = pGates.has(sideGate) ? "hsl(0, 60%, 70%)" : "hsl(0, 0%, 55%)";
          }

          return (
            <line
              key={ch.id}
              x1={x1} y1={y1} x2={x2} y2={y2}
              stroke={stroke}
              strokeWidth={isActive ? 3.2 : 1.2}
              strokeOpacity={isActive ? 0.95 : oneSide ? 0.6 : 0.3}
              filter={isActive ? "url(#glow)" : undefined}
              strokeLinecap="round"
            />
          );
        })}

        {/* Gates */}
        {Object.entries(GATE_POS).map(([gateStr, [cx, cy]]) => {
          const gateNum = Number(gateStr);
          const active = gateSet.has(gateNum);
          const fromP = pGates.has(gateNum);
          const fromD = dGates.has(gateNum);
          let fill = "hsl(0, 0%, 100%)";
          let stroke = "hsl(215, 25%, 55%)";
          let textFill = "hsl(215, 35%, 30%)";
          if (active) {
            if (fromP && fromD) { fill = "url(#splitGradient)"; stroke = "hsl(0, 0%, 15%)"; textFill = "hsl(0, 0%, 100%)"; }
            else if (fromP) { fill = "hsl(0, 70%, 50%)"; stroke = "hsl(0, 70%, 35%)"; textFill = "hsl(0, 0%, 100%)"; }
            else { fill = "hsl(0, 0%, 15%)"; stroke = "hsl(0, 0%, 0%)"; textFill = "hsl(0, 0%, 100%)"; }
          }
          return (
            <g key={gateNum}>
              <circle cx={cx} cy={cy} r={GATE_R} fill={fill} stroke={stroke} strokeWidth={1.3} />
              <text
                x={cx} y={cy + 3.2}
                textAnchor="middle"
                fill={textFill}
                fontSize="9"
                fontFamily="DM Sans, sans-serif"
                fontWeight="600"
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
