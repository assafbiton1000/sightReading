# רשימת משימות להשקה — Supabase + Google Play + AdMob

כל השלבים כאן דורשים חשבונות/פעולות חיצוניות (Supabase, Google Play Console,
Google Cloud, AdMob) ולא ניתנים לביצוע אוטומטי דרך הקוד. הרשימה מסודרת לפי סדר עדיפות.

---

## חלק ג׳ — AdMob (מסך "Support Me" — פרסומת תמיכה מרצון)

כרגע המסך משתמש במזהי TEST הרשמיים של Google (`app.json` + `TestIds.REWARDED`
ב-`SupportScreen.tsx`) — מציגים פרסומות אמיתיות אבל לא מייצרים הכנסה. לפני
הפצה בפועל:

1. גלוש ל-<https://admob.google.com> → הרשמה/כניסה עם חשבון Google.
2. **Apps → Add app** → Android → תבחר אם האפליקציה כבר בחנות או לא (עדיין לא).
3. תמלא את פרטי האפליקציה → תקבל **App ID** (בפורמט `ca-app-pub-XXXX~YYYY`).
4. באותו אפליקציה: **Ad units → Add ad unit → Rewarded** → תקבל **Ad unit ID**
   (בפורמט `ca-app-pub-XXXX/ZZZZ`, שונה מה-App ID).
5. עדכן שני מקומות בקוד:
   - `app.json` → `plugins → react-native-google-mobile-ads → androidAppId`
     (והחלף גם `iosAppId` אם תפרסם ל-iOS)
   - `src/constants/support.ts` → `REWARDED_AD_UNIT_ID`
6. שלח לי את שני הערכים החדשים ואני אעדכן את הקבצים.
7. **בילד חדש נדרש** (מודול native) — `npx eas-cli build --profile preview --platform android`
   כדי לבדוק בפועל שהמזהים האמיתיים עובדים, לפני שמכניסים ל-production.

---

## חלק א׳ — Supabase (מתקן את שגיאת "account service is not configured")

### א.1 יצירת פרויקט
1. גלוש ל-<https://supabase.com> → הרשמה (חינם).
2. **New project** → שם (למשל `sightreading`), סיסמת מסד נתונים חזקה
   (שמור אותה במקום בטוח), Region קרוב (למשל `eu-central-1`).
3. המתן ~2 דקות עד שהפרויקט מוכן.

### א.2 העתקת המפתחות
1. בדשבורד: **Project Settings → API Keys**.
2. העתק את **Project URL** ואת מפתח **anon / public**.
3. שלח את שני הערכים ל-Claude — הוא ייצור/יעדכן את קובץ `.env` המקומי.

### א.3 חיבור ה-EAS (כדי שגם ה-build/APK יכיר את הערכים)
בטרמינל שלך:
```
npx eas-cli env:create --scope project
```
ירוץ פעמיים — פעם בשביל `EXPO_PUBLIC_SUPABASE_URL` ופעם בשביל
`EXPO_PUBLIC_SUPABASE_ANON_KEY` (אותם ערכים שהעתקת בא.2). כל פעם יבקש name +
value + לאיזה environment (בחר all: development, preview, production).

### א.4 אימות אימייל — קישורי חזרה לאפליקציה
1. בדשבורד: **Authentication → URL Configuration → Redirect URLs**, הוסף:
   - `sightreading://**` — לבילדים אמיתיים (APK / Store)
   - `http://localhost:8081/**` — אם תריץ `expo start --web`
2. (אופציונלי) **Authentication → Email Templates** — לערוך לעברית.

### א.5 "התחברות עם Google" (אופציונלי, נפרד מהרשמה רגילה באימייל)
תהליך ארוך יותר — פרויקט נפרד ב-Google Cloud Console, OAuth consent screen,
Client ID/Secret, וחיבורם בדשבורד Supabase תחת Authentication → Providers →
Google. המדריך המלא כבר כתוב ב-`docs/AUTH_SETUP.md` (סעיף 4). לא חובה כדי
שהרשמה/התחברות רגילה באימייל+סיסמה תעבוד.

