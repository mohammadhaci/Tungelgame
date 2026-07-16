// Banner ad slot. Renders nothing when the ads module is unavailable
// (Expo Go / web) so layouts stay clean.

import React from 'react';
import { View } from 'react-native';
import ads from '../../services/admob-module';
import { adsAvailable, bannerAdUnitId } from '../../services/ads';

const BannerAd: any = ads?.BannerAd ?? null;
const BannerAdSize: any = ads?.BannerAdSize ?? null;

export default function AdBanner() {
  const unitId = bannerAdUnitId();
  if (!adsAvailable || !BannerAd || !unitId) return null;
  return (
    <View style={{ alignItems: 'center' }}>
      <BannerAd
        unitId={unitId}
        size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
        requestOptions={{ requestNonPersonalizedAdsOnly: true }}
      />
    </View>
  );
}
