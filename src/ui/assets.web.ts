// Game art (web): data URIs so the exported demo is a single HTML file.
// Regenerate assets-b64.ts with: node scripts/gen-web-assets.js

import { GameImages } from './assets-types';
import { B64 } from './assets-b64';

const u = (key: string) => ({ uri: B64[key] });

export const IMG: GameImages = {
  bgWood: u('bg-wood'),
  bgHome: u('bg-home'),
  bgVs: u('bg-vs'),
  money: u('money'),
  trophy: u('trophy'),
  rings: [u('ring-0'), u('ring-1'), u('ring-2'), u('ring-3'), u('ring-4'), u('ring-5')],
  handRock: u('hand-rock'),
  handPaper: u('hand-paper'),
  handScissors: u('hand-scissors'),
};

export const RING_COUNT = 6;
