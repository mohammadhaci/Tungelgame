// Game art (native): bundled via Metro require().
// Web builds resolve assets.web.ts instead (data URIs for the single-file demo).

import { GameImages } from './assets-types';

export const IMG: GameImages = {
  bgWood: require('../../assets/img/bg-wood.jpg'),
  bgHome: require('../../assets/img/bg-home.jpg'),
  bgVs: require('../../assets/img/bg-vs.jpg'),
  money: require('../../assets/img/money.png'),
  trophy: require('../../assets/img/trophy.png'),
  rings: [
    require('../../assets/img/ring-0.png'),
    require('../../assets/img/ring-1.png'),
    require('../../assets/img/ring-2.png'),
    require('../../assets/img/ring-3.png'),
    require('../../assets/img/ring-4.png'),
    require('../../assets/img/ring-5.png'),
  ],
  handRock: require('../../assets/img/hand-rock.png'),
  handPaper: require('../../assets/img/hand-paper.png'),
  handScissors: require('../../assets/img/hand-scissors.png'),
};

export const RING_COUNT = 6;
