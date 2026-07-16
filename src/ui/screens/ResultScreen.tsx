// Win/lose screen: pays out the pot, offers a rewarded ad to double it,
// grants a ring on wins.

import React, { useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { t } from '../../i18n';
import { adsAvailable, showRewarded } from '../../services/ads';
import { Ring } from '../../services/storage';
import { IMG } from '../assets';
import { COLORS, RADII } from '../theme';

interface Props {
  won: boolean;
  draw: boolean;
  forfeit: boolean; // opponent left mid-match
  scores: [number, number];
  baseReward: number; // already applied to profile by App
  ring: Ring | null;
  onDoubleApplied: (extra: number) => void;
  onContinue: () => void;
}

export default function ResultScreen({
  won, draw, forfeit, scores, baseReward, ring, onDoubleApplied, onContinue,
}: Props) {
  const [doubled, setDoubled] = useState(false);
  const [busy, setBusy] = useState(false);

  const title = forfeit && won
    ? t('opponentLeft')
    : draw ? t('draw') : won ? t('youWin') : t('youLose');
  const bg = won ? COLORS.bgBottom : COLORS.bgTop;

  const watchAd = async () => {
    if (busy || doubled) return;
    setBusy(true);
    const earned = await showRewarded();
    if (earned) {
      setDoubled(true);
      onDoubleApplied(baseReward);
    }
    setBusy(false);
  };

  return (
    <View style={[styles.root, { backgroundColor: bg }]}>
      {won && <Image source={IMG.trophy} style={styles.trophy} resizeMode="contain" />}
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.score}>{scores[0]} : {scores[1]}</Text>

      <View style={styles.rewardCard}>
        <Text style={styles.rewardLabel}>{t('reward')}</Text>
        <View style={styles.rewardRow}>
          <Image source={IMG.money} style={styles.moneyImg} resizeMode="contain" />
          <Text style={styles.rewardValue}>
            {baseReward >= 0 ? '+' : ''}{doubled ? baseReward * 2 : baseReward}$
          </Text>
        </View>
        {ring && (
          <View style={styles.ringRow}>
            <Image
              source={IMG.rings[ring.variant % IMG.rings.length]}
              style={styles.ringImg}
              resizeMode="contain"
            />
            <Text style={styles.ringText}>{t('newRing')}</Text>
          </View>
        )}
      </View>

      {won && adsAvailable && !doubled && (
        <Pressable style={styles.doubleBtn} onPress={watchAd} disabled={busy}>
          <Text style={styles.doubleText}>{t('doubleReward')}</Text>
        </Pressable>
      )}

      <Pressable style={styles.continueBtn} onPress={onContinue}>
        <Text style={styles.continueText}>{t('continue')}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 18 },
  trophy: { width: 120, height: 130 },
  title: {
    fontSize: 40, fontWeight: '900', color: COLORS.white,
    textAlign: 'center', paddingHorizontal: 20,
  },
  score: { fontSize: 30, fontWeight: '800', color: 'rgba(255,255,255,0.9)' },
  rewardCard: {
    backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: RADII.card,
    paddingHorizontal: 40, paddingVertical: 20, alignItems: 'center', gap: 6,
  },
  rewardLabel: { color: 'rgba(255,255,255,0.85)', fontWeight: '700', fontSize: 16 },
  rewardRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  moneyImg: { width: 52, height: 44 },
  rewardValue: { color: COLORS.money, fontWeight: '900', fontSize: 40 },
  ringRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 8 },
  ringImg: { width: 44, height: 44 },
  ringText: { color: COLORS.white, fontWeight: '700' },
  doubleBtn: {
    backgroundColor: COLORS.gold, borderRadius: RADII.pill,
    paddingHorizontal: 30, paddingVertical: 14,
    borderBottomWidth: 5, borderBottomColor: COLORS.goldDark,
  },
  doubleText: { color: COLORS.white, fontWeight: '900', fontSize: 18 },
  continueBtn: {
    backgroundColor: 'rgba(255,255,255,0.25)', borderRadius: RADII.pill,
    paddingHorizontal: 46, paddingVertical: 14,
  },
  continueText: { color: COLORS.white, fontWeight: '800', fontSize: 18 },
});