### א.6 לפני השקה אמיתית
- ה-SMTP המובנה של Supabase מוגבל למספר מיילים בודדים לשעה — לפני השקה חברו
  SMTP משלכם (Resend/SendGrid) דרך **Project Settings → Auth → SMTP Settings**.
- פרויקט Supabase בחבילה החינמית מושהה אוטומטית אחרי שבוע בלי תנועה — תצטרכו
  להעיר אותו ידנית מהדשבורד אם זה קורה.

---

## חלק ב׳ — הגשה ל-Google Play (מה שעוד חסר)

### ב.1 טופס Data Safety
1. **Google Play Console → האפליקציה שלך → App content → Data safety**.
2. תצהיר על נתוני המיקרופון: האפליקציה **מעבדת אודיו מקומית בלבד על המכשיר**,
   לא שולחת/שומרת הקלטות בשרת. (בהתאם למדיניות הפרטיות שכבר מפורסמת ב-
   <https://assafbiton1000.github.io/sightReading/privacy-policy.html>)
3. אם/כשתפעיל Supabase, תוסיף גם הצהרה על נתוני חשבון (אימייל) שנשמרים בשרת.

### ב.2 הצדקת הרשאת RECORD_AUDIO
1. **App content → Permissions declaration** (או חלק מאותו טופס Data Safety).
2. הסבר קצר: "האפליקציה משתמשת במיקרופון כדי לזהות בזמן אמת אילו תווים
   המשתמש מנגן בפסנתר אמיתי, לצורך תרגול קריאת תווים."

### ב.3 חומרי Store listing
טקסט כבר מוכן ב-`docs/store-listing.md` (כותרת, תיאור קצר, תיאור מלא). עדיין
חסר, ויש להכין ידנית (תמונה/עיצוב, לא טקסט):
- **Feature graphic** — 1024×500 פיקסלים
- **לפחות 2 צילומי מסך** (מומלץ 4–6): מסך הבית, אמצע תרגול עם צביעת תווים,
  מסך תוצאה, הגדרות/מצב כהה. אפשר לצלם ישירות מהאפליקציה שעל הטלפון שלך.
- **App icon** — כבר מוכן (`assets/icon.png`), אין צורך לגעת.

### ב.4 שאלון דירוג תוכן (Content Rating)
**App content → Content rating** — שאלון קצר (כמה דקות), ללא סיבוכים
צפויים לאפליקציית תרגול מוזיקה.

### ב.5 מסלול Closed Testing
1. **Testing → Closed testing** → צור מסלול חדש.
2. העלה את ה-`.aab` (בילד production — לא ה-APK של preview; ראה ב.6).
3. הוסף **12–20 בודקים** (אימיילים אמיתיים — יכולים להיות חברים/משפחה) —
   חובה לחשבונות מפתח אישיים חדשים לפני גישה ל-production.
4. הבודקים צריכים להתקין ולפתוח את האפליקציה, ולהישאר רשומים **14 יום**
   לפני שגוגל מאפשרת מעבר להפצה ציבורית.

### ב.6 בילד ה-production (שונה מה-preview שכבר יש לך)
כשתהיה מוכן להגיש בפועל, תריץ (בטרמינל שלך, אחרי EAS login):
```
npx eas-cli build --profile production --platform android
```
זה בונה `.aab` (App Bundle) — הפורמט שגוגל דורש להגשה בפועל, בשונה מה-`.apk`
של ה-preview שהתקנת עד עכשיו על הטלפון שלך ישירות.

---

## סדר מומלץ

1. Supabase (חלק א׳) — הכי מהיר, פותר את השגיאה שכבר ראית.
2. Data Safety + הצדקת הרשאה (ב.1–ב.2) — טפסים קצרים בקונסולה.
3. Content rating (ב.4) — קצר.
4. צילומי מסך + feature graphic (ב.3) — הכי מהנה, תוכל לעשות תוך כדי שאתה
   ממילא בודק שהכול עובד.
5. בילד production + Closed testing (ב.5–ב.6) — האחרון, כי 14 הימים
   מתחילים לרוץ רק אחרי שהבודקים בפנים.
