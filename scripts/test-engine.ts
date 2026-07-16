// Sanity tests for board geometry, engine rules, and bot self-play.
// Run: npx tsx scripts/test-engine.ts

import { buildBoard, pathEdges, pegToXY } from '../src/game/board';
import { applyMove, bandsLeft, createMatch, legalMoves } from '../src/game/engine';
import { pickBotMove } from '../src/game/bot';
import { DEFAULT_CONFIG } from '../src/game/types';

let failures = 0;
function check(name: string, cond: boolean) {
  if (!cond) {
    failures++;
    console.error(`FAIL: ${name}`);
  } else {
    console.log(`ok:   ${name}`);
  }
}

// --- geometry ---
const board = buildBoard(5);
check('hex side 5 has 61 pegs', board.pegs.length === 61);
// edges of a triangular hexagon side N: 3 * (3N^2 - 5N + 2) for N pegs/side? verify by count
check('every edge connects two board pegs', [...board.edges.values()].every(
  (e) => board.pegSet.has(`${e.a.q},${e.a.r}`) && board.pegSet.has(`${e.b.q},${e.b.r}`),
));
check('hex side 5 has 96 unit triangles', board.triangles.length === 6 * 16);
check('each triangle has 3 distinct edges', board.triangles.every(
  (t) => new Set(t.edgeIds).size === 3 && t.edgeIds.every((e) => board.edges.has(e)),
));

const straight = pathEdges(board, { q: -2, r: 0 }, { q: 2, r: 0 });
check('straight path across middle covers 4 edges', straight !== null && straight.length === 4);
check('diagonal q=-r path is valid', pathEdges(board, { q: 0, r: -2 }, { q: -2, r: 0 })?.length === 2);
check('diagonal along r is valid', pathEdges(board, { q: 0, r: -2 }, { q: 0, r: 2 })?.length === 4);
check('anti-diagonal (dq=-dr) is valid', pathEdges(board, { q: 2, r: -2 }, { q: -2, r: 2 })?.length === 4);
check('non-lattice-line path rejected', pathEdges(board, { q: 0, r: 0 }, { q: 2, r: 1 }) === null);
check('zero-length path rejected', pathEdges(board, { q: 0, r: 0 }, { q: 0, r: 0 }) === null);

const xy = pegToXY({ q: 1, r: 1 });
check('pegToXY sane', Math.abs(xy.x - 1.5) < 1e-9 && Math.abs(xy.y - Math.sqrt(3) / 2) < 1e-9);

// --- engine rules ---
const seeded = (() => { let s = 42; return () => { s = (s * 1664525 + 1013904223) % 4294967296; return s / 4294967296; }; })();
const match = createMatch(DEFAULT_CONFIG, 0, seeded);
check('match starts unfinished, player 0 turn', !match.state.finished && match.state.turn === 0);
check('bonus counts respected',
  match.board.triangles.filter((t) => t.bonus === 'purple').length === 2 &&
  match.board.triangles.filter((t) => t.bonus === 'blue').length === 5);

const first = { from: { q: 0, r: 0 }, to: { q: 1, r: 0 } };
const res1 = applyMove(match, first);
check('first move claims nothing', res1.claimed.length === 0);
check('turn passed to player 1', match.state.turn === 1);
check('band consumed', bandsLeft(match, 0) === 9);

// complete a triangle: edges (0,0)-(1,0) done; add (0,0)-(0,1) and (1,0)-(0,1)
applyMove(match, { from: { q: 0, r: 0 }, to: { q: 0, r: 1 } }); // player 1
const res3 = applyMove(match, { from: { q: 1, r: 0 }, to: { q: 0, r: 1 } }); // player 0 closes it
check('closing third edge claims exactly one triangle', res3.claimed.length === 1);
check('closer got the points', match.state.scores[0] >= 1 && match.state.scores[1] === 0);

let threw = false;
try { applyMove(match, first); } catch { threw = true; }
check('re-drawing an existing band is illegal', threw);

// overlapping longer band that includes drawn edges but adds fresh ones is legal
const res4 = applyMove(match, { from: { q: -1, r: 0 }, to: { q: 2, r: 0 } });
check('overlap move allowed when it adds fresh edges', res4 !== null);

// --- full bot self-play: game must terminate, bands respected ---
for (const diff of ['easy', 'normal', 'hard'] as const) {
  const m2 = createMatch(DEFAULT_CONFIG, 1, seeded);
  let guard = 0;
  while (!m2.state.finished && guard++ < 100) {
    const mv = pickBotMove(m2, diff, seeded);
    if (!mv) break;
    applyMove(m2, mv);
  }
  check(`self-play (${diff}) finished`, m2.state.finished);
  check(`self-play (${diff}) bands within limit`,
    m2.state.bandsUsed[0] <= 10 && m2.state.bandsUsed[1] <= 10);
  check(`self-play (${diff}) used all bands or board full`,
    (m2.state.bandsUsed[0] === 10 && m2.state.bandsUsed[1] === 10) ||
    m2.state.claimedTriangles.size === m2.board.triangles.length);
  const totalPts = [...m2.state.claimedTriangles.keys()].reduce((s, tid) => {
    const t = m2.board.triangles.find((x) => x.id === tid)!;
    return s + (t.bonus === 'purple' ? 3 : t.bonus === 'blue' ? 2 : 1);
  }, 0);
  check(`self-play (${diff}) scores add up`, m2.state.scores[0] + m2.state.scores[1] === totalPts);
}

// legalMoves sanity: fresh match has plenty of moves, all unique
const m3 = createMatch(DEFAULT_CONFIG, 0, seeded);
const lm = legalMoves(m3);
check('fresh match has many legal moves', lm.length > 100);
const keys = new Set(lm.map((m) => `${m.from.q},${m.from.r}>${m.to.q},${m.to.r}`));
check('legal moves are unique', keys.size === lm.length);

if (failures > 0) {
  console.error(`\n${failures} test(s) FAILED`);
  process.exit(1);
}
console.log('\nAll engine tests passed.');
