// Greedy bot with one-ply giveaway avoidance. Difficulty mixes in randomness.

import { Match, legalMoves, moveNewEdges } from './engine';
import { BONUS_POINTS, Move, PlayerId } from './types';

export type Difficulty = 'easy' | 'normal' | 'hard';

const MISTAKE_CHANCE: Record<Difficulty, number> = {
  easy: 0.45,
  normal: 0.2,
  hard: 0.05,
};

/** Points the move immediately scores for the mover. */
function immediateGain(match: Match, move: Move): number {
  const fresh = moveNewEdges(match, move);
  if (!fresh) return -1;
  const drawn = new Set(match.state.drawnEdges.keys());
  for (const id of fresh) drawn.add(id);
  let gain = 0;
  for (const tri of match.board.triangles) {
    if (match.state.claimedTriangles.has(tri.id)) continue;
    if (!tri.edgeIds.some((e) => fresh.includes(e))) continue;
    if (tri.edgeIds.every((e) => drawn.has(e))) gain += BONUS_POINTS[tri.bonus];
  }
  return gain;
}

/** Points the opponent could grab with one edge after this move. */
function giveaway(match: Match, move: Move): number {
  const fresh = moveNewEdges(match, move);
  if (!fresh) return 0;
  const drawn = new Set(match.state.drawnEdges.keys());
  for (const id of fresh) drawn.add(id);
  let risk = 0;
  for (const tri of match.board.triangles) {
    if (match.state.claimedTriangles.has(tri.id)) continue;
    const missing = tri.edgeIds.filter((e) => !drawn.has(e));
    if (missing.length === 1) risk += BONUS_POINTS[tri.bonus];
  }
  return risk;
}

export function pickBotMove(
  match: Match,
  difficulty: Difficulty = 'normal',
  random: () => number = Math.random,
): Move | null {
  const moves = legalMoves(match);
  if (moves.length === 0) return null;

  // Occasionally play a random move to feel human.
  if (random() < MISTAKE_CHANCE[difficulty]) {
    return moves[Math.floor(random() * moves.length)];
  }

  let best: Move = moves[0];
  let bestScore = -Infinity;
  for (const m of moves) {
    const gain = immediateGain(match, m);
    const risk = giveaway(match, m);
    // Prefer scoring now, avoid handing points over.
    const score = gain * 10 - risk * 6 + random() * 0.25;
    if (score > bestScore) {
      bestScore = score;
      best = m;
    }
  }
  return best;
}
