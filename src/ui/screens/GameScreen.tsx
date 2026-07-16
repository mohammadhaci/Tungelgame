// The match screen: board, score panels, turn banner, bot turns.

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { pickBotMove } from '../../game/bot';
import { applyMove, bandsLeft, Match } from '../../game/engine';
import { Move } from '../../game/types';
import { t } from '../../i18n';
import { Opponent } from '../../services/opponents';
import AdBanner from '../components/AdBanner';
import BoardView from '../components/BoardView';
import { COLORS, RADII } from '../theme';

interface Props {
  match: Match;
  opponent: Opponent;
  playerFlag: string;
  onFinish: () => void;
  onQuit: () => void;
}

export default function GameScreen({ match, opponent, playerFlag, onFinish, onQuit }: Props) {
  const { width } = useWindowDimensions();
  const [version, setVersion] = useState(0);
  const finishedRef = useRef(false);

  const boardSize = Math.min(width - 16, 460);
  const isPlayerTurn = match.state.turn === 0 && !match.state.finished;

  const afterMove = useCallback(() => {
    setVersion((v) => v + 1);
    if (match.state.finished && !finishedRef.current) {
      finishedRef.current = true;
      setTimeout(onFinish, 900);
    }
  }, [match, onFinish]);

  // Bot plays whenever it's their turn.
  useEffect(() => {
    if (match.state.finished || match.state.turn !== 1) return;
    const timer = setTimeout(() => {
      const mv = pickBotMove(match, opponent.difficulty);
      if (mv) {
        applyMove(match, mv);
      }
      afterMove();
    }, 900 + Math.random() * 900);
    return () => clearTimeout(timer);
  }, [version, match, opponent.difficulty, afterMove]);

  const onPlayerMove = (move: Move) => {
    if (!isPlayerTurn) return;
    try {
      applyMove(match, move);
      afterMove();
    } catch {
      // illegal drag — ignore
    }
  };

  const confirmQuit = () => {
    Alert.alert(t('quit'), t('quitConfirm'), [
      { text: t('cancel'), style: 'cancel' },
      { text: t('quit'), style: 'destructive', onPress: onQuit },
    ]);
  };

  return (
    <View style={styles.root}>
      {/* opponent panel */}
      <View style={[styles.panel, styles.topPanel]}>
        <Text style={styles.flag}>{opponent.flag}</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.name} numberOfLines={1}>{opponent.name}</Text>
          <Text style={styles.bands}>🧵 {bandsLeft(match, 1)}</Text>
        </View>
        <View style={[styles.scoreBubble, { backgroundColor: COLORS.opponent }]}>
          <Text style={styles.scoreText}>{match.state.scores[1]}</Text>
        </View>
        <Pressable onPress={confirmQuit} style={styles.quitBtn}>
          <Text style={styles.quitText}>✕</Text>
        </Pressable>
      </View>

      {/* turn banner */}
      <View style={[styles.turnBanner, { backgroundColor: isPlayerTurn ? COLORS.player : COLORS.opponent }]}>
        <Text style={styles.turnText}>{isPlayerTurn ? t('yourTurn') : t('opponentTurn')}</Text>
      </View>
      <Text style={styles.bonusHint}>💜 {t('purpleBonus')}</Text>

      <View style={styles.boardWrap}>
        <BoardView
          match={match}
          size={boardSize}
          interactive={isPlayerTurn}
          onMove={onPlayerMove}
          version={version}
        />
      </View>

      {/* player panel */}
      <View style={[styles.panel, styles.bottomPanel]}>
        <Text style={styles.flag}>{playerFlag}</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>{t('you')}</Text>
          <Text style={styles.bands}>🧵 {bandsLeft(match, 0)} {t('bandsLeft')}</Text>
        </View>
        <View style={[styles.scoreBubble, { backgroundColor: COLORS.player }]}>
          <Text style={styles.scoreText}>{match.state.scores[0]}</Text>
        </View>
      </View>

      <AdBanner />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.table, paddingTop: 48 },
  panel: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    marginHorizontal: 12, paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: RADII.card,
  },
  topPanel: { backgroundColor: 'rgba(240,62,62,0.15)' },
  bottomPanel: { backgroundColor: 'rgba(55,178,77,0.15)', marginBottom: 6 },
  flag: { fontSize: 30 },
  name: { fontWeight: '800', fontSize: 16, color: COLORS.ink },
  bands: { color: '#5f5340', fontSize: 13, fontWeight: '600' },
  scoreBubble: {
    minWidth: 44, height: 44, borderRadius: 22, alignItems: 'center',
    justifyContent: 'center', paddingHorizontal: 10,
  },
  scoreText: { color: COLORS.white, fontWeight: '900', fontSize: 20 },
  quitBtn: {
    width: 34, height: 34, borderRadius: 17, backgroundColor: 'rgba(0,0,0,0.25)',
    alignItems: 'center', justifyContent: 'center',
  },
  quitText: { color: COLORS.white, fontWeight: '900' },
  turnBanner: {
    alignSelf: 'center', marginTop: 8, borderRadius: RADII.pill,
    paddingHorizontal: 26, paddingVertical: 6,
  },
  turnText: { color: COLORS.white, fontWeight: '900', fontSize: 16 },
  bonusHint: { alignSelf: 'center', marginTop: 4, color: '#6b4c86', fontWeight: '700', fontSize: 12 },
  boardWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
