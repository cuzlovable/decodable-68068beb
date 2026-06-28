import { describe, it, expect } from "vitest";
import { GATE_POS, CENTER_SHAPES } from "./Bodygraph";
import { CENTERS, type CenterId } from "@/lib/humandesign";

// Geometry helpers — match the SVG shapes in Bodygraph.tsx.
function pointInTriangle(
  p: [number, number],
  a: [number, number],
  b: [number, number],
  c: [number, number],
): boolean {
  const [px, py] = p;
  const sign = (
    p1: [number, number],
    p2: [number, number],
    p3: [number, number],
  ) => (p1[0] - p3[0]) * (p2[1] - p3[1]) - (p2[0] - p3[0]) * (p1[1] - p3[1]);
  const d1 = sign([px, py], a, b);
  const d2 = sign([px, py], b, c);
  const d3 = sign([px, py], c, a);
  const hasNeg = d1 < 0 || d2 < 0 || d3 < 0;
  const hasPos = d1 > 0 || d2 > 0 || d3 > 0;
  return !(hasNeg && hasPos);
}

function pointInRect(
  [px, py]: [number, number],
  x: number,
  y: number,
  w: number,
  h: number,
): boolean {
  return px >= x && px <= x + w && py >= y && py <= y + h;
}

function pointInDiamond(
  [px, py]: [number, number],
  cx: number,
  cy: number,
  r: number,
): boolean {
  return Math.abs(px - cx) + Math.abs(py - cy) <= r;
}

function pointInShape(
  p: [number, number],
  shape: (typeof CENTER_SHAPES)[CenterId]["shape"],
): boolean {
  switch (shape.kind) {
    case "triangle":
      return pointInTriangle(p, shape.points[0], shape.points[1], shape.points[2]);
    case "rect":
      return pointInRect(p, shape.x, shape.y, shape.w, shape.h);
    case "diamond":
      return pointInDiamond(p, shape.cx, shape.cy, shape.r);
  }
}

// Build the canonical gate → center mapping from the Human Design data model.
const GATE_TO_CENTER = new Map<number, CenterId>();
for (const [centerId, center] of Object.entries(CENTERS) as [CenterId, { gates: number[] }][]) {
  for (const g of center.gates) GATE_TO_CENTER.set(g, centerId);
}

describe("Bodygraph gate → SVG mapping", () => {
  it("has an SVG position for all 64 gates", () => {
    const missing: number[] = [];
    for (let g = 1; g <= 64; g++) {
      if (!GATE_POS[g]) missing.push(g);
    }
    expect(missing).toEqual([]);
  });

  it("has no extra gates beyond 1..64", () => {
    const extras = Object.keys(GATE_POS)
      .map(Number)
      .filter((g) => g < 1 || g > 64);
    expect(extras).toEqual([]);
  });

  it("renders every gate's SVG circle inside the shape of its owning center", () => {
    const offenders: Array<{ gate: number; center: CenterId; pos: [number, number] }> = [];
    for (const [gateStr, pos] of Object.entries(GATE_POS)) {
      const gate = Number(gateStr);
      const center = GATE_TO_CENTER.get(gate);
      expect(center, `gate ${gate} is missing from CENTERS data`).toBeTruthy();
      const shape = CENTER_SHAPES[center!].shape;
      if (!pointInShape(pos, shape)) offenders.push({ gate, center: center!, pos });
    }
    expect(offenders, `Gates rendered outside their center shape: ${JSON.stringify(offenders)}`).toEqual([]);
  });

  it("does not place two different gates at the exact same coordinates", () => {
    const seen = new Map<string, number>();
    const dupes: Array<[number, number]> = [];
    for (const [gateStr, [x, y]] of Object.entries(GATE_POS)) {
      const key = `${x},${y}`;
      const prev = seen.get(key);
      if (prev !== undefined) dupes.push([prev, Number(gateStr)]);
      else seen.set(key, Number(gateStr));
    }
    expect(dupes).toEqual([]);
  });
});
