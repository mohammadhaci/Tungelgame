// Simulated "online" opponents: realistic usernames + country flags.
// Real-time PvP can later replace this module behind the same interface.

import { Difficulty } from '../game/bot';

export interface Opponent {
  name: string;
  flag: string;
  difficulty: Difficulty;
}

const NAMES = [
  'DreadKnight66', 'LunaStar', 'MaxPower_7', 'Aylin34', 'ShadowFox',
  'KingOmar99', 'Sakura_chan', 'BlitzMeister', 'NoorPlays', 'IcyWolf',
  'PixelHunter', 'ZaraQueen', 'TurboTim', 'MightyMia', 'CaptainNemo',
  'FatimaGamer', 'JoJo2010', 'ProSniperX', 'HappyPanda', 'RedDragon88',
  'SlySamir', 'EvaBlue', 'GhostRider_x', 'LinaLoop', 'BigBossHH',
];

const FLAGS = ['🇳🇱', '🇺🇸', '🇩🇪', '🇹🇷', '🇸🇦', '🇦🇪', '🇪🇬', '🇫🇷', '🇬🇧', '🇧🇷', '🇯🇵', '🇰🇷', '🇮🇹', '🇪🇸', '🇲🇦', '🇯🇴', '🇮🇩', '🇲🇽', '🇸🇪', '🇵🇱'];

export function randomOpponent(playerLevel: number): Opponent {
  const name = NAMES[Math.floor(Math.random() * NAMES.length)];
  const flag = FLAGS[Math.floor(Math.random() * FLAGS.length)];
  // Early levels face easier bots so new players win more often.
  const difficulty: Difficulty =
    playerLevel <= 2 ? 'easy' : playerLevel <= 5 ? 'normal' : 'hard';
  return { name, flag, difficulty };
}
