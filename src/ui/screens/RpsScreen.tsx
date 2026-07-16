// Rock–paper–scissors mini game: the winner makes the first move on the board.
// Flow: pick -> both fists shake 3x -> hands pop-reveal -> winner announced.

import React, { useRef, useState } from 'react';
import {
  Animated, Easing, Image, ImageBackground, ImageSourcePropType,
  Platform, Pressable, StyleSheet, Text, View,
} from 'react-native';
import { t } from '../../i18n';
import { PlayerId } from '../../game/types';
import { IMG } from '../assets';
import { COLORS, RADII } from '../theme';

type Hand = 'rock' | 'paper' | 'scissors';
const HANDS: { key: Hand; img: () => ImageSourcePropType }[] = [
  { key: 'rock', img: () => IMG.handRock },
  { key: 'paper', img: () => IMG.handPaper },
  { key: 'scissors', img: () => IMG.handScissors },
];

function beats(a: Hand, b: Hand): boolean {
  return (
    (a === 'rock' && b === 'scissors') ||
    (a === 'paper' && b === 'rock') ||
    (a === 'scissors' && b === 'paper')
  );
}

type Phase = 'pick' | 'shake' | 'reveal';

const USE_NATIVE = Platform.OS !== 'web';

interface Props {
  opponentName: string;
  onDone: (firstPlayer: PlayerId) => void;
}

