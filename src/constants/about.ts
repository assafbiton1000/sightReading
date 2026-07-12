import { Lang } from '../utils/i18n';

export interface AboutContent {
  tagline: string;
  versionLabel: string;
  story: { title: string; paras: string[] };
  developer: { title: string; name: string; role: string; paras: string[]; contactLabel: string };
  tech: { title: string; items: { name: string; desc: string }[] };
}

export const DEVELOPER_EMAIL = 'assafbiton@gmail.com';
export const APP_VERSION = '1.0.0';

// Like the FAQ, long-form content is maintained in Hebrew and English only;
// other languages fall back to English.
const ABOUT_CONTENT: Partial<Record<Lang, AboutContent>> = {
  he: {
    tagline: 'אימון קריאת תווים לפסנתר — עם משוב בזמן אמת',
    versionLabel: 'גרסה',
    story: {
      title: 'הסיפור מאחורי האפליקציה',
      paras: [
        'כל מי שלמד פסנתר מכיר את המחסום: האצבעות כבר יודעות לנגן, אבל העיניים עדיין מתרגמות כל תו לאט. קריאת תווים שוטפת (Sight Reading) היא מיומנות שנבנית רק מתרגול יומי קצר — וזה בדיוק מה שהאפליקציה הזו נועדה לאפשר, בלי מורה צמוד ובלי ציוד מיוחד.',
        'האפליקציה מאזינה לפסנתר דרך המיקרופון של הטלפון, מזהה את התווים שאתם מנגנים בזמן אמת, ונותנת משוב מיידי על כל תו. שמונה רמות קושי מדורגות, מצב למידה לתווים חדשים, ספריית שירים מוכרים, מעקב רצף ימי אימון וסטטיסטיקות — הכל בנוי סביב עיקרון אחד: כמה דקות ביום, בעקביות.',
        'הממשק תורגם במלואו לתשע שפות, כולל תמיכה מלאה בעברית ובערבית מימין לשמאל.',
      ],
    },
    developer: {
      title: 'קרדיט',
      name: 'אסף ביטון',
      role: 'תכנון, עיצוב ופיתוח',
      paras: [
        'האפליקציה נוצרה, תוכנתה ופותחה מקצה לקצה על ידי אסף ביטון — מהרעיון והגדרת המוצר, דרך עיצוב הממשק והחוויה, ועד כתיבת הקוד כולו: מנוע התרגול ומערכת הרמות, כיוון זיהוי הצלילים בזמן אמת, רינדור התווים על החמשה, ערכות הצליל, מערכת התרגום לתשע שפות, הסטטיסטיקות והיסטוריית האימון.',
      ],
      contactLabel: 'יצירת קשר',
    },
    tech: {
      title: 'איך זה בנוי',
      items: [
        { name: 'React Native + Expo', desc: 'אפליקציה אחת לאנדרואיד, iOS ודפדפן, כתובה ב-TypeScript' },
        { name: 'VexFlow', desc: 'רינדור תווים מקצועי על חמשה' },
        { name: 'זיהוי צלילים בזמן אמת', desc: 'ניתוח אודיו מהמיקרופון עם כיול אישי לפסנתר שלכם' },
      ],
    },
  },
  en: {
    tagline: 'Piano sight-reading practice — with real-time feedback',
    versionLabel: 'Version',
    story: {
      title: 'The story behind the app',
      paras: [
        "Anyone who has studied piano knows the wall: the fingers already know how to play, but the eyes still translate every note slowly. Fluent sight reading is a skill built only through short daily practice — and that is exactly what this app was made to enable, without a teacher at your side or any special equipment.",
        'The app listens to your piano through the phone microphone, recognizes the notes you play in real time, and gives immediate feedback on every note. Eight graded difficulty levels, a learning mode for new notes, a library of familiar songs, daily-streak tracking and statistics — all built around one principle: a few minutes a day, consistently.',
        'The interface is fully translated into nine languages, including complete right-to-left support for Hebrew and Arabic.',
      ],
    },
    developer: {
      title: 'Credits',
      name: 'Assaf Biton',
      role: 'Concept, design & development',
      paras: [
        'The app was created, programmed and developed end to end by Assaf Biton — from the idea and product definition, through interface and experience design, to writing all of the code: the practice engine and level system, real-time pitch-detection tuning, notation rendering on the staff, the sound themes, the nine-language translation system, statistics and practice history.',
      ],
      contactLabel: 'Contact',
    },
    tech: {
      title: 'How it works',
      items: [
        { name: 'React Native + Expo', desc: 'One app for Android, iOS and the browser, written in TypeScript' },
        { name: 'VexFlow', desc: 'Professional music-notation rendering on the staff' },
        { name: 'Real-time pitch detection', desc: 'Microphone audio analysis with personal calibration for your piano' },
      ],
    },
  },
};

export function getAbout(lang: Lang): AboutContent {
  return ABOUT_CONTENT[lang] ?? ABOUT_CONTENT.en!;
}
