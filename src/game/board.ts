// Hexagonal triangular-lattice board geometry.
//
// Pegs live on axial coordinates (q, r) constrained to a hexagon of side N:
//   |q| <= N-1, |r| <= N-1, |q + r| <= N-1
// Pixel position: x = q + r/2, y = r * sqrt(3)/2  (unit spacing, scaled by the UI).

import { Edge, Peg, Triangle, TriangleBonus } from './types';

export const DIRECTIONS: Peg[] = [
  { q: 1, r: 0 },
  { q: 0, r: 1 },
  { q: -1, r: 1 },
  { q: -1, r: 0 },
  { q: 0, r: -1 },
  { q: 1, r: -1 },
];

/** The three canonical directions used to enumerate edges without duplicates. */
const EDGE_DIRECTIONS: Peg[] = [
  { q: 1, r: 0 },
  { q: 0, r: 1 },
  { q: -1, r: 1 },
];

export const pegKey = (p: Peg): string => `${p.q},${p.r}`;

export function edgeId(a: Peg, b: Peg): string {
  const [first, second] =
    a.r < b.r || (a.r === b.r && a.q <= b.q) ? [a, b] : [b, a];
  return `${pegKey(first)}|${pegKey(second)}`;
}

export function inHex(p: Peg, side: number): boolean {
  const n = side - 1;
  return (
    Math.abs(p.q) <= n && Math.abs(p.r) <= n && Math.abs(p.q + p.r) <= n
  );
}

export function pegToXY(p: Peg): { x: number; y: number } {
  return { x: p.q + p.r / 2, y: (p.r * Math.sqrt(3)) / 2 };
}

export interface Board {
  side: number;
  pegs: Peg[];
  pegSet: Set<string>;
  edges: Map<string, Edge>;
  triangles: Triangle[];
  /** edge id -> triangle ids that contain it */
  edgeToTriangles: Map<string, string[]>;
}

export function buildBoard(side: number): Board {
  const pegs: Peg[] = [];
  const n = side - 1;
  for (let q = -n; q <= n; q++) {
    for (let r = -n; r <= n; r++) {
      const p = { q, r };
      if (inHex(p, side)) pegs.push(p);
    }
  }
  const pegSet = new Set(pegs.map(pegKey));

  const edges = new Map<string, Edge>();
  for (const p of pegs) {
    for (const d of EDGE_DIRECTIONS) {
      const nb = { q: p.q + d.q, r: p.r + d.r };
      if (pegSet.has(pegKey(nb))) {
        const id = edgeId(p, nb);
        if (!edges.has(id)) edges.set(id, { id, a: p, b: nb });
      }
    }
  }

  // Unit triangles: "up" = {p, p+(1,0), p+(0,1)} and "down" = {p+(1,0), p+(1,1)... }
  // Enumerate via the two triangles sitting on each horizontal edge [p, p+(1,0)]:
  //   with apex p+(0,1) (below-left) and apex p+(1,-1) (above).
  const triangles: Triangle[] = [];
  const seen = new Set<string>();
  const tryTriangle = (a: Peg, b: Peg, c: Peg) => {
    if (!pegSet.has(pegKey(a)) || !pegSet.has(pegKey(b)) || !pegSet.has(pegKey(c)))
      return;
    const ids = [edgeId(a, b), edgeId(b, c), edgeId(a, c)].sort() as [
      string,
      string,
      string,
    ];
    const tid = ids.join('#');
    if (seen.has(tid)) return;
    seen.add(tid);
    triangles.push({ id: tid, pegs: [a, b, c], edgeIds: ids, bonus: 'none' });
  };
  for (const p of pegs) {
    const right = { q: p.q + 1, r: p.r };
    tryTriangle(p, right, { q: p.q, r: p.r + 1 });
    tryTriangle(p, right, { q: p.q + 1, r: p.r - 1 });
  }

  const edgeToTriangles = new Map<string, string[]>();
  for (const t of triangles) {
    for (const eid of t.edgeIds) {
      const list = edgeToTriangles.get(eid) ?? [];
      list.push(t.id);
      edgeToTriangles.set(eid, list);
    }
  }

  return { side, pegs, pegSet, edges, triangles, edgeToTriangles };
}

/** Deterministic-ish bonus assignment using a caller-provided RNG. */
export function assignBonuses(
  board: Board,
  blueCount: number,
  purpleCount: number,
  random: () => number = Math.random,
): void {
  for (const t of board.triangles) t.bonus = 'none';
  const indices = board.triangles.map((_, i) => i);
  // Fisher-Yates shuffle
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }
  const paint = (count: number, bonus: TriangleBonus, offset: number) => {
    for (let k = 0; k < count && offset + k < indices.length; k++) {
      board.triangles[indices[offset + k]].bonus = bonus;
    }
  };
  paint(purpleCount, 'purple', 0);
  paint(blueCount, 'blue', purpleCount);
}

/**
 * If `from` and `to` are distinct pegs on the same lattice line, return every
 * edge id along the straight path between them; otherwise null.
 */
export function pathEdges(board: Board, from: Peg, to: Peg): string[] | null {
  const dq = to.q - from.q;
  const dr = to.r - from.r;
  if (dq === 0 && dr === 0) return null;
  let dir: Peg | null = null;
  let steps = 0;
  if (dr === 0) {
    dir = { q: Math.sign(dq), r: 0 };
    steps = Math.abs(dq);
  } else if (dq === 0) {
    dir = { q: 0, r: Math.sign(dr) };
    steps = Math.abs(dr);
  } else if (dq === -dr) {
    dir = { q: Math.sign(dq), r: Math.sign(dr) };
    steps = Math.abs(dq);
  } else {
    return null;
  }
  const ids: string[] = [];
  let cur = from;
  for (let i = 0; i < steps; i++) {
    const next = { q: cur.q + dir.q, r: cur.r + dir.r };
    if (!board.pegSet.has(pegKey(next))) return null;
    ids.push(edgeId(cur, next));
    cur = next;
  }
  return ids;
}
