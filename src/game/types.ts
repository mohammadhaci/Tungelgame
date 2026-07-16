// Core shared types for the Tungel Rings game engine.

/** Axial hex-lattice coordinate of a peg. */
export interface Peg {
  q: number;
  r: number;
}

/** Canonical edge between two adjacent pegs (a is always "smaller" than b). */
export interface Edge {
  id: string;
  a: Peg;
  b: Peg;
}

export type TriangleBonus = 'none' | 'blue' | 'purple';

/** A unit triangle formed by three pegs / three edges. */
export interface Triangle {
  id: string;
  pegs: [Peg, Peg, Peg];
  edgeIds: [string, string, string];
  bonus: TriangleBonus;
}

export type PlayerId = 0 | 1;

export interface GameConfig {
  /** Hexagon side length in pegs (5 => 9 pegs across the middle row). */
  boardSide: number;
  /** Exact band length in edges: every band must span this many unit edges
   *  (bandSpan 3 = a line touching exactly 4 pegs). */
  bandSpan: number;
  /** Rubber bands each player can place during a match. */
  bandsPerPlayer: number;
  /** How many triangles get a blue (x2) bonus mark. */
  blueBonusCount: number;
  /** How many triangles get a purple (x3) bonus mark. */
  purpleBonusCount: number;
}

export const DEFAULT_CONFIG: GameConfig = {
  boardSide: 5,
  bandSpan: 3,
  bandsPerPlayer: 10,
  blueBonusCount: 5,
  purpleBonusCount: 2,
};

export const BONUS_POINTS: Record<TriangleBonus, number> = {
  none: 1,
  blue: 2,
  purple: 3,
};

/** A move: stretch a band in a straight lattice line from one peg to another. */
export interface Move {
  from: Peg;
  to: Peg;
}

export interface GameState {
  config: GameConfig;
  /** Which player's turn it is now. */
  turn: PlayerId;
  /** Edge id -> player who drew it. */
  drawnEdges: Map<string, PlayerId>;
  /** Triangle id -> player who claimed it. */
  claimedTriangles: Map<string, PlayerId>;
  /** Bands each player has already used. */
  bandsUsed: [number, number];
  scores: [number, number];
  /** Bands placed, in order, for rendering (each is a straight segment). */
  placedBands: { move: Move; player: PlayerId }[];
  finished: boolean;
  winner: PlayerId | null; // null while running, or on a draw
}
