// Native platforms: load the Google Mobile Ads module if the native code is
// present (dev/production builds). In Expo Go the require throws -> null.
// Web builds resolve admob-module.web.ts instead, so the native library is
// never bundled there.

type AdsModule = typeof import('react-native-google-mobile-ads');

let ads: AdsModule | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  ads = require('react-native-google-mobile-ads');
} catch {
  ads = null;
}

export default ads;
