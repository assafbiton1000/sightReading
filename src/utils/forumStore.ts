import AsyncStorage from '@react-native-async-storage/async-storage';
import { Lang } from './i18n';

export interface ForumReply {
  id: string;
  author: string;
  body: string;
  createdAt: number;
}

export interface ForumPost {
  id: string;
  author: string;
  title: string;
  body: string;
  createdAt: number;
  replies: ForumReply[];
}

// Device-local persistence stands in for a shared backend that doesn't exist
// yet — every function here is async and owns its own read/modify/write cycle,
// so replacing AsyncStorage with server calls later only touches this file.
const STORAGE_KEY = '@sightreading/forum';

function makeId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

const DAY = 24 * 60 * 60 * 1000;

// Example threads written on first launch so the forum demonstrates what a
// question-with-replies looks like instead of opening empty. Hebrew and
// English only, matching the FAQ content languages.
function seedPosts(lang: Lang): ForumPost[] {
  const now = Date.now();
  if (lang === 'he') {
    return [
      {
        id: makeId(), author: 'נועה', createdAt: now - 3 * DAY,
        title: 'קשה לי לעבור מרמה 4 לרמה 5',
        body: 'ברמה 4 אני כבר מגיעה ל-95% כמעט כל תרגיל, אבל ברמה 5 הטווח קופץ ואני מאבדת את הביטחון. יש למישהו טיפ איך לגשר על הפער?',
        replies: [
          {
            id: makeId(), author: 'דניאל', createdAt: now - 2 * DAY,
            body: 'עבר עליי אותו דבר. מה שעזר לי: להוריד את הקצב ל-50 BPM ברמה 5 ולעלות בחזרה ל-60 רק אחרי כמה ימים. הקפיצה מרגישה קטנה יותר ככה.',
          },
          {
            id: makeId(), author: 'רות', createdAt: now - 1 * DAY,
            body: 'ממליצה גם לחזור למצב למידה ולתרגל רק את התווים החדשים של רמה 5 כמה דקות לפני כל תרגול.',
          },
        ],
      },
      {
        id: makeId(), author: 'אורי', createdAt: now - 2 * DAY,
        title: 'הזיהוי עובד לי רק כשאני מנגן חזק',
        body: 'כשאני מנגן בעדינות האפליקציה לא קולטת חצי מהתווים, ובנגינה חזקה הכל עובד. פסנתר חשמלי ברמקולים מובנים. מה אפשר לעשות?',
        replies: [
          {
            id: makeId(), author: 'מאיה', createdAt: now - 1 * DAY,
            body: 'תעלה את רגישות המיקרופון בהגדרות ותריץ כיול בבדיקת שמע. אצלי אחרי הכיול זה קלט גם נגינה שקטה. גם שווה לקרב את הטלפון לרמקולים.',
          },
        ],
      },
      {
        id: makeId(), author: 'מאיה', createdAt: now - 1 * DAY,
        title: 'ממליצים לתרגל עם אוזניות?',
        body: 'אני מתרגלת בערב ולא רוצה להפריע לשכנים. אם הפסנתר מחובר לאוזניות, האפליקציה בכלל יכולה לשמוע אותי?',
        replies: [],
      },
    ];
  }
  return [
    {
      id: makeId(), author: 'Noa', createdAt: now - 3 * DAY,
      title: 'Struggling to move from level 4 to level 5',
      body: "At level 4 I hit 95% on almost every exercise, but at level 5 the range jumps and I lose confidence. Any tips for bridging the gap?",
      replies: [
        {
          id: makeId(), author: 'Daniel', createdAt: now - 2 * DAY,
          body: 'Same thing happened to me. What helped: dropping to 50 BPM at level 5 and only going back up to 60 after a few days. The jump feels smaller that way.',
        },
        {
          id: makeId(), author: 'Ruth', createdAt: now - 1 * DAY,
          body: "I'd also suggest going back to Learning mode and drilling just the new level-5 notes for a few minutes before each session.",
        },
      ],
    },
    {
      id: makeId(), author: 'Ori', createdAt: now - 2 * DAY,
      title: 'Detection only works when I play loudly',
      body: "When I play softly the app misses half the notes, but loud playing works fine. Digital piano through built-in speakers. What can I do?",
      replies: [
        {
          id: makeId(), author: 'Maya', createdAt: now - 1 * DAY,
          body: 'Raise the microphone sensitivity in Settings and run calibration in Audio Test. After calibrating, mine picks up soft playing too. Moving the phone closer to the speakers also helps.',
        },
      ],
    },
    {
      id: makeId(), author: 'Maya', createdAt: now - 1 * DAY,
      title: 'Do you recommend practicing with headphones?',
      body: "I practice in the evening and don't want to disturb the neighbors. If the piano is on headphones, can the app even hear me?",
      replies: [],
    },
  ];
}

async function readPosts(): Promise<ForumPost[] | null> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : null;
  } catch (_) {
    return null;
  }
}

async function writePosts(posts: ForumPost[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(posts)).catch(() => {});
}

/** Newest first. Seeds example threads on the very first load. */
export async function loadPosts(lang: Lang): Promise<ForumPost[]> {
  const stored = await readPosts();
  if (stored) return stored;
  const seeded = seedPosts(lang);
  await writePosts(seeded);
  return seeded;
}

export async function addPost(input: { author: string; title: string; body: string }): Promise<ForumPost[]> {
  const posts = (await readPosts()) ?? [];
  const post: ForumPost = { id: makeId(), createdAt: Date.now(), replies: [], ...input };
  const next = [post, ...posts];
  await writePosts(next);
  return next;
}

export async function deletePost(postId: string): Promise<ForumPost[]> {
  const posts = (await readPosts()) ?? [];
  const next = posts.filter(p => p.id !== postId);
  await writePosts(next);
  return next;
}

export async function addReply(postId: string, input: { author: string; body: string }): Promise<ForumPost[]> {
  const posts = (await readPosts()) ?? [];
  const reply: ForumReply = { id: makeId(), createdAt: Date.now(), ...input };
  const next = posts.map(p => (p.id === postId ? { ...p, replies: [...p.replies, reply] } : p));
  await writePosts(next);
  return next;
}
