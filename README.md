# 💍 Tungel Rings — خواتم تونجل

لعبة موبايل بأسلوب Hyper-Casual مستوحاة من ألعاب شدّ الخيوط (مثل Cross 'em All):
لوحة سداسية فيها أوتاد، اشدّ خيطًا بطول 4 أوتاد بالضبط على خط مستقيم، وسكّر مثلثات لتجمع نقاطًا.
اللي يجمع نقاطًا أكثر يربح الرهان 💵 وخاتمًا جديدًا 💍.

| الميزة | الحالة |
|---|---|
| لوحة سداسية + شدّ خيوط + تسكير مثلثات | ✅ |
| مثلثات Bonus (أزرق ×2، بنفسجي ×3) | ✅ |
| شاشة بحث عن خصم + شاشة VS بأعلام الدول | ✅ |
| حجرة/ورقة/مقص لتحديد من يبدأ | ✅ |
| خصم ذكي بثلاث صعوبات (يتصاعد مع مستواك) | ✅ |
| رهان 5$ + خواتم + مستويات + حفظ التقدم | ✅ |
| إعلانات AdMob: بانر + بيني + مكافأة (ضاعف ربحك) | ✅ |
| عربي + إنجليزي (زر تبديل من الشاشة الرئيسية) | ✅ |

---

## 🎮 جرّب اللعبة الآن (بدون نشر)

```bash
npm install
npx expo start
```

ثم امسح رمز QR بتطبيق **Expo Go** من App Store على آيفونك.
اللعبة تشتغل كاملة في Expo Go — **الإعلانات فقط** تحتاج نسخة Build أصلية (انظر أدناه).

للتجربة في المتصفح: `npx expo start --web`

للاختبارات: `npm test` (منطق اللعبة) و `npm run typecheck`.

---

## 🌐 الأونلاين الحقيقي (Firebase)

اللعبة تبحث عن **لاعب حقيقي** عبر Firebase Realtime Database لمدة ~6.5 ثانية
(`ONLINE_SEARCH_MS` في `src/services/multiplayer/index.ts`)، وإذا لم تجد أحدًا
تُدخل **بوتًا** بشكل شفاف — هكذا لا ينتظر اللاعب أبدًا حتى لو كان وحده أونلاين.

- المطابقة: طابور تذاكر في `queue/` مع مطالبة ذرّية (transaction) تمنع التصادم.
- المزامنة: محرك اللعبة حتمي — يتشارك اللاعبان بذرة اللوحة (seed) ويتبادلان
  الحركات فقط عبر `matches/{id}/moves`.
- حجرة/ورقة/مقص تُلعب أونلاين أيضًا (تبقى الأيدي تتأرجح حتى يختار الخصم).
- الانسحاب أو انقطاع النت = فوز تلقائي للطرف الآخر (`onDisconnect` + `leftBy`).

### خطوات التفعيل في Firebase Console (مرة واحدة)

1. **Authentication ← Sign-in method**: فعّل **Anonymous**. ✅
2. **Realtime Database**: أنشئ قاعدة بيانات (europe-west1). ✅
3. **Realtime Database ← تبويب Rules**: الصق محتوى ملف
   [`database.rules.json`](./database.rules.json) واضغط **Publish**. ⚠️ ضروري —
   بدون هذه القواعد سيبقى الوصول مقفولًا وسيلعب الجميع ضد البوتات.
4. إعدادات المشروع موجودة في `src/services/firebase.ts` (مفاتيح عميل عامة).

### تجربة الأونلاين

شغّل اللعبة على جهازين (Expo Go على هاتفين، أو هاتف + متصفح) واضغط "العب"
في الجهازين خلال نفس نافذة البحث — ستتقابلان وستظهر علامة 🌐 بجانب اسم الخصم.

> ملاحظة: نسخة الويب التجريبية المنشورة كـArtifact لا تصل إلى الإنترنت
> (بيئة معزولة) فتلعب دائمًا ضد البوتات. الأونلاين يعمل في Expo Go والتطبيق النهائي.

### اختبار محلي بدون إنترنت (للمطورين)

```bash
npx firebase-tools emulators:start --only auth,database --project demo-tungel
npx expo start --web   # ثم افتح الرابط مضيفًا ?emu=1
```

---

## 💰 خطوات تفعيل الإعلانات (AdMob)

1. أنشئ حسابًا مجانيًا في [AdMob](https://admob.google.com).
2. أضف تطبيقًا جديدًا (iOS) وخذ **App ID** بصيغة `ca-app-pub-XXXX~YYYY`.
3. أنشئ 3 وحدات إعلانية: **Banner** و **Interstitial** و **Rewarded**.
4. ضع المعرّفات في مكانين:
   - `app.json` → قسم `react-native-google-mobile-ads` → `iosAppId` (و `androidAppId` لأندرويد).
   - `src/services/ads.ts` → الثوابت `PROD_BANNER_IOS` و `PROD_INTERSTITIAL_IOS` و `PROD_REWARDED_IOS`.
5. بعد النشر: أضف ملف `app-ads.txt` على موقعك واربطه من إعدادات AdMob (يرفع نسبة ملء الإعلانات).

> أثناء التطوير تُستخدم **معرّفات جوجل التجريبية** تلقائيًا (آمنة 100٪ — لا تحظر حسابك).
> لا تضغط على إعلاناتك الحقيقية أبدًا أثناء التجربة.

الإعلانات الحالية في اللعبة:
- **بانر** أسفل الشاشة الرئيسية وشاشة اللعب.
- **إعلان بيني** بعد كل مباراتين (غيّر `INTERSTITIAL_EVERY_N_MATCHES` في `src/services/ads.ts`).
- **إعلان مكافأة**: زر "شاهد إعلان واربح الضعف" بعد الفوز.

---

## 🍎 خطوات النشر على App Store

**المتطلبات:** حساب [Apple Developer](https://developer.apple.com/programs/) (99$ سنويًا) — **لا تحتاج جهاز Mac** لأننا نبني عبر سحابة Expo (EAS).

```bash
# 1) أنشئ حساب Expo مجاني ثم سجّل الدخول
npm install -g eas-cli
eas login

# 2) اربط المشروع بحسابك (مرة واحدة)
eas init

# 3) ابنِ نسخة iOS للإنتاج (EAS يتكفل بالشهادات تلقائيًا)
eas build --platform ios --profile production

# 4) ارفعها إلى App Store Connect
eas submit --platform ios
```

ثم من [App Store Connect](https://appstoreconnect.apple.com):
1. أنشئ صفحة التطبيق: الاسم، الوصف، لقطات الشاشة (خذها من الآيفون عبر TestFlight).
2. **مهم للإعلانات**: في قسم App Privacy صرّح بجمع "Identifiers → Device ID" لأغراض
   "Third-Party Advertising" (لأن AdMob يستخدم معرّف الإعلانات IDFA).
3. اللعبة تطلب إذن التتبع (ATT) تلقائيًا — النص معرّف في `app.json`.
4. أرسل للمراجعة. عادةً تستغرق 1-3 أيام.

**قبل النشر غيّر:**
- `app.json` → `ios.bundleIdentifier` إلى معرّفك الخاص (مثل `com.yourname.tungelrings`).
- معرّفات AdMob الحقيقية (انظر الأعلى) — وإلا ستربح 0$!
- الأيقونة في `assets/icon.png` (1024×1024).

---

## 🗂️ بنية المشروع

```
src/
  game/          منطق اللعبة الصافي (بدون واجهة — مغطى باختبارات)
    board.ts     هندسة اللوحة السداسية والمسارات
    engine.ts    قواعد اللعب، النقاط، انتهاء المباراة
    bot.ts       ذكاء الخصم (easy/normal/hard)
  services/
    ads.ts       AdMob (بانر/بيني/مكافأة) — يتعطل بأمان في Expo Go والويب
    opponents.ts الخصوم "الأونلاين" المُحاكَون
    storage.ts   حفظ الرصيد والخواتم والمستوى
  i18n/          عربي + إنجليزي
  ui/
    screens/     Home / Matchmaking / RPS / Game / Result
    components/  BoardView (لوحة SVG تفاعلية) / AdBanner
scripts/
  test-engine.ts اختبارات منطق اللعبة (npm test)
```

## ⚙️ أفكار للتطوير لاحقًا

- أصوات ومؤثرات (expo-av) واهتزاز (expo-haptics).
- متجر خواتم يُشترى بالدولارات المكتسبة.
- Game Center leaderboard.
- لعب حقيقي أونلاين (Firebase Realtime Database أو Colyseus).
- نسخة أندرويد: نفس الأوامر مع `--platform android`.
