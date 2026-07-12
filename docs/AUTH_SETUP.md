# הגדרת מערכת המשתמשים (Supabase + Google)

הקוד באפליקציה מוכן. כדי שהכל יעבוד צריך להקים פרויקט Supabase (חינם) ולהגדיר
בו את Google. **אין צורך לגעת בקוד** — רק למלא שני ערכים בקובץ `.env`.

## 1. יצירת פרויקט Supabase

1. היכנסו ל‑<https://supabase.com> והירשמו (חינם).
2. **New project** → בחרו שם (למשל `sightreading`), סיסמת מסד נתונים חזקה,
   ו‑Region קרוב (למשל `eu-central-1`).
3. המתינו כ‑2 דקות עד שהפרויקט מוכן.

## 2. העתקת המפתחות לקובץ `.env`

1. בדשבורד: **Project Settings → API Keys**.
2. העתיקו את **Project URL** ואת מפתח **anon / public**.
3. פתחו את הקובץ `.env` בשורש הפרויקט ומלאו:

   ```
   EXPO_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ...המפתח הארוך...
   ```

4. הפעילו מחדש את השרת: `npx expo start --clear` (חובה אחרי שינוי `.env`).

> המפתח ה‑anon בטוח לשימוש בצד לקוח — הסיסמאות מאוחסנות מגובבות (bcrypt)
> בטבלת `auth.users` בשרת, והאימות עצמו קורה שם.

## 3. אימות אימייל בהרשמה + קישורי חזרה לאפליקציה

אימות אימייל ("Confirm email") **מופעל כברירת מחדל** — משתמש חדש חייב ללחוץ על
קישור במייל לפני שיוכל להתחבר. נשאר רק לאשר ל‑Supabase להחזיר משתמשים לאפליקציה:

1. בדשבורד: **Authentication → URL Configuration → Redirect URLs**.
2. הוסיפו את השורות הבאות:
   - הכתובת שמודפסת בקונסול של Metro כשהאפליקציה עולה — חפשו שורה בסגנון
     `[auth] redirect URL to allow-list in Supabase: exp://192.168.x.x:8081`
     (זו הכתובת של Expo Go; היא משתנה אם מחליפים רשת WiFi — צריך לעדכן בהתאם).
   - `sightreading://**` — לבילדים אמיתיים (APK / App Store).
   - `http://localhost:8081/**` — להרצה בדפדפן (`expo start --web`).
3. אופציונלי אך מומלץ: **Authentication → Email Templates** — אפשר לערוך את
   נוסח המיילים (אימות, איפוס סיסמה) לעברית.

> **מגבלת מיילים:** ה‑SMTP המובנה של Supabase מוגבל למספר מיילים בודדים לשעה
> ומיועד לפיתוח בלבד. לקראת השקה אמיתית חברו SMTP משלכם
> (**Project Settings → Auth → SMTP Settings** — למשל Resend/SendGrid, יש חינמיים).

## 4. התחברות עם Google (המפתח של גוגל)

המפתח של Google מוגדר **רק בדשבורד של Supabase** — לא בקוד האפליקציה.

1. היכנסו ל‑<https://console.cloud.google.com> וצרו פרויקט חדש.
2. חפשו בסרגל החיפוש **Google Auth Platform** (זה מה שהחליף את
   "OAuth consent screen" הישן) → במסך Overview לחצו **Get started**:
   - **App Information** — שם אפליקציה ואימייל תמיכה → Next.
   - **Audience** — בחרו **External** → Next.
   - **Contact Information** — אימייל ליצירת קשר → Next.
   - **Finish** — אישור המדיניות → Continue → **Create**.
3. בתפריט הצד: **Clients → + Create Client**:
   - Application type: **Web application** (כן, גם עבור האפליקציה בטלפון —
     כי הזרימה עוברת דרך השרת של Supabase).
   - תחת **Authorized redirect URIs** הוסיפו:
     `https://xxxxxxxxxxxx.supabase.co/auth/v1/callback`
     (החליפו ב‑Project URL שלכם מסעיף 2, בתוספת `/auth/v1/callback`).
   - **Create** → העתיקו מיד את **Client ID** ואת **Client Secret**
     (הסוד מוצג רק בפרטי ה‑Client — שמרו אותו עכשיו).
4. בתפריט הצד: **Audience** — כל עוד סטטוס הפרסום הוא **Testing**, רק
   מיילים שהוספתם כ‑**Test users** יוכלו להתחבר. הוסיפו את עצמכם לבדיקות,
   ולקראת השקה לחצו **Publish app**.
