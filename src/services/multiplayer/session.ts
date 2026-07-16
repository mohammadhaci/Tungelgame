// GameSession abstracts "the opponent": a local bot or a real online player.
// The rest of the app talks to this interface only.

import { pickBotMove } from '../../game/bot';
import { Match } from '../../game/engine';
import { mulberry32, randomSeed } from '../../game/rng';
import { Move, PlayerId } from '../../game/types';
import { Opponent } from '../opponents';

export type RpsHand = 'rock' | 'paper' | 'scissors';

export interface GameSession {
  online: boolean;
  opponent: Opponent;
  /** Which engine player the local user controls (always 0 vs the bot). */
  localPlayer: PlayerId;
  /** Board seed — identical on both clients of an online match. */
  seed: number;

  /** Submit our RPS hand for `round`; resolves with the opponent's hand. */
  playRps(myHand: RpsHand, round: number): Promise<RpsHand>;

  /** Publish a local move (no-op for bot games). */
  sendMove(move: Move): void;
  /** Remote opponent moves arrive here (never fires for bot games). */
  setMoveListener(cb: (move: Move) => void): void;
  /** Fires when the opponent disconnects/quits mid-match (online only). */
  setLeaveListener(cb: () => void): void;

  /** Bot games only: compute the bot's reply for the current position. */
  requestBotMove?(match: Match): Move | null;

  /** Tell the other side we are leaving (forfeit). */
  leave(): void;
  dispose(): void;
}

const HANDS: RpsHand[] = ['rock', 'paper', 'scissors'];

export class BotSession implements GameSession {
  online = false;
  localPlayer: PlayerId = 0;
  seed = randomSeed();
  private rng = mulberry32(this.seed ^ 0x9e3779b9);

  constructor(public opponent: Opponent) {}

  playRps(_myHand: RpsHand, _round: number): Promise<RpsHand> {
    const hand = HANDS[Math.floor(this.rng() * 3)];
    return Promise.resolve(hand);
  }

  sendMove(): void {}
  setMoveListener(): void {}
  setLeaveListener(): void {}

  requestBotMove(match: Match): Move | null {
    return pickBotMove(match, this.opponent.difficulty);
  }

  leave(): void {}
  dispose(): void {}
}
