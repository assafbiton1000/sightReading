import { Lang } from '../utils/i18n';

export type FaqCategory = 'technical' | 'musical' | 'app';

export interface FaqItem {
  id: string;
  category: FaqCategory;
  q: string;
  a: string;
}

// Long-form content is maintained only in Hebrew and English — unlike the short
// UI strings in i18n.ts, translating full troubleshooting articles into all 9
// languages isn't practical. Other languages fall back to English.
const FAQ_CONTENT: Partial<Record<Lang, FaqItem[]>> = {
  he: [
    {
      id: 'mic-no-detect',
      category: 'technical',
      q: 'המיקרופון לא מזהה את התווים שאני מנגן',
      a: 'ודאו שאישרתם לאפליקציה גישה למיקרופון (בהגדרות המכשיר). לאחר מכן היכנסו ל"בדיקת שמע" מהמסך הראשי ונגנו תו — אם מד האות לא זז, הבעיה בהרשאה או במיקרופון עצמו.\n\nאם האות נקלט אבל תווים לא מזוהים: לחצו על "כייל קול לפי הפסנתר שלך" ונגנו תו אחד ארוך (2–3 שניות). כיול מתאים את הזיהוי לגוון של הפסנתר הספציפי שלכם.\n\nטיפים נוספים: קרבו את הטלפון לפסנתר (עד מטר), תרגלו בסביבה שקטה, והגבירו את "רגישות מיקרופון" בהגדרות אם אתם מנגנים בשקט.',
    },
    {
      id: 'mic-inaccurate',
      category: 'technical',
      q: 'הזיהוי לא מדויק — תווים נכונים מסומנים כשגויים',
      a: 'הסיבה הנפוצה ביותר היא חוסר כיול. הריצו כיול במסך "בדיקת שמע" — במיוחד אם מדובר בפסנתר אקוסטי או בקלידים עם גוון עשיר.\n\nבזמן התרגול: נגנו כל תו בנפרד ובצורה נקייה, שחררו את דוושת הסוסטיין (צלילים מתמשכים "נמרחים" אחד על השני), והנמיכו רעשי רקע — טלוויזיה, מזגן רועש או דיבור מבלבלים את הזיהוי.\n\nאם עדיין יש שגיאות, נסו להנמיך מעט את "רגישות מיקרופון" בהגדרות — רגישות גבוהה מדי קולטת גם הדים ותהודה.',
    },
    {
      id: 'no-sound',
      category: 'technical',
      q: 'אין צליל כשהאפליקציה מנגנת תווים',
      a: 'בדקו לפי הסדר: (1) המכשיר לא במצב שקט — באייפון שימו לב למתג הפיזי בצד. (2) עוצמת השמע של מדיה מוגברת — לא רק עוצמת השיחות. (3) אם מחוברות אוזניות בלוטות׳, ודאו שהן פעילות ומחוברות.\n\nאפשר גם לנסות להחליף את ערכת הצליל תחת "שינוי קול פסנתר" בהגדרות, ואם שום דבר לא עוזר — לסגור את האפליקציה לגמרי ולפתוח מחדש.',
    },
    {
      id: 'reminder-missing',
      category: 'technical',
      q: 'התזכורת היומית לא מופיעה',
      a: 'ודאו שהתזכורת מופעלת בהגדרות ושאישרתם הרשאת התראות כשהאפליקציה ביקשה. אם סירבתם בעבר — יש לאשר ידנית בהגדרות המכשיר תחת התראות.\n\nבאנדרואיד, "אופטימיזציית סוללה" אגרסיבית עלולה לחסום התראות מתוזמנות; הוסיפו את האפליקציה לרשימת החריגים.\n\nשימו לב: אם אתם מריצים את האפליקציה דרך Expo Go (סביבת פיתוח), חלק מיכולות ההתראות מוגבלות — בגרסה מותקנת רגילה הכל עובד.',
    },
    {
      id: 'app-slow',
      category: 'technical',
      q: 'האפליקציה איטית או נתקעת',
      a: 'סגרו אפליקציות אחרות שרצות ברקע — זיהוי צלילים בזמן אמת דורש כוח עיבוד. אם התצוגה נתקעת אחרי שימוש ממושך, סגירה ופתיחה מחדש של האפליקציה פותרת את רוב המקרים.\n\nאם הבעיה חוזרת באופן קבוע, פרסמו שאלה בפורום הקהילה עם דגם המכשיר — נשמח לעזור.',
    },
    {
      id: 'read-clefs',
      category: 'musical',
      q: 'איך לומדים לקרוא מפתח סול ומפתח פה?',
      a: 'במפתח סול, חמשת הקווים (מלמטה למעלה) הם: מי, סול, סי, רה, פה. הרווחים שביניהם: פה, לה, דו, מי. במפתח פה הקווים הם: סול, סי, רה, פה, לה, והרווחים: לה, דו, מי, סול.\n\nדרך טובה להתחיל: מצב "למידה" באפליקציה מציג תו אחד בכל פעם ומחכה שתנגנו אותו — כך לומדים לזהות בלי לחץ. כדאי גם להפעיל "תווים צבעוניים" בהגדרות (כל תו מקבל צבע קבוע) ולבחור תצוגת "סולפז׳" אם נוח לכם עם דו-רה-מי.\n\nהתחילו ברמות 1–2 שמוגבלות לתווים בודדים סביב הדו האמצעי, והתקדמו רק כשהזיהוי נעשה אוטומטי.',
    },
    {
      id: 'which-level',
      category: 'musical',
      q: 'מאיזו רמה כדאי להתחיל?',
      a: 'אם אתם חדשים לגמרי בקריאת תווים — רמה 1 (מתחיל מוחלט): תווים בודדים, טווח צר, קצב איטי. אם אתם כבר מזהים את רוב התווים במפתח סול — נסו רמה 3–4.\n\nכלל אצבע: הרמה הנכונה היא זו שבה אתם מצליחים בסביבות 80–90% מהתווים. מעל 95% קבוע — הגיע הזמן לעלות רמה; מתחת ל-70% — כדאי לרדת. דיוק חשוב ממהירות: עדיף לשלוט ברמה נמוכה מאשר לנחש ברמה גבוהה.',
    },
    {
      id: 'improve-speed',
      category: 'musical',
      q: 'איך משתפרים במהירות קריאת התווים (Sight Reading)?',
      a: 'העיקרון החשוב ביותר: תרגול קצר ויומי מנצח תרגול ארוך ונדיר. 10 דקות כל יום עדיפות על שעה פעם בשבוע — לכן האפליקציה עוקבת אחרי רצף ימי האימון שלכם.\n\nטכניקות שעובדות: (1) אל תסתכלו על הידיים — תנו לעיניים להישאר על התווים. (2) קראו "קדימה" — בזמן שאתם מנגנים תו, העיניים כבר בתו הבא. (3) התחילו ב-60 BPM והעלו ב-5–10 רק כשהדיוק יציב. (4) תרגלו את שני המפתחות לסירוגין כדי שאף אחד מהם לא יישאר חלש.',
    },
    {
      id: 'sharps-flats',
      category: 'musical',
      q: 'מה זה דיאז (♯) ובמול (♭)?',
      a: 'דיאז (♯) מעלה את התו בחצי טון — המקש השחור שמימין לתו הלבן. במול (♭) מוריד בחצי טון — המקש השחור שמשמאל. למשל: פה♯ הוא המקש השחור בין פה לסול.\n\nבאפליקציה אפשר לשלוט בכמות הסימנים האלה בתרגיל דרך הגדרת "בכ״מ" (בקרוב מקשים שחורים) במסך הבית — מתחילים בלי בכלל, ומוסיפים בהדרגה כשנוח.',
    },
    {
      id: 'what-bpm',
      category: 'musical',
      q: 'באיזה קצב (BPM) כדאי לתרגל?',
      a: 'התחילו ב-60 BPM — פעימה אחת בשנייה. זה איטי מספיק כדי לקרוא את התו הבא בנחת, ומהיר מספיק כדי לשמור על רצף.\n\nהעלו את הקצב ב-5–10 BPM רק אחרי שאתם מגיעים לדיוק של 90%+ באותה רמה שלוש פעמים ברצף. אם הדיוק צונח אחרי העלאה — חזרו אחורה. מומלץ להפעיל "ספירה לאחור לפני תרגול" בהגדרות כדי להיכנס לקצב לפני שהתרגיל מתחיל.',
    },
    {
      id: 'streak-how',
      category: 'app',
      q: 'איך נספר רצף ימי האימון שלי?',
      a: 'כל יום שבו השלמתם לפחות תרגול אחד (תרגול, האזנה או למידה) נספר כיום אימון. הרצף נשמר כל עוד התאמנתם היום או אתמול — כלומר, הרצף לא נשבר בבוקר לפני שהספקתם להתאמן.\n\nהרצף מתאפס רק אחרי יום שלם שדולג לחלוטין. את הרצף הנוכחי אפשר לראות במסך הבית ובמסך הסטטיסטיקה.',
    },
    {
      id: 'data-where',
      category: 'app',
      q: 'איפה נשמרים הנתונים שלי? יש סנכרון בין מכשירים?',
      a: 'כל הנתונים — היסטוריית תרגול, הגדרות ושאלות הפורום — נשמרים מקומית על המכשיר בלבד. אין כרגע חשבון משתמש או סנכרון ענן, כך שמעבר למכשיר חדש לא מעביר את ההיסטוריה.\n\nנתוני התרגול נשמרים ל-90 הימים האחרונים לצורך חישוב הסטטיסטיקות. מחיקת האפליקציה מוחקת את כל הנתונים.',
    },
    {
      id: 'change-lang',
      category: 'app',
      q: 'איך מחליפים שפה או מפעילים מצב כהה?',
      a: 'שפה: לחצו על בורר השפה בפינה העליונה של המסך (עם סמל הגלובוס) ובחרו מבין 9 שפות. הממשק מתעדכן מיידית.\n\nמצב כהה: בתפריט הצד ← הגדרות ← "מצב כהה". העיצוב הכהה נוח יותר לעיניים בתאורה חלשה וחוסך סוללה במסכי OLED.',
    },
  ],
  en: [
    {
      id: 'mic-no-detect',
      category: 'technical',
      q: "The microphone doesn't detect the notes I play",
      a: 'Make sure the app has microphone permission (in your device settings). Then open "Audio Test" from the home screen and play a note — if the signal meter doesn\'t move, the problem is the permission or the microphone itself.\n\nIf the signal registers but notes aren\'t recognized: tap "Calibrate to your piano" and hold one long note (2–3 seconds). Calibration adapts detection to the timbre of your specific piano.\n\nMore tips: keep the phone close to the piano (within a meter), practice in a quiet room, and raise "Microphone sensitivity" in Settings if you play softly.',
    },
    {
      id: 'mic-inaccurate',
      category: 'technical',
      q: 'Detection is inaccurate — correct notes are marked wrong',
      a: 'The most common cause is a missing calibration. Run it from the "Audio Test" screen — especially with an acoustic piano or a keyboard with a rich timbre.\n\nWhile practicing: play each note cleanly and separately, release the sustain pedal (overlapping ringing notes smear into each other), and reduce background noise — a TV, a loud AC or conversation confuses detection.\n\nIf errors persist, try lowering "Microphone sensitivity" slightly in Settings — too much sensitivity also picks up echo and resonance.',
    },
    {
      id: 'no-sound',
      category: 'technical',
      q: "There's no sound when the app plays notes",
      a: "Check in order: (1) The device isn't muted — on iPhone mind the physical side switch. (2) Media volume is up — not just ringer volume. (3) If Bluetooth headphones are paired, make sure they're on and connected.\n\nYou can also try switching the sound set under \"Piano sound\" in Settings, and if nothing helps — fully close the app and reopen it.",
    },
    {
      id: 'reminder-missing',
      category: 'technical',
      q: "The daily reminder doesn't appear",
      a: 'Make sure the reminder is enabled in Settings and that you granted notification permission when asked. If you declined in the past — allow it manually in your device\'s notification settings.\n\nOn Android, aggressive battery optimization can block scheduled notifications; add the app to the exceptions list.\n\nNote: when running the app through Expo Go (a development environment), some notification capabilities are limited — in a regular installed build everything works.',
    },
    {
      id: 'app-slow',
      category: 'technical',
      q: 'The app is slow or freezes',
      a: 'Close other apps running in the background — real-time pitch detection needs processing power. If the display freezes after extended use, fully closing and reopening the app resolves most cases.\n\nIf the problem keeps recurring, post a question in the community forum with your device model — we\'ll be glad to help.',
    },
    {
      id: 'read-clefs',
      category: 'musical',
      q: 'How do I learn to read treble and bass clef?',
      a: 'In treble clef, the five lines (bottom to top) are E, G, B, D, F ("Every Good Boy Does Fine") and the spaces spell F, A, C, E. In bass clef the lines are G, B, D, F, A ("Good Boys Do Fine Always") and the spaces are A, C, E, G ("All Cows Eat Grass").\n\nA good way to start: the app\'s "Learning" mode shows one note at a time and waits for you to play it — recognition without pressure. Also try enabling "Colorful notes" in Settings (each note gets a fixed color), and switch to solfège naming if do-re-mi feels more natural.\n\nStart at levels 1–2, which stay on single notes around middle C, and move up only once recognition feels automatic.',
    },
    {
      id: 'which-level',
      category: 'musical',
      q: 'Which level should I start at?',
      a: "If you're completely new to reading music — level 1 (absolute beginner): single notes, narrow range, slow tempo. If you already recognize most treble-clef notes — try level 3–4.\n\nRule of thumb: the right level is where you get roughly 80–90% of notes correct. Consistently above 95% — time to level up; below 70% — drop down. Accuracy beats speed: mastering a lower level is better than guessing at a higher one.",
    },
    {
      id: 'improve-speed',
      category: 'musical',
      q: 'How do I get faster at sight reading?',
      a: "The most important principle: short daily practice beats long rare practice. Ten minutes every day is worth more than an hour once a week — that's why the app tracks your daily streak.\n\nTechniques that work: (1) Don't look at your hands — keep your eyes on the staff. (2) Read ahead — while playing one note, your eyes should already be on the next. (3) Start at 60 BPM and raise by 5–10 only when accuracy is stable. (4) Alternate between both clefs so neither stays weak.",
    },
    {
      id: 'sharps-flats',
      category: 'musical',
      q: 'What are sharps (♯) and flats (♭)?',
      a: 'A sharp (♯) raises a note by a half step — the black key to the right of the white one. A flat (♭) lowers it by a half step — the black key to the left. For example, F♯ is the black key between F and G.\n\nIn the app you control how many of these appear in an exercise via the accidentals setting on the home screen — start with none and add gradually as you get comfortable.',
    },
    {
      id: 'what-bpm',
      category: 'musical',
      q: 'What tempo (BPM) should I practice at?',
      a: 'Start at 60 BPM — one beat per second. That\'s slow enough to read the next note calmly, and fast enough to keep a flow.\n\nRaise the tempo by 5–10 BPM only after hitting 90%+ accuracy at the same level three times in a row. If accuracy drops after raising it — go back. Enabling "Count-in before practice" in Settings helps you lock into the tempo before the exercise starts.',
    },
    {
      id: 'streak-how',
      category: 'app',
      q: 'How is my practice streak counted?',
      a: "Every day on which you complete at least one session (practice, listening or learning) counts as a training day. The streak stays alive as long as you trained today or yesterday — so it doesn't break in the morning before you've had a chance to practice.\n\nIt only resets after a full day is skipped entirely. You can see your current streak on the home screen and the statistics screen.",
    },
    {
      id: 'data-where',
      category: 'app',
      q: 'Where is my data stored? Is there sync between devices?',
      a: 'All data — practice history, settings and forum questions — is stored locally on this device only. There is currently no user account or cloud sync, so moving to a new device does not carry your history over.\n\nPractice data is kept for the last 90 days for statistics. Deleting the app deletes all data.',
    },
    {
      id: 'change-lang',
      category: 'app',
      q: 'How do I change the language or enable dark mode?',
      a: 'Language: tap the language selector at the top corner of the screen (globe icon) and pick one of 9 languages. The interface updates immediately.\n\nDark mode: side menu → Settings → "Dark mode". The dark design is easier on the eyes in low light and saves battery on OLED screens.',
    },
  ],
};

export function getFaq(lang: Lang): FaqItem[] {
  return FAQ_CONTENT[lang] ?? FAQ_CONTENT.en!;
}
