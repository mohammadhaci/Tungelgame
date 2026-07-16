// Tungel Rings — hyper-casual band-stretching board game.
// Screen flow: home → matchmaking (VS) → rock-paper-scissors → match → result.

import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { createMatch, Match } from './src/game/engine';
import { DEFAULT_CONFIG, PlayerId } from './src/game/types';
import { getLang, setLang } from './src/i18n';
import {
  initAds,
  INTERSTITIAL_EVERY_N_MATCHES,
  preloadInterstitial,
  showInterstitial,
} from './src/services/ads';
import { Opponent, randomOpponent } from './src/services/opponents';
import {
  DEFAULT_PROFILE,
  levelForXp,
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
  scores: [number, number];
  baseReward: number;
  ring: Ring | null;
}

export default function App() {
  const [screen, setScreen] = useState<Screen>('home');
  const [profile, setProfile] = useState<Profile>(DEFAULT_PROFILE);
  const [opponent, setOpponent] = useState<Opponent | null>(null);
  const [result, setResult] = useState<ResultData | null>(null);
  const [, forceRender] = useState(0);
  const matchRef = useRef<Match | null>(null);
  const matchCountRef = useRef(0);

  useEffect(() => {
    loadProfile().then((p) => {
      setLang(p.lang);
      setProfile(p);
    });
    initAds().then(preloadInterstitial);
  }, []);

  const persist = useCallback((p: Profile) => {
    setProfile(p);
    saveProfile(p);
  }, []);

  const startMatchFlow = () => {
    if (profile.coins < BET) {
      // top the player back up so they can always play (ad-friendly loop)
      persist({ ...profile, coins: BET });
    }
    setOpponent(randomOpponent(levelForXp(profile.xp)));
    setScreen('matchmaking');
  };

  const onRpsDone = (firstPlayer: PlayerId) => {
    matchRef.current = createMatch(DEFAULT_CONFIG, firstPlayer);
    setScreen('game');
  };

  const settleMatch = (won: boolean, draw: boolean, scores: [number, number]) => {
    const baseReward = draw ? 0 : won ? BET : -BET;
    const ring = won ? randomRing() : null;
    const updated: Profile = {
      ...profile,
      coins: Math.max(0, profile.coins + baseReward),
      wins: profile.wins + (won ? 1 : 0),
      gamesPlayed: profile.gamesPlayed + 1,
      xp: profile.xp + 20 + (won ? 30 : 0),
      rings: ring ? [...profile.rings, ring] : profile.rings,
    };
    persist(updated);
    setResult({ won, draw, scores, baseReward, ring });
    setScreen('result');
  };

  const onGameFinish = () => {
    const match = matchRef.current;
    if (!match) return;
    const { scores, winner } = match.state;
    settleMatch(winner === 0, winner === null, [scores[0], scores[1]]);
  };

  const onQuitMatch = () => {
    settleMatch(false, false, [
      matchRef.current?.state.scores[0] ?? 0,
      matchRef.current?.state.scores[1] ?? 0,
    ]);
  };

  const onDoubleApplied = (extra: number) => {
    persist({ ...profile, coins: profile.coins + extra });
  };

  const onContinue = async () => {
    matchCountRef.current += 1;
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
      {screen === 'matchmaking' && opponent && (
        <MatchmakingScreen
          opponent={opponent}
          playerFlag={PLAYER_FLAG}
          onDone={() => setScreen('rps')}
        />
      )}
      {screen === 'rps' && opponent && (
        <RpsScreen opponentName={opponent.name} onDone={onRpsDone} />
      )}
      {screen === 'game' && opponent && matchRef.current && (
        <GameScreen
          match={matchRef.current}
          opponent={opponent}
          playerFlag={PLAYER_FLAG}
          onFinish={onGameFinish}
          onQuit={onQuitMatch}
        />
      )}
      {screen === 'result' && result && (
        <ResultScreen
          won={result.won}
          draw={result.draw}
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
