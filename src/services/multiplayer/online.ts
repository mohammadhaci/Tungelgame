// Real-player matchmaking and match sync over Firebase Realtime Database.
//
// Data layout:
//   queue/{uid}   = { uid, name, flag, level, createdAt, matchId|null, claimer? }
//   matches/{mid} = { createdAt, seed, p0:{uid,name,flag}, p1:{...},
//                     rps/{round}/{p0|p1}: hand,
//                     moves/{pushId}: { by, fq, fr, tq, tr },
//                     leftBy?: uid }
//
// Matching: scan the queue and atomically claim someone's ticket (claimer
// becomes p1); otherwise post a ticket and wait to be claimed (we are p0).
// While waiting we periodically rescan; before claiming we self-lock our own
// ticket so two players can never end up in two different matches.

import {
  Database, DataSnapshot, get, limitToFirst, onChildAdded, onDisconnect,
  onValue, orderByChild, push, query, ref, remove, runTransaction,
  serverTimestamp, set, Unsubscribe,
} from 'firebase/database';
import { randomSeed } from '../../game/rng';
import { Move, PlayerId } from '../../game/types';
import { getFirebase } from '../firebase';
import { Opponent } from '../opponents';
import { GameSession, RpsHand } from './session';

const TICKET_FRESH_MS = 60_000;
const RPS_WAIT_MS = 60_000;

interface PlayerInfo {
  uid: string;
  name: string;
  flag: string;
}

export class OnlineSession implements GameSession {
  online = true;
  opponent: Opponent;
  private unsubs: Unsubscribe[] = [];
  private disposed = false;

  constructor(
    private db: Database,
    private uid: string,
    private matchId: string,
    public localPlayer: PlayerId,
    opponentInfo: PlayerInfo,
    public seed: number,
  ) {
    this.opponent = {
      name: opponentInfo.name,
      flag: opponentInfo.flag,
      difficulty: 'normal', // unused online
    };
    // If our connection dies mid-match, concede automatically.
    onDisconnect(this.leftByRef()).set(this.uid).catch(() => {});
  }

  private matchRef(path = '') {
    return ref(this.db, `matches/${this.matchId}${path ? '/' + path : ''}`);
  }

  private leftByRef() {
    return this.matchRef('leftBy');
  }

  private roleKey(player: PlayerId): 'p0' | 'p1' {
    return player === 0 ? 'p0' : 'p1';
  }

  playRps(myHand: RpsHand, round: number): Promise<RpsHand> {
    const mine = this.matchRef(`rps/${round}/${this.roleKey(this.localPlayer)}`);
    const theirs = this.matchRef(
      `rps/${round}/${this.roleKey((1 - this.localPlayer) as PlayerId)}`,
    );
    set(mine, myHand).catch(() => {});
    return new Promise<RpsHand>((resolve, reject) => {
      const timer = setTimeout(() => {
        unsub();
        reject(new Error('rps timeout'));
      }, RPS_WAIT_MS);
      const unsub = onValue(theirs, (snap) => {
        const val = snap.val();
        if (val) {
          clearTimeout(timer);
          unsub();
          resolve(val as RpsHand);
        }
      });
      this.unsubs.push(unsub);
    });
  }

  sendMove(move: Move): void {
    push(this.matchRef('moves'), {
      by: this.localPlayer,
      fq: move.from.q, fr: move.from.r,
      tq: move.to.q, tr: move.to.r,
    }).catch(() => {});
  }

  setMoveListener(cb: (move: Move) => void): void {
    const unsub = onChildAdded(this.matchRef('moves'), (snap: DataSnapshot) => {
      const v = snap.val();
      if (!v || v.by === this.localPlayer) return; // ignore our own echo
      cb({ from: { q: v.fq, r: v.fr }, to: { q: v.tq, r: v.tr } });
    });
    this.unsubs.push(unsub);
  }

  setLeaveListener(cb: () => void): void {
    const unsub = onValue(this.leftByRef(), (snap) => {
      const val = snap.val();
      if (val && val !== this.uid) cb();
    });
    this.unsubs.push(unsub);
  }

  leave(): void {
    set(this.leftByRef(), this.uid).catch(() => {});
    this.dispose();
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.unsubs.forEach((u) => u());
    this.unsubs = [];
    onDisconnect(this.leftByRef()).cancel().catch(() => {});
  }
}

/**
 * Try to find a real opponent within `timeoutMs`. Resolves with an
 * OnlineSession, or null when no player showed up / Firebase unreachable.
 */
