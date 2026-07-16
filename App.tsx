// Tungel Rings — hyper-casual band-stretching board game.
// Screen flow: home → matchmaking (VS) → rock-paper-scissors → match → result.
// Opponents are real online players (Firebase) when available, bots otherwise.

import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { createMatch, Match } from './src/game/engine';
import { mulberry32 } from './src/game/rng';
import { DEFAULT_CONFIG, PlayerId } from './src/game/types';
import { getLang, setLang } from './src/i18n';
import {
  initAds,
  INTERSTITIAL_EVERY_N_MATCHES,
  preloadInterstitial,
  showInterstitial,
} from './src/services/ads';
import { findMatch, GameSession } from './src/services/multiplayer';
import {
  DEFAULT_PROFILE,
  loadProfile,
  Profile,
  randomRing,
  Ring,
  saveProfile,
} from './src/services/storage';
import GameScreen from './src/ui/screens/GameScreen';
import HomeScreen from './src/ui/screens/HomeScreen';
import MatchmakingScreen from './src/ui/screens/MatchmakingScreen';
import ResultScreen from './src/ui/screens/ResultScreen';
import RpsScreen from './src/ui/screens/RpsScreen';
import { COLORS } from './src/ui/theme';

type Screen = 'home' | 'matchmaking' | 'rps' | 'game' | 'result';

const BET = 5;
const PLAYER_FLAG = '🌍';

interface ResultData {
  won: boolean;
  draw: boolean;
  forfeit: boolean;
  scores: [number, number];
  baseReward: number;
  ring: Ring | null;
}

export default function App() {
  const [screen, setScreen] = useState<Screen>('home');
  const [profile, setProfile] = useState<Profile>(DEFAULT_PROFILE);
  const [session, setSession] = useState<GameSession | null>(null);
  const [result, setResult] = useState<ResultData | null>(null);
  const [, forceRender] = useState(0);
  const matchRef = useRef<Match | null>(null);
  const matchCountRef = useRef(0);
  const screenRef = useRef<Screen>('home');
  screenRef.current = screen;
  const settledRef = useRef(false);

  useEffect(() => {
    loadProfile().then((p) => {
      setLang(p.lang);
      setProfile(p);
      saveProfile(p); // persist generated player name
    });
    initAds().then(preloadInterstitial);
  }, []);

  const persist = useCallback((p: Profile) => {
    setProfile(p);
    saveProfile(p);
  }, []);

  const profileRef = useRef(profile);
  profileRef.current = profile;

  const settleMatch = useCallback(
    (won: boolean, draw: boolean, forfeit: boolean, scores: [number, number]) => {
      if (settledRef.current) return;
      settledRef.current = true;
      const cur = profileRef.current;
      const baseReward = draw ? 0 : won ? BET : -BET;
      const ring = won ? randomRing() : null;
      persist({
        ...cur,
        coins: Math.max(0, cur.coins + baseReward),
        wins: cur.wins + (won ? 1 : 0),
        gamesPlayed: cur.gamesPlayed + 1,
        xp: cur.xp + 20 + (won ? 30 : 0),
        rings: ring ? [...cur.rings, ring] : cur.rings,
      });
      setResult({ won, draw, forfeit, scores, baseReward, ring });
      setScreen('result');
    },
    [persist],
  );

  const startMatchFlow = () => {
    const cur = profileRef.current;
    if (cur.coins < BET) {
      // top the player back up so they can always play (ad-friendly loop)
      persist({ ...cur, coins: BET });
    }
    settledRef.current = false;
    setSession(null);
    setScreen('matchmaking');
    findMatch(profileRef.current, PLAYER_FLAG).then((s) => {
      // player may have quit matchmaking meanwhile
      if (screenRef.current !== 'matchmaking') {
        s.leave();
        s.dispose();
        return;
      }
      // opponent leaving at any later point = we win by forfeit
      s.setLeaveListener(() => {
        const sc = screenRef.current;
        if (sc === 'rps' || sc === 'game' || sc === 'matchmaking') {
          const m = matchRef.current;
          settleMatch(true, false, true, [
            m?.state.scores[s.localPlayer] ?? 0,
            m?.state.scores[(1 - s.localPlayer) as PlayerId] ?? 0,
          ]);
        }
      });
      setSession(s);
    });
  };

  const onRpsDone = (firstPlayer: PlayerId) => {
    if (!session) return;
    matchRef.current = createMatch(
      DEFAULT_CONFIG,
      firstPlayer,
      mulberry32(session.seed),
    );
    setScreen('game');
  };

  const onGameFinish = () => {
    const match = matchRef.current;
    if (!match || !session) return;
    const { scores, winner } = match.state;
    const me = session.localPlayer;
    settleMatch(winner === me, winner === null, false, [
      scores[me],
      scores[(1 - me) as PlayerId],
    ]);
  };

  const onQuitMatch = () => {
    const m = matchRef.current;
    const me = session?.localPlayer ?? 0;
    session?.leave();
    settleMatch(false, false, false, [
      m?.state.scores[me] ?? 0,
      m?.state.scores[(1 - me) as PlayerId] ?? 0,
    ]);
  };

  const onDoubleApplied = (extra: number) => {
    persist({ ...profileRef.current, coins: profileRef.current.coins + extra });
  };

  const onContinue = async () => {
    matchCountRef.current += 1;
    session?.dispose();
    setSession(null);
    if (matchCountRef.current % INTERSTITIAL_EVERY_N_MATCHES === 0) {
      await showInterstitial();
    }
    setResult(null);
    matchRef.current = null;
    setScreen('home');
  };

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bgBottom }}>
      <StatusBar style="light" />
      {screen === 'home' && (
        <HomeScreen
          profile={profile}
          onPlay={startMatchFlow}
          onToggleLang={() => {
            persist({ ...profile, lang: getLang() });
            forceRender((n) => n + 1);
          }}
        />
      )}
      {screen === 'matchmaking' && (
        <MatchmakingScreen
          session={session}
          playerFlag={PLAYER_FLAG}
          onDone={() => setScreen('rps')}
        />
      )}
      {screen === 'rps' && session && (
        <RpsScreen
          session={session}
          onDone={onRpsDone}
          onOpponentGone={() => {
            session.leave();
            settleMatch(true, false, true, [0, 0]);
          }}
        />
      )}
      {screen === 'game' && session && matchRef.current && (
        <GameScreen
          match={matchRef.current}
          session={session}
          playerFlag={PLAYER_FLAG}
          onFinish={onGameFinish}
          onQuit={onQuitMatch}
        />
      )}
      {screen === 'result' && result && (
        <ResultScreen
          won={result.won}
          draw={result.draw}
          forfeit={result.forfeit}
          scores={result.scores}
          baseReward={result.baseReward}
          ring={result.ring}
          onDoubleApplied={onDoubleApplied}
          onContinue={onContinue}
        />
      )}
    </View>
  );
}
