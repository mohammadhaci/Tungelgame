// Player profile persistence via AsyncStorage.

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Lang } from '../i18n';

export interface Ring {
  color: string;
  gem: string;
}

export interface Profile {
  coins: number;
  rings: Ring[];
  wins: number;
  gamesPlayed: number;
  xp: number;
  lang: Lang;
}

const KEY = 'tungel.profile.v1';

export const DEFAULT_PROFILE: Profile = {
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
    if (!raw) return { ...DEFAULT_PROFILE };
    return { ...DEFAULT_PROFILE, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_PROFILE };
  }
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

const RING_COLORS = ['#e74c3c', '#9b59b6', '#3498db', '#2ecc71', '#f1c40f', '#e67e22', '#ff6fa5'];
const RING_GEMS = ['💎', '⭐', '🔶', '🟢', '🟣', '🌸'];

export function randomRing(): Ring {
  return {
    color: RING_COLORS[Math.floor(Math.random() * RING_COLORS.length)],
    gem: RING_GEMS[Math.floor(Math.random() * RING_GEMS.length)],
  };
}
