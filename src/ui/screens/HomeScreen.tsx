import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { getLang, setLang, t } from '../../i18n';
import { levelForXp, Profile } from '../../services/storage';
import AdBanner from '../components/AdBanner';
import { COLORS, RADII } from '../theme';

interface Props {
  profile: Profile;
  onPlay: () => void;
  onToggleLang: () => void;
}

export default function HomeScreen({ profile, onPlay, onToggleLang }: Props) {
  return (
    <View style={styles.root}>
      <View style={styles.topRow}>
        <View style={styles.statPill}>
          <Text style={styles.statText}>💵 {profile.coins}$</Text>
        </View>
        <Pressable
          style={styles.langBtn}
          onPress={() => {
            setLang(getLang() === 'ar' ? 'en' : 'ar');
            onToggleLang();
          }}
        >
          <Text style={styles.langText}>🌐 {t('language')}</Text>
        </Pressable>
      </View>

      <Text style={styles.title}>💍 {t('appName')}</Text>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statBig}>{profile.wins}</Text>
          <Text style={styles.statLabel}>{t('wins')}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statBig}>{levelForXp(profile.xp)}</Text>
          <Text style={styles.statLabel}>{t('level')}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statBig}>{profile.rings.length}</Text>
          <Text style={styles.statLabel}>{t('rings')}</Text>
        </View>
      </View>

      {/* ring collection preview */}
      <View style={styles.ringsRow}>
        {profile.rings.slice(-8).map((ring, i) => (
          <View key={i} style={[styles.ring, { borderColor: ring.color }]}>
            <Text style={styles.ringGem}>{ring.gem}</Text>
          </View>
        ))}
        {profile.rings.length === 0 && <Text style={styles.hint}>🖐️ {t('newRing')}…</Text>}
      </View>

      <Pressable style={styles.playBtn} onPress={onPlay}>
        <Text style={styles.playText}>▶ {t('play')}</Text>
        <Text style={styles.betText}>{t('bet')}: 5$</Text>
      </Pressable>

      <View style={{ flex: 1 }} />
      <AdBanner />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bgBottom, paddingTop: 60, alignItems: 'center' },
  topRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    width: '100%', paddingHorizontal: 20,
  },
  statPill: {
    backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: RADII.pill,
    paddingHorizontal: 16, paddingVertical: 8,
  },
  statText: { color: COLORS.money, fontWeight: 'bold', fontSize: 18 },
  langBtn: {
    backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: RADII.pill,
    paddingHorizontal: 16, paddingVertical: 8,
  },
  langText: { color: COLORS.white, fontWeight: '600' },
  title: {
    color: COLORS.white, fontSize: 40, fontWeight: '900',
    marginTop: 40, textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowOffset: { width: 0, height: 3 }, textShadowRadius: 6,
  },
  statsRow: { flexDirection: 'row', gap: 14, marginTop: 36 },
  statCard: {
    backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: RADII.card,
    paddingVertical: 14, width: 92, alignItems: 'center',
  },
  statBig: { color: COLORS.white, fontSize: 28, fontWeight: '900' },
  statLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 13, marginTop: 2 },
  ringsRow: { flexDirection: 'row', gap: 8, marginTop: 24, minHeight: 44, alignItems: 'center' },
  ring: {
    width: 40, height: 40, borderRadius: 20, borderWidth: 4,
    alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.12)',
  },
  ringGem: { fontSize: 16 },
  hint: { color: 'rgba(255,255,255,0.7)' },
  playBtn: {
    marginTop: 44, backgroundColor: COLORS.gold, borderRadius: RADII.pill,
    paddingHorizontal: 70, paddingVertical: 18, alignItems: 'center',
    borderBottomWidth: 6, borderBottomColor: COLORS.goldDark,
  },
  playText: { color: COLORS.white, fontSize: 30, fontWeight: '900' },
  betText: { color: 'rgba(255,255,255,0.9)', fontWeight: '700', marginTop: 2 },
});
