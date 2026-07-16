// Tiny i18n layer: Arabic (default) + English, switchable from the home screen.

export type Lang = 'ar' | 'en';

const strings = {
  appName: { ar: 'خواتم تونجل', en: 'Tungel Rings' },
  play: { ar: 'العب', en: 'PLAY' },
  searching: { ar: 'جارٍ البحث عن خصم…', en: 'Searching for opponent…' },
  vs: { ar: 'ضد', en: 'VS' },
  you: { ar: 'أنت', en: 'You' },
  winnerStarts: { ar: 'الفائز يبدأ أولاً', en: 'The winner starts' },
  rpsPick: { ar: 'اختر: حجرة، ورقة أو مقص', en: 'Pick rock, paper or scissors' },
  rpsTie: { ar: 'تعادل! جرّب مرة تانية', en: 'Tie! Try again' },
  youStart: { ar: 'أنت تبدأ!', en: 'You start!' },
  opponentStarts: { ar: 'الخصم يبدأ!', en: 'Opponent starts!' },
  yourTurn: { ar: 'دورك', en: 'Your turn' },
  opponentTurn: { ar: 'دور الخصم', en: "Opponent's turn" },
  purpleBonus: { ar: 'البنفسجي يعطيك نقاط أكثر!', en: 'Purple scores extra points!' },
  blueBonus: { ar: 'الأزرق يعطيك نقطة إضافية!', en: 'Blue scores a bonus point!' },
  bandsLeft: { ar: 'الخيوط المتبقية', en: 'Bands left' },
  youWin: { ar: 'ربحت! 🎉', en: 'You win! 🎉' },
  youLose: { ar: 'خسرت 😢', en: 'You lose 😢' },
  draw: { ar: 'تعادل!', en: 'Draw!' },
  reward: { ar: 'الجائزة', en: 'Reward' },
  doubleReward: { ar: 'شاهد إعلان واربح الضعف 🎬', en: 'Watch ad to double 🎬' },
  continue: { ar: 'متابعة', en: 'Continue' },
  newRing: { ar: 'خاتم جديد لمجموعتك!', en: 'New ring for your collection!' },
  coins: { ar: 'رصيدك', en: 'Balance' },
  rings: { ar: 'الخواتم', en: 'Rings' },
  wins: { ar: 'انتصارات', en: 'Wins' },
  level: { ar: 'المستوى', en: 'Level' },
  bet: { ar: 'الرهان', en: 'Bet' },
  language: { ar: 'English', en: 'العربية' },
  rock: { ar: 'حجرة', en: 'Rock' },
  paper: { ar: 'ورقة', en: 'Paper' },
  scissors: { ar: 'مقص', en: 'Scissors' },
  score: { ar: 'نقاط', en: 'pts' },
  quit: { ar: 'خروج', en: 'Quit' },
  quitConfirm: {
    ar: 'أكيد بدك تطلع؟ رح تخسر الرهان.',
    en: 'Leave the match? You will lose your bet.',
  },
  cancel: { ar: 'إلغاء', en: 'Cancel' },
} as const;

export type StringKey = keyof typeof strings;

let currentLang: Lang = 'ar';

export function setLang(lang: Lang) {
  currentLang = lang;
}

export function getLang(): Lang {
  return currentLang;
}

export function t(key: StringKey): string {
  return strings[key][currentLang];
}