export async function findOnlineMatch(
  me: { name: string; flag: string; level: number },
  timeoutMs: number,
): Promise<OnlineSession | null> {
  const fb = await getFirebase();
  if (!fb) return null;
  const { db, uid } = fb;
  const myInfo: PlayerInfo = { uid, name: me.name, flag: me.flag };
  const myTicketRef = ref(db, `queue/${uid}`);

  const tryClaimSomeone = async (): Promise<OnlineSession | null> => {
    let snap;
    try {
      snap = await get(query(ref(db, 'queue'), orderByChild('createdAt'), limitToFirst(10)));
    } catch {
      return null;
    }
    const now = Date.now();
    const tickets: any[] = [];
    snap.forEach((c) => {
      tickets.push(c.val());
    });
    for (const t of tickets) {
      if (!t || t.uid === uid || t.matchId || !t.createdAt) continue;
      if (now - t.createdAt > TICKET_FRESH_MS) continue;
      const mid = push(ref(db, 'matches')).key!;
      try {
        const res = await runTransaction(ref(db, `queue/${t.uid}`), (cur) => {
          // First run may see null (empty local cache): return an optimistic
          // claim — the server rejects it if the real data differs and the
          // callback re-runs with the actual ticket.
          if (cur === null) return { ...t, matchId: mid, claimer: myInfo };
          if (cur.matchId) return undefined; // taken — abort
          return { ...cur, matchId: mid, claimer: myInfo };
        });
        if (res.committed && res.snapshot.val()?.matchId === mid) {
          const seed = randomSeed();
          await set(ref(db, `matches/${mid}`), {
            createdAt: serverTimestamp(),
            seed,
            p0: { uid: t.uid, name: t.name, flag: t.flag },
            p1: myInfo,
          });
          return new OnlineSession(db, uid, mid, 1, { uid: t.uid, name: t.name, flag: t.flag }, seed);
        }
      } catch {
        // rules rejected or contention — try next ticket
      }
    }
    return null;
  };

  // 1) claim straight away if someone is already waiting
  const immediate = await tryClaimSomeone();
  if (immediate) return immediate;

  // 2) post our ticket and wait to be claimed, rescanning periodically
  try {
    await set(myTicketRef, {
      uid, name: me.name, flag: me.flag, level: me.level,
      createdAt: Date.now(), matchId: null,
    });
    onDisconnect(myTicketRef).remove().catch(() => {});
  } catch {
    return null;
  }

  return new Promise<OnlineSession | null>((resolve) => {
    let settled = false;
    let unsubTicket: Unsubscribe = () => {};
    let rescan: ReturnType<typeof setInterval>;
    let timeout: ReturnType<typeof setTimeout>;

    const finish = (session: OnlineSession | null) => {
      if (settled) return;
      settled = true;
      clearInterval(rescan);
      clearTimeout(timeout);
      unsubTicket();
      if (!session) {
        remove(myTicketRef).catch(() => {});
      }
      onDisconnect(myTicketRef).cancel().catch(() => {});
      resolve(session);
    };

    // someone claimed our ticket -> we are p0
    unsubTicket = onValue(myTicketRef, async (snap) => {
      const v = snap.val();
      if (!v?.matchId || v.matchId === 'self-lock' || !v.claimer) return;
      const mid = v.matchId;
      // wait for the claimer to write the match node (it may lag the claim)
      for (let i = 0; i < 20 && !settled; i++) {
        try {
          const m = await get(ref(db, `matches/${mid}`));
          const mv = m.val();
          if (mv?.seed != null) {
            remove(myTicketRef).catch(() => {});
            finish(new OnlineSession(db, uid, mid, 0, v.claimer, mv.seed));
            return;
          }
        } catch {
          break;
        }
        await new Promise((r) => setTimeout(r, 250));
      }
    });

    // periodic rescan: self-lock our ticket, try to claim, unlock on failure
    rescan = setInterval(async () => {
      if (settled) return;
      try {
        const lock = await runTransaction(myTicketRef, (cur) => {
          if (!cur) return cur;
          if (cur.matchId === null) return { ...cur, matchId: 'self-lock' };
          return undefined; // already claimed or locked — abort
        });
        if (!lock.committed || lock.snapshot.val()?.matchId !== 'self-lock') return;
      } catch {
        return;
      }
      const claimed = await tryClaimSomeone();
      if (claimed) {
        remove(myTicketRef).catch(() => {});
        finish(claimed);
      } else {
        runTransaction(myTicketRef, (cur) => {
          if (!cur) return cur;
          if (cur.matchId === 'self-lock') return { ...cur, matchId: null };
          return undefined;
        }).catch(() => {});
      }
    }, 2500);

    timeout = setTimeout(() => finish(null), timeoutMs);
  });
}