5. חזרה ב‑Supabase: **Authentication → Sign In / Providers → Google**:
   - הפעילו (**Enable**), הדביקו את ה‑Client ID וה‑Client Secret, ושמרו.

זהו — כפתור "המשך עם Google" באפליקציה יעבוד בטלפון (דרך דפדפן שנפתח וחוזר
לאפליקציה) ובדפדפן.

## 5. בדיקה מהירה של כל הזרימות

| זרימה | איך בודקים |
|---|---|
| הרשמה + אימות | פרופיל → הרשמה → מגיע מייל → לחיצה על הקישור פותחת את האפליקציה מחוברים |
| התחברות | פרופיל → התחברות עם האימייל והסיסמה |
| סיסמה שגויה | מציג "אימייל או סיסמה שגויים" |
| שכחתי סיסמה | התחברות → "שכחתי סיסמה" → מייל → הקישור פותח מסך "בחירת סיסמה חדשה" |
| Google | "המשך עם Google" → בחירת חשבון → חזרה לאפליקציה מחוברים |
| התנתקות | פרופיל → התנתקות (נתוני תרגול נשארים במכשיר) |

## 6. מחיקת חשבון (כבר מותקן ✅)

כפתור "מחיקת חשבון" במסך הפרופיל קורא לפונקציית SQL בשם `delete_user` שרצה
בשרת ומוחקת **רק את המשתמש המחובר עצמו** (המפתח הציבורי לא מסוגל למחוק
משתמשים בעצמו — וזה בכוונה). הפונקציה הבאה כבר הותקנה בפרויקט ב־2026-07-12:

```sql
create or replace function public.delete_user()
returns void
language sql
security definer
set search_path = ''
as $$
  delete from auth.users where id = auth.uid();
$$;

revoke execute on function public.delete_user() from anon, public;
grant execute on function public.delete_user() to authenticated;
```

אם אי־פעם תקימו פרויקט Supabase חדש, יש להריץ אותה שוב דרך
**SQL Editor** בדשבורד (הדבקה → Run).

## 7. לקראת פרודקשן (Google Play / App Store)

הארכיטקטורה לא משתנה — הזרימה תמיד עוברת דרך השרת של Supabase, ולכן אותו
OAuth Client מסוג **Web application** משמש גם את האפליקציה מהחנות (אין צורך
ב‑Android client או SHA‑1). בבילד אמיתי `makeRedirectUri()` מחזיר
`sightreading://` במקום `exp://`, ולכן `sightreading://**` ברשימת ה‑Redirect
URLs כבר מכסה את זה.

צ'ק‑ליסט לפני השקה:

1. **פרסום האפליקציה בגוגל** — Google Auth Platform → **Audience** →
   **Publish app** (ממצב Testing ל‑In production). בלי זה רק Test users
   יכולים להתחבר. עם הרשאות בסיסיות בלבד (email/profile) אין צורך
   בתהליך Verification.
2. **SMTP משלכם** — ה‑SMTP המובנה של Supabase מוגבל לכמה מיילים בשעה.
   חברו Resend/SendGrid וכד' (**Project Settings → Auth → SMTP Settings**),
   אחרת מיילי אימות ואיפוס סיסמה לא יגיעו.
3. **ניקוי כתובות פיתוח** — הסירו את `exp://...` ואת
   `http://localhost:8081/**` מה‑Redirect URLs של פרויקט הפרודקשן.
4. אופציונלי: **Custom Domain** ב‑Supabase (בתשלום) כדי שמסך ההסכמה של
   גוגל יציג דומיין ממותג במקום `xxxx.supabase.co`.
5. שימו לב: בחבילת החינם של Supabase פרויקט ללא תנועה שבוע מושהה
   אוטומטית — וההתחברות תיפסק עד להערה ידנית מהדשבורד.

## פתרון תקלות

- **המייל לא מגיע** — בדקו ספאם; זכרו את מגבלת ה‑SMTP המובנה (סעיף 3).
- **הקישור במייל לא חוזר לאפליקציה** — ודאו שהכתובת שהודפסה בקונסול נמצאת
  ב‑Redirect URLs, ושה‑IP לא השתנה (רשת WiFi אחרת = כתובת אחרת).
- **שגיאת redirect_uri_mismatch מגוגל** — ה‑URI בסעיף 4.3 חייב להיות זהה
  בדיוק, כולל `https://` ו‑`/auth/v1/callback`.
- **באנר "שירות החשבונות עדיין לא הוגדר"** — הערכים ב‑`.env` ריקים/שגויים,
  או שהשרת לא הופעל מחדש עם `--clear`.
