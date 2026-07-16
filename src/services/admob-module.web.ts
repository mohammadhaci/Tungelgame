// Web: no native ads module. Keeps react-native-google-mobile-ads out of the
// web bundle entirely (Metro resolves this file instead of admob-module.ts).

type AdsModule = typeof import('react-native-google-mobile-ads');

const ads: AdsModule | null = null;

export default ads;
