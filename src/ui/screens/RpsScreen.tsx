// Rock–paper–scissors mini game: the winner makes the first move on the board.

import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { t } from '../../i18n';
import { PlayerId } from '../../game/types';
import { COLORS, RADII } from '../theme';

type Hand = 'rock' | 'paper' | 'scissors';
const HANDS: { key: Hand; emoji: string }[] = [
  { key: 'rock', emoji: '✊' },
  { key: 'paper', emoji: '✋' },
  { key: 'scissors', emoji: '✌️' },
];

function beats(a: Hand, b: Hand): boolean {
  return (
    (a === 'rock' && b === 'scissors') ||
    (a === 'paper' && b === 'rock') ||
    (a === 'scissors' && b === 'paper')
  );
}

interface Props {
  opponentName: string;
  onDone: (firstPlayer: PlayerId) => void;
}

export default function RpsScreen({ opponentName, onDone }: Props) {
  const [picked, setPicked] = useState<Hand | null>(null);
  const [botHand, setBotHand] = useState<Hand | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const pick = (hand: Hand) => {
    if (picked) return;
    const bot = HANDS[Math.floor(Math.random() * 3)].key;
    setPicked(hand);
    setBotHand(bot);
    if (hand === bot) {
      setMessage(t('rpsTie'));
      setTimeout(() => {
        setPicked(null);
        setBotHand(null);
        setMessage(null);
      }, 1400);
    } else {
      const playerWon = beats(hand, bot);
      setMessage(playerWon ? t('youStart') : t('opponentStarts'));
      setTimeout(() => onDone(playerWon ? 0 : 1), 1600);
    }
  };

  const emojiOf = (h: Hand | null) => HANDS.find((x) => x.key === h)?.emoji ?? '❔';

  return (
    <View style={styles.root}>
      <View style={styles.banner}>
        <Text style={styles.bannerText}>{t('winnerStarts')}</Text>
      </View>

      <Text style={styles.oppName}>{opponentName}</Text>
      <Text style={styles.bigHand}>{picked ? emojiOf(botHand) : '🤜'}</Text>

      <Text style={styles.message}>{message ?? t('rpsPick')}</Text>

      <Text style={styles.bigHand}>{picked ? emojiOf(picked) : '🤛'}</Text>

      <View style={styles.handsRow}>
        {HANDS.map((h) => (
          <Pressable
            key={h.key}
            onPress={() => pick(h.key)}
            style={[styles.handBtn, picked === h.key && styles.handBtnActive]}
          >
            <Text style={styles.handEmoji}>{h.emoji}</Text>
            <Text style={styles.handLabel}>{t(h.key)}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.table, alignItems: 'center', paddingTop: 70 },
  banner: {
    backgroundColor: COLORS.gold, borderRadius: RADII.pill,
    paddingHorizontal: 28, paddingVertical: 12,
  },
  bannerText: { color: COLORS.white, fontWeight: '900', fontSize: 20 },
  oppName: { marginTop: 24, fontSize: 18, fontWeight: '700', color: COLORS.ink },
  bigHand: { fontSize: 84, marginVertical: 10 },
  message: { fontSize: 20, fontWeight: '800', color: COLORS.ink, marginVertical: 6 },
  handsRow: {
    flexDirection: 'row', gap: 18, marginTop: 30,
    backgroundColor: COLORS.purpleBar, borderTopLeftRadius: 30, borderTopRightRadius: 30,
    paddingHorizontal: 26, paddingVertical: 22, position: 'absolute', bottom: 0,
    width: '100%', justifyContent: 'center',
  },
  handBtn: {
    width: 92, height: 106, borderRadius: 50, backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: COLORS.gold,
  },
  handBtnActive: { backgroundColor: 'rgba(255,255,255,0.45)' },
  handEmoji: { fontSize: 44 },
  handLabel: { color: COLORS.white, fontWeight: '700', marginTop: 4, fontSize: 12 },
});
