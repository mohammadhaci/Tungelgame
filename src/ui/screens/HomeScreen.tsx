import React from 'react';
import { Image, ImageBackground, Pressable, StyleSheet, Text, View } from 'react-native';
import { getLang, setLang, t } from '../../i18n';
import { levelForXp, Profile } from '../../services/storage';
import AdBanner from '../components/AdBanner';
import { IMG } from '../assets';
import { COLORS, RADII } from '../theme';

interface Props {
  profile: Profile;
  onPlay: () => void;
  onToggleLang: () => void;
}

export default function HomeScreen({ profile, onPlay, onToggleLang }: Props) {
  return (
    <ImageBackground source={IMG.bgHome} style={styles.root} resizeMode="cover">
      <View style={styles.topRow}>
        <View style={styles.statPill}>
          <Image source={IMG.money} style={styles.moneyIcon} resizeMode="contain" />
          <Text style={styles.statText}>{profile.coins}$</Text>
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

      <View style={styles.titleRow}>
        <Image source={IMG.rings[5]} style={styles.titleRing} resizeMode="contain" />
        <Text style={styles.title}>{t('appName')}</Text>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Image source={IMG.trophy} style={styles.statIcon} resizeMode="contain" />
          <Text style={styles.statBig}>{profile.wins}</Text>
          <Text style={styles.statLabel}>{t('wins')}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statEmoji}>⭐</Text>
          <Text style={styles.statBig}>{levelForXp(profile.xp)}</Text>
          <Text style={styles.statLabel}>{t('level')}</Text>
        </View>
        <View style={styles.statCard}>
          <Image source={IMG.rings[0]} style={styles.statIcon} resizeMode="contain" />
          <Text style={styles.statBig}>{profile.rings.length}</Text>
          <Text style={styles.statLabel}>{t('rings')}</Text>
        </View>
      </View>

      {/* ring collection preview */}
      <View style={styles.ringsRow}>
        {profile.rings.slice(-8).map((ring, i) => (
          <Image
            key={i}
            source={IMG.rings[ring.variant % IMG.rings.length]}
            style={styles.ringImg}
            resizeMode="contain"
          />
        ))}
        {profile.rings.length === 0 && <Text style={styles.hint}>🖐️ {t('newRing')}…</Text>}
      </View>

      <Pressable style={styles.playBtn} onPress={onPlay}>
        <Text style={styles.playText}>▶ {t('play')}</Text>
        <Text style={styles.betText}>{t('bet')}: 5$</Text>
      </Pressable>

      <View style={{ flex: 1 }} />
      <AdBanner />
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, paddingTop: 60, alignItems: 'center', backgroundColor: COLORS.bgBottom },
  topRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    width: '100%', paddingHorizontal: 20,
  },
  statPill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(0,0,0,0.35)', borderRadius: RADII.pill,
    paddingHorizontal: 14, paddingVertical: 7,
  },
  moneyIcon: { width: 30, height: 25 },
  statText: { color: COLORS.money, fontWeight: 'bold', fontSize: 18 },
  langBtn: {
    backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: RADII.pill,
    paddingHorizontal: 16, paddingVertical: 8, justifyContent: 'center',
  },
  langText: { color: COLORS.white, fontWeight: '600' },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 36 },
  titleRing: { width: 56, height: 56 },
  title: {
    color: COLORS.white, fontSize: 38, fontWeight: '900',
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowOffset: { width: 0, height: 3 }, textShadowRadius: 6,
  },
  statsRow: { flexDirection: 'row', gap: 14, marginTop: 32 },
  statCard: {
    backgroundColor: 'rgba(255,255,255,0.16)', borderRadius: RADII.card,
    paddingVertical: 12, width: 96, alignItems: 'center',
  },
  statIcon: { width: 34, height: 34 },
  statEmoji: { fontSize: 28, height: 34 },
  statBig: { color: COLORS.white, fontSize: 24, fontWeight: '900', marginTop: 2 },
  statLabel: { color: 'rgba(255,255,255,0.85)', fontSize: 13, marginTop: 1 },
  ringsRow: {
    flexDirection: 'row', gap: 6, marginTop: 22, minHeight: 44,
    alignItems: 'center', paddingHorizontal: 16,
  },
  ringImg: { width: 42, height: 42 },
  hint: { color: 'rgba(255,255,255,0.75)' },
  playBtn: {
    marginTop: 40, backgroundColor: COLORS.gold, borderRadius: RADII.pill,
    paddingHorizontal: 70, paddingVertical: 18, alignItems: 'center',
    borderBottomWidth: 6, borderBottomColor: COLORS.goldDark,
  },
  playText: { color: COLORS.white, fontSize: 30, fontWeight: '900' },
  betText: { color: 'rgba(255,255,255,0.9)', fontWeight: '700', marginTop: 2 },
});
