// Match engine: applies moves, claims triangles, tracks scores and game end.

import { assignBonuses, Board, buildBoard, pathEdges } from './board';
import {
  BONUS_POINTS,
  DEFAULT_CONFIG,
  GameConfig,
  GameState,
  Move,
  PlayerId,
} from './types';

export interface Match {
  board: Board;
  state: GameState;
}

export function createMatch(
  config: GameConfig = DEFAULT_CONFIG,
  firstPlayer: PlayerId = 0,
  random: () => number = Math.random,
): Match {
  const board = buildBoard(config.boardSide);
  assignBonuses(board, config.blueBonusCount, config.purpleBonusCount, random);
  return {
    board,
    state: {
      config,
      turn: firstPlayer,
      drawnEdges: new Map(),
      claimedTriangles: new Map(),
      bandsUsed: [0, 0],
      scores: [0, 0],
      placedBands: [],
      finished: false,
      winner: null,
    },
  };
}

/** Edge ids the move would newly draw, or null if the move is illegal. */
export function moveNewEdges(match: Match, move: Move): string[] | null {
  const path = pathEdges(match.board, move.from, move.to);
  if (!path) return null;
  const fresh = path.filter((id) => !match.state.drawnEdges.has(id));
  return fresh.length > 0 ? fresh : null;
}

export interface MoveResult {
  claimed: { triangleId: string; points: number }[];
  pointsGained: number;
}

/** Apply a move for the current player. Throws on illegal moves. */
export function applyMove(match: Match, move: Move): MoveResult {
  const { state, board } = match;
  if (state.finished) throw new Error('game finished');
  const player = state.turn;
  const fresh = moveNewEdges(match, move);
  if (!fresh) throw new Error('illegal move');

  for (const id of fresh) state.drawnEdges.set(id, player);
  state.placedBands.push({ move, player });
  state.bandsUsed[player] += 1;

  const claimed: MoveResult['claimed'] = [];
  for (const eid of fresh) {
    for (const tid of board.edgeToTriangles.get(eid) ?? []) {
      if (state.claimedTriangles.has(tid)) continue;
      const tri = board.triangles.find((t) => t.id === tid)!;
      const complete = tri.edgeIds.every((e) => state.drawnEdges.has(e));
      if (complete) {
        state.claimedTriangles.set(tid, player);
        const points = BONUS_POINTS[tri.bonus];
        state.scores[player] += points;
        claimed.push({ triangleId: tid, points });
      }
    }
  }

  advanceTurnOrFinish(match);
  return {
    claimed,
    pointsGained: claimed.reduce((s, c) => s + c.points, 0),
  };
}

function advanceTurnOrFinish(match: Match): void {
  const { state, board } = match;
  const allClaimed = state.claimedTriangles.size >= board.triangles.length;
  const next: PlayerId = state.turn === 0 ? 1 : 0;
  const nextHasBands = state.bandsUsed[next] < state.config.bandsPerPlayer;
  const curHasBands = state.bandsUsed[state.turn] < state.config.bandsPerPlayer;

  if (allClaimed || (!nextHasBands && !curHasBands)) {
    state.finished = true;
    state.winner =
      state.scores[0] > state.scores[1]
        ? 0
        : state.scores[1] > state.scores[0]
          ? 1
          : null;
    return;
  }
  if (nextHasBands) {
    state.turn = next;
  }
  // otherwise current player keeps playing their remaining bands
}

export function bandsLeft(match: Match, player: PlayerId): number {
  return match.state.config.bandsPerPlayer - match.state.bandsUsed[player];
}

/** All legal moves (straight peg-to-peg spans that draw at least one new edge). */
export function legalMoves(match: Match): Move[] {
  const { board, state } = match;
  const moves: Move[] = [];
  const dirs = [
    { q: 1, r: 0 },
    { q: 0, r: 1 },
    { q: -1, r: 1 },
  ];
  for (const from of board.pegs) {
    for (const d of dirs) {
      let cur = from;
      let anyFresh = false;
      // extend step by step; each prefix is a candidate move
      for (;;) {
        const next = { q: cur.q + d.q, r: cur.r + d.r };
        if (!board.pegSet.has(`${next.q},${next.r}`)) break;
        const path = pathEdges(board, from, next)!;
        if (path.some((id) => !state.drawnEdges.has(id))) anyFresh = true;
        if (anyFresh) moves.push({ from, to: next });
        cur = next;
      }
    }
  }
  return moves;
}