export default function RpsScreen({ opponentName, onDone }: Props) {
  const [phase, setPhase] = useState<Phase>('pick');
  const [picked, setPicked] = useState<Hand | null>(null);
  const [botHand, setBotHand] = useState<Hand | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const shake = useRef(new Animated.Value(0)).current; // 0..1 bounce
  const reveal = useRef(new Animated.Value(0)).current; // 0..1 pop scale
  const winGlow = useRef(new Animated.Value(0)).current; // winner emphasis

  const playerWonRef = useRef<boolean | null>(null);

  const pick = (hand: Hand) => {
    if (phase !== 'pick') return;
    const bot = HANDS[Math.floor(Math.random() * 3)].key;
    setPicked(hand);
    setBotHand(bot);
    setMessage(null);
    setPhase('shake');
    playerWonRef.current = hand === bot ? null : beats(hand, bot);

    shake.setValue(0);
    reveal.setValue(0);
    winGlow.setValue(0);

    // three "rock... paper... scissors!" pumps (fresh animation nodes each —
    // a composite animation object cannot be reused inside one sequence)
    const pump = () =>
      Animated.sequence([
        Animated.timing(shake, {
          toValue: 1, duration: 210, easing: Easing.out(Easing.quad), useNativeDriver: USE_NATIVE,
        }),
        Animated.timing(shake, {
          toValue: 0, duration: 210, easing: Easing.in(Easing.quad), useNativeDriver: USE_NATIVE,
        }),
      ]);
    Animated.sequence([pump(), pump(), pump()]).start(() => {
      setPhase('reveal');
      Animated.spring(reveal, {
        toValue: 1, friction: 4, tension: 120, useNativeDriver: USE_NATIVE,
      }).start(() => {
        const won = playerWonRef.current;
        if (won === null) {
          setMessage(t('rpsTie'));
          setTimeout(() => {
            setPicked(null);
            setBotHand(null);
            setMessage(null);
            setPhase('pick');
          }, 1300);
        } else {
          setMessage(won ? t('youStart') : t('opponentStarts'));
          Animated.timing(winGlow, {
            toValue: 1, duration: 350, useNativeDriver: USE_NATIVE,
          }).start();
          setTimeout(() => onDone(won ? 0 : 1), 1700);
        }
      });
    });
  };

  const imgOf = (h: Hand | null) =>
    HANDS.find((x) => x.key === h)?.img() ?? IMG.handRock;

  const bounceUp = shake.interpolate({ inputRange: [0, 1], outputRange: [0, -34] });
  const bounceDown = shake.interpolate({ inputRange: [0, 1], outputRange: [0, 34] });
  const tiltTop = shake.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '-14deg'] });
  const tiltBottom = shake.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '14deg'] });
  const popScale = reveal.interpolate({ inputRange: [0, 0.6, 1], outputRange: [0.3, 1.25, 1] });

  const won = playerWonRef.current;
  const revealDone = phase === 'reveal';
  // winner grows a touch, loser dims
  const topScale = winGlow.interpolate({
    inputRange: [0, 1], outputRange: [1, won === false ? 1.2 : 0.9],
  });
  const bottomScale = winGlow.interpolate({
    inputRange: [0, 1], outputRange: [1, won === true ? 1.2 : 0.9],
  });
  const topOpacity = winGlow.interpolate({
    inputRange: [0, 1], outputRange: [1, won === true ? 0.35 : 1],
  });
  const bottomOpacity = winGlow.interpolate({
    inputRange: [0, 1], outputRange: [1, won === false ? 0.35 : 1],
  });

  return (
    <ImageBackground source={IMG.bgWood} resizeMode="cover" style={styles.root}>
      <View style={styles.banner}>
        <Text style={styles.bannerText}>{t('winnerStarts')}</Text>
      </View>

      <Text style={styles.oppName}>{opponentName}</Text>

      {/* opponent hand (top, flipped toward the player) */}
      <Animated.Image
        source={revealDone ? imgOf(botHand) : IMG.handRock}
        resizeMode="contain"
        style={[
          styles.bigHand,
          { transform: [{ scaleY: -1 }] },
          phase === 'shake' && { transform: [{ scaleY: -1 }, { translateY: bounceDown }, { rotate: tiltTop }] },
          revealDone && {
            transform: [{ scaleY: -1 }, { scale: Animated.multiply(popScale, topScale) }],
            opacity: topOpacity,
          },
        ]}
      />

      <Text style={styles.message}>
        {message ?? (phase === 'pick' ? t('rpsPick') : '…')}
      </Text>

      {/* player hand (bottom) */}
      <Animated.Image
        source={revealDone ? imgOf(picked) : IMG.handRock}
        resizeMode="contain"
        style={[
          styles.bigHand,
          phase === 'shake' && { transform: [{ translateY: bounceUp }, { rotate: tiltBottom }] },
          revealDone && {
            transform: [{ scale: Animated.multiply(popScale, bottomScale) }],
            opacity: bottomOpacity,
          },
        ]}
      />

      <View style={styles.handsRow}>
        {HANDS.map((h) => (
          <Pressable
            key={h.key}
            onPress={() => pick(h.key)}
            disabled={phase !== 'pick'}
            style={[
              styles.handBtn,
              picked === h.key && styles.handBtnActive,
              phase !== 'pick' && picked !== h.key && styles.handBtnDisabled,
            ]}
          >
            <Image source={h.img()} style={styles.handBtnImg} resizeMode="contain" />
            <Text style={styles.handLabel}>{t(h.key)}</Text>
          </Pressable>
        ))}
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.table, alignItems: 'center', paddingTop: 70 },
  banner: {
    backgroundColor: COLORS.gold, borderRadius: RADII.pill,
    paddingHorizontal: 28, paddingVertical: 12,
  },
  bannerText: { color: COLORS.white, fontWeight: '900', fontSize: 20 },
  oppName: { marginTop: 20, fontSize: 18, fontWeight: '700', color: COLORS.ink },
  bigHand: { width: 130, height: 130, marginVertical: 8 },
  message: { fontSize: 20, fontWeight: '800', color: COLORS.ink, marginVertical: 6, minHeight: 26 },
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
  handBtnActive: { backgroundColor: 'rgba(255,255,255,0.45)', transform: [{ scale: 1.08 }] },
  handBtnDisabled: { opacity: 0.45 },
  handBtnImg: { width: 52, height: 52 },
  handLabel: { color: COLORS.white, fontWeight: '700', marginTop: 4, fontSize: 12 },
});
