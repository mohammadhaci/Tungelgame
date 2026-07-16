// The match screen: board, score panels, turn banner. The opponent is either
// a local bot (session.requestBotMove) or a real player whose moves arrive
// through session.setMoveListener.

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, ImageBackground, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { applyMove, bandsLeft, Match } from '../../game/engine';
import { Move, PlayerId } from '../../game/types';
import { t } from '../../i18n';
import { GameSession } from '../../services/multiplayer';
import AdBanner from '../components/AdBanner';
import BoardView from '../components/BoardView';
import { IMG } from '../assets';
import { COLORS, RADII } from '../theme';

interface Props {
  match: Match;
  session: GameSession;
  playerFlag: string;
  onFinish: () => void;
  onQuit: () => void;
}

export default function GameScreen({ match, session, playerFlag, onFinish, onQuit }: Props) {
  const { width } = useWindowDimensions();
  const [version, setVersion] = useState(0);
  const finishedRef = useRef(false);

  const me = session.localPlayer;
  const them = (1 - me) as PlayerId;
  const boardSize = Math.min(width - 16, 460);
  const isPlayerTurn = match.state.turn === me && !match.state.finished;

  const afterMove = useCallback(() => {
    setVersion((v) => v + 1);
    if (match.state.finished && !finishedRef.current) {
      finishedRef.current = true;
      setTimeout(onFinish, 900);
    }
  }, [match, onFinish]);

  // Remote opponent moves (online matches).
  useEffect(() => {
    if (!session.online) return;
    session.setMoveListener((move: Move) => {
      try {
        if (match.state.turn === them && !match.state.finished) {
          applyMove(match, move);
          afterMove();
        }
      } catch {
        // out-of-sync move — ignore; the engine stays authoritative locally
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, match]);

  // Bot plays whenever it's their turn (offline matches).
  useEffect(() => {
    if (session.online || match.state.finished || match.state.turn !== them) return;
    const timer = setTimeout(() => {
      const mv = session.requestBotMove?.(match);
      if (mv) {
        applyMove(match, mv);
      }
      afterMove();
    }, 900 + Math.random() * 900);
    return () => clearTimeout(timer);
  }, [version, match, session, them, afterMove]);

  const onPlayerMove = (move: Move) => {
    if (!isPlayerTurn) return;
    try {
      applyMove(match, move);
      session.sendMove(move);
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
    <ImageBackground source={IMG.bgWood} resizeMode="cover" style={styles.root}>
      {/* opponent panel */}
      <View style={[styles.panel, styles.topPanel]}>
        <Text style={styles.flag}>{session.opponent.flag}</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.name} numberOfLines={1}>
            {session.opponent.name} {session.online ? '🌐' : ''}
          </Text>
          <Text style={styles.bands}>🧵 {bandsLeft(match, them)}</Text>
        </View>
        <View style={[styles.scoreBubble, { backgroundColor: COLORS.opponent }]}>
          <Text style={styles.scoreText}>{match.state.scores[them]}</Text>
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
          localPlayer={me}
          onMove={onPlayerMove}
          version={version}
        />
      </View>

      {/* player panel */}
      <View style={[styles.panel, styles.bottomPanel]}>
        <Text style={styles.flag}>{playerFlag}</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>{t('you')}</Text>
          <Text style={styles.bands}>🧵 {bandsLeft(match, me)} {t('bandsLeft')}</Text>
        </View>
        <View style={[styles.scoreBubble, { backgroundColor: COLORS.player }]}>
          <Text style={styles.scoreText}>{match.state.scores[me]}</Text>
        </View>
      </View>

      <AdBanner />
    </ImageBackground>
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
