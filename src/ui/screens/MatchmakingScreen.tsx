// "Searching for opponent…" spinner, then the VS screen (like the reference:
// two hex badges on a split pink/blue background).

import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { t } from '../../i18n';
import { Opponent } from '../../services/opponents';
import { COLORS } from '../theme';

interface Props {
  opponent: Opponent;
  playerFlag: string;
  onDone: () => void;
}

export default function MatchmakingScreen({ opponent, playerFlag, onDone }: Props) {
  const [found, setFound] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setFound(true), 1800 + Math.random() * 1200);
    return () => clearTimeout(t1);
  }, []);

  useEffect(() => {
    if (!found) return;
    const t2 = setTimeout(onDone, 2200);
    return () => clearTimeout(t2);
  }, [found, onDone]);

  if (!found) {
    return (
      <View style={[styles.root, { backgroundColor: COLORS.bgBottom, justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color={COLORS.white} />
        <Text style={styles.searching}>{t('searching')}</Text>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <View style={styles.topHalf}>
        <HexBadge name={opponent.name} flag={opponent.flag} gold />
      </View>
      <Text style={styles.vs}>{t('vs')}</Text>
      <View style={styles.bottomHalf}>
        <HexBadge name={t('you')} flag={playerFlag} />
      </View>
    </View>
  );
}

function HexBadge({ name, flag, gold }: { name: string; flag: string; gold?: boolean }) {
  return (
    <View style={[styles.badge, { backgroundColor: gold ? COLORS.gold : '#2f80d6', borderColor: gold ? '#c87f0a' : '#e8f1fc' }]}>
      <Text style={styles.badgeName} numberOfLines={1}>{name}</Text>
      <Text style={styles.badgeFlag}>{flag}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: 'center' },
  searching: { color: COLORS.white, fontSize: 20, fontWeight: '700', marginTop: 20 },
  topHalf: {
    width: '100%', flex: 1, backgroundColor: COLORS.bgTop,
    alignItems: 'center', justifyContent: 'center',
  },
  bottomHalf: {
    width: '100%', flex: 1, backgroundColor: COLORS.bgBottom,
    alignItems: 'center', justifyContent: 'center',
  },
  vs: {
    position: 'absolute', top: '46%', zIndex: 10, fontSize: 64, fontWeight: '900',
    color: COLORS.gold, textShadowColor: '#b33', textShadowOffset: { width: 3, height: 3 },
    textShadowRadius: 2, transform: [{ rotate: '-6deg' }],
  },
  badge: {
    width: 190, height: 200, borderRadius: 36, borderWidth: 8,
    alignItems: 'center', justifyContent: 'center', gap: 12,
    shadowColor: '#000', shadowOpacity: 0.35, shadowRadius: 10, shadowOffset: { width: 0, height: 6 },
  },
  badgeName: { color: COLORS.white, fontWeight: '900', fontSize: 18, maxWidth: 160 },
  badgeFlag: { fontSize: 64 },
});
