// Matchmaking entry point: real players first, bot fallback.

import { levelForXp, Profile } from '../storage';
import { randomOpponent } from '../opponents';
import { findOnlineMatch } from './online';
import { BotSession, GameSession } from './session';

export type { GameSession, RpsHand } from './session';

/** How long we look for a real opponent before falling back to a bot. */
const ONLINE_SEARCH_MS = 6500;

export async function findMatch(
  profile: Profile,
  playerFlag: string,
): Promise<GameSession> {
  const level = levelForXp(profile.xp);
  try {
    const online = await findOnlineMatch(
      { name: profile.name, flag: playerFlag, level },
      ONLINE_SEARCH_MS,
    );
    if (online) return online;
  } catch {
    // fall through to bot
  }
  return new BotSession(randomOpponent(level));
}
