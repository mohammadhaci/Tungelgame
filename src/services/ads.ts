// AdMob integration (react-native-google-mobile-ads).
//
// ⚠️ ضع معرّفات AdMob الحقيقية هنا قبل النشر (انظر README.md قسم "الإعلانات").
// While __DEV__ is true the official Google TEST ad units are used, so you can
// develop without risking your AdMob account.
//
// The library only exists in a native build (eas build / expo run:ios).
// In Expo Go or on web the guarded require fails and every function no-ops,
// so the game itself keeps working everywhere.

import { Platform } from 'react-native';

// ---- REPLACE WITH YOUR REAL AD UNIT IDS BEFORE RELEASE ----
const PROD_BANNER_IOS = 'ca-app-pub-XXXXXXXXXXXXXXXX/BBBBBBBBBB';
const PROD_INTERSTITIAL_IOS = 'ca-app-pub-XXXXXXXXXXXXXXXX/IIIIIIIIII';
const PROD_REWARDED_IOS = 'ca-app-pub-XXXXXXXXXXXXXXXX/RRRRRRRRRR';
const PROD_BANNER_ANDROID = 'ca-app-pub-XXXXXXXXXXXXXXXX/BBBBBBBBBB';
const PROD_INTERSTITIAL_ANDROID = 'ca-app-pub-XXXXXXXXXXXXXXXX/IIIIIIIIII';
const PROD_REWARDED_ANDROID = 'ca-app-pub-XXXXXXXXXXXXXXXX/RRRRRRRRRR';
// -----------------------------------------------------------

/** Show an interstitial after every N finished matches. */
export const INTERSTITIAL_EVERY_N_MATCHES = 2;

import ads from './admob-module';

export const adsAvailable = ads !== null;

function pick(iosId: string, androidId: string, testId: string): string {
  if (__DEV__) return testId;
  return Platform.OS === 'ios' ? iosId : androidId;
}

export function bannerAdUnitId(): string | null {
  if (!ads) return null;
  return pick(PROD_BANNER_IOS, PROD_BANNER_ANDROID, ads.TestIds.BANNER);
}

export async function initAds(): Promise<void> {
  if (!ads) return;
  try {
    // On iOS this also triggers the App Tracking Transparency prompt
    // configured in app.json before ads initialize.
    await ads.default().initialize();
  } catch {
    // ads are never allowed to crash the game
  }
}

let interstitial: import('react-native-google-mobile-ads').InterstitialAd | null = null;

export function preloadInterstitial(): void {
  if (!ads) return;
  try {
    const unit = pick(
      PROD_INTERSTITIAL_IOS,
      PROD_INTERSTITIAL_ANDROID,
      ads.TestIds.INTERSTITIAL,
    );
    interstitial = ads.InterstitialAd.createForAdRequest(unit, {
      requestNonPersonalizedAdsOnly: true,
    });
    interstitial.load();
  } catch {
    interstitial = null;
  }
}

/** Shows the interstitial if one is loaded. Resolves when closed (or instantly). */
export function showInterstitial(): Promise<void> {
  return new Promise((resolve) => {
    if (!ads || !interstitial || !interstitial.loaded) {
      resolve();
      return;
    }
    const { AdEventType } = ads;
    const unsubscribe = interstitial.addAdEventListener(
      AdEventType.CLOSED,
      () => {
        unsubscribe();
        preloadInterstitial(); // get the next one ready
        resolve();
      },
    );
    try {
      interstitial.show();
    } catch {
      unsubscribe();
      resolve();
    }
  });
}

/**
 * Shows a rewarded ad. Resolves true if the user earned the reward.
 * Resolves false immediately when ads are unavailable.
 */
export function showRewarded(): Promise<boolean> {
  return new Promise((resolve) => {
    if (!ads) {
      resolve(false);
      return;
    }
    try {
      const unit = pick(PROD_REWARDED_IOS, PROD_REWARDED_ANDROID, ads.TestIds.REWARDED);
      const rewarded = ads.RewardedAd.createForAdRequest(unit, {
        requestNonPersonalizedAdsOnly: true,
      });
      let earned = false;
      const { AdEventType, RewardedAdEventType } = ads;
      const subs = [
        rewarded.addAdEventListener(RewardedAdEventType.LOADED, () => rewarded.show()),
        rewarded.addAdEventListener(RewardedAdEventType.EARNED_REWARD, () => {
          earned = true;
        }),
        rewarded.addAdEventListener(AdEventType.CLOSED, () => {
          subs.forEach((u) => u());
          resolve(earned);
        }),
        rewarded.addAdEventListener(AdEventType.ERROR, () => {
          subs.forEach((u) => u());
          resolve(false);
        }),
      ];
      rewarded.load();
    } catch {
      resolve(false);
    }
  });
}
