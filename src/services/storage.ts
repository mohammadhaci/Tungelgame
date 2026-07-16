// Player profile persistence via AsyncStorage.

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Lang } from '../i18n';

export interface Ring {
  /** Index into the ring art set (assets/img/ring-N.png). */
  variant: number;
}

export interface Profile {
  /** Display name shown to online opponents. */
  name: string;
  coins: number;
  rings: Ring[];
  wins: number;
  gamesPlayed: number;
  xp: number;
  lang: Lang;
}

const KEY = 'tungel.profile.v1';

export const DEFAULT_PROFILE: Profile = {
  name: '',
  coins: 25,
  rings: [],
  wins: 0,
  gamesPlayed: 0,
  xp: 0,
  lang: 'ar',
};

export async function loadProfile(): Promise<Profile> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return { ...DEFAULT_PROFILE, name: generatePlayerName() };
    const parsed = { ...DEFAULT_PROFILE, ...JSON.parse(raw) };
    // migrate rings saved by older versions (they had color/gem fields)
    parsed.rings = (parsed.rings ?? []).map((r: Partial<Ring>) => ({
      variant:
        typeof r.variant === 'number' && r.variant >= 0 && r.variant < RING_VARIANTS
          ? r.variant
          : Math.floor(Math.random() * RING_VARIANTS),
    }));
    if (!parsed.name) parsed.name = generatePlayerName();
    return parsed;
  } catch {
    return { ...DEFAULT_PROFILE, name: generatePlayerName() };
  }
}

export function generatePlayerName(): string {
  return `Player${1000 + Math.floor(Math.random() * 9000)}`;
}

export async function saveProfile(profile: Profile): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(profile));
  } catch {
    // non-fatal: progress just won't persist this time
  }
}

export function levelForXp(xp: number): number {
  return Math.floor(xp / 100) + 1;
}

export const RING_VARIANTS = 6;

export function randomRing(): Ring {
  return { variant: Math.floor(Math.random() * RING_VARIANTS) };
}
