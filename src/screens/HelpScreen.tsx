import React, { useEffect, useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Modal,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useLang } from '../context/LangContext';
import { useProfile } from '../context/ProfileContext';
import { useTheme, ThemeColors } from '../utils/theme';
import { T } from '../utils/i18n';
import { RootStackParamList } from '../navigation/types';
import { getFaq, FaqCategory } from '../constants/faq';
import { ForumPost, loadPosts, addPost, addReply, deleteComment } from '../utils/forumStore';
import AppHeader from '../components/AppHeader';

type Styles = ReturnType<typeof makeStyles>;
type Nav = StackNavigationProp<RootStackParamList>;
type Tab = 'faq' | 'forum';
type CatFilter = 'all' | FaqCategory;

// Shared props threaded into both the list and thread views: who's signed in
// (drives author-only delete + posting gate) and how to send them to sign in.
interface ForumViewProps {
  currentUserId: string | null;
  currentUserName: string;
  isSignedIn: boolean;
  onRequireSignIn: () => void;
  t: T; C: ThemeColors; s: Styles;
}

function relTime(ts: number, t: T): string {
  const mins = Math.floor((Date.now() - ts) / 60000);
  if (mins < 1) return t.timeJustNow;
  if (mins < 60) return t.timeMinAgo.replace('{n}', String(mins));
  const hours = Math.floor(mins / 60);
  if (hours < 24) return t.timeHourAgo.replace('{n}', String(hours));
  return t.timeDayAgo.replace('{n}', String(Math.floor(hours / 24)));
}

export default function HelpScreen() {
  const navigation = useNavigation<Nav>();
  const { t, lang } = useLang();
  const { profile } = useProfile();
  const C = useTheme();
  const s = makeStyles(C);

  const currentUserId = profile?.id ?? null;
  const currentUserName = profile?.name ?? '';
  const isSignedIn = !!profile;

  const [tab, setTab] = useState<Tab>('faq');
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);

  // Reload when the signed-in user changes so posts (and their author-only
  // delete controls) reflect the current session, e.g. right after signing in.
  useEffect(() => {
    let cancelled = false;
    loadPosts().then(p => { if (!cancelled) setPosts(p); });
    return () => { cancelled = true; };
  }, [currentUserId]);

  const selectedPost = posts.find(p => p.id === selectedPostId) ?? null;

  const forumProps: ForumViewProps = {
    currentUserId, currentUserName, isSignedIn,
    onRequireSignIn: () => navigation.navigate('Auth', { mode: 'signin' }),
    t, C, s,
  };

  return (
    <SafeAreaView style={s.safe}>
      <AppHeader />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={s.container} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <View style={s.header}>
            <TouchableOpacity onPress={() => (selectedPost ? setSelectedPostId(null) : navigation.goBack())}>
              <Text style={s.back}>{t.back}</Text>
            </TouchableOpacity>
            <Text style={s.title}>{t.drawerHelp}</Text>
          </View>

          {!selectedPost && (
            <View style={s.tabsRow}>
              <TabBtn label={t.helpFaqTab} icon="book-open" active={tab === 'faq'} onPress={() => setTab('faq')} C={C} s={s} />
              <TabBtn label={t.helpForumTab} icon="message-circle" active={tab === 'forum'} onPress={() => setTab('forum')} C={C} s={s} />
            </View>
          )}

          {selectedPost ? (
            <ThreadView
              post={selectedPost}
              onPostsChange={setPosts}
              onDeleted={() => setSelectedPostId(null)}
              {...forumProps}
            />
          ) : tab === 'faq' ? (
            <FaqSection t={t} lang={lang} C={C} s={s} />
          ) : (
            <ForumSection posts={posts} onPostsChange={setPosts} onOpenPost={setSelectedPostId} {...forumProps} />
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function TabBtn({ label, icon, active, onPress, C, s }: {
  label: string; icon: keyof typeof Feather.glyphMap; active: boolean; onPress: () => void; C: ThemeColors; s: Styles;
}) {
  return (
    <TouchableOpacity style={[s.tabBtn, active && s.tabBtnActive]} onPress={onPress} activeOpacity={0.8}>
      <Feather name={icon} size={15} color={active ? '#fff' : C.muted} />
      <Text style={[s.tabTxt, active && s.tabTxtActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

// ---------- FAQ ----------

function FaqSection({ t, lang, C, s }: { t: T; lang: Parameters<typeof getFaq>[0]; C: ThemeColors; s: Styles }) {
  const [cat, setCat] = useState<CatFilter>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const items = useMemo(() => getFaq(lang), [lang]);
  const visible = cat === 'all' ? items : items.filter(i => i.category === cat);

  const cats: { key: CatFilter; label: string }[] = [
    { key: 'all', label: t.faqCatAll },
    { key: 'technical', label: t.faqCatTechnical },
    { key: 'musical', label: t.faqCatMusical },
    { key: 'app', label: t.faqCatApp },
  ];

  return (
    <>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.chipsRow}>
        {cats.map(c => (
          <TouchableOpacity
            key={c.key}
            style={[s.chip, cat === c.key && s.chipActive]}
            onPress={() => setCat(c.key)}
            activeOpacity={0.8}
          >
            <Text style={[s.chipTxt, cat === c.key && s.chipTxtActive]}>{c.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {visible.map(item => {
        const open = expandedId === item.id;
        return (
          <View key={item.id} style={s.faqCard}>
            <TouchableOpacity style={s.faqHead} onPress={() => setExpandedId(open ? null : item.id)} activeOpacity={0.7}>
              <Text style={s.faqQ}>{item.q}</Text>
              <Feather name={open ? 'chevron-up' : 'chevron-down'} size={18} color={C.muted} />
            </TouchableOpacity>
            {open && <Text style={s.faqA}>{item.a}</Text>}
          </View>
        );
      })}
    </>
  );
}

// ---------- Forum ----------

// Generic confirm dialog. `preview` shows the exact text about to be posted
// (the "showing their text" step of the post-confirmation requirement).
function ConfirmModal({ visible, message, preview, confirmLabel, destructive, onCancel, onConfirm, t, s }: {
  visible: boolean; message: string; preview?: string; confirmLabel: string; destructive?: boolean;
  onCancel: () => void; onConfirm: () => void; t: T; s: Styles;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={s.modalWrap}>
        <View style={s.modalCard}>
          <Text style={s.confirmTxt}>{message}</Text>
          {preview ? <Text style={s.previewBox} numberOfLines={6}>{preview}</Text> : null}
          <View style={s.modalBtns}>
            <TouchableOpacity style={s.cancelBtn} onPress={onCancel} activeOpacity={0.8}>
              <Text style={s.cancelBtnTxt}>{t.cancelBtn}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={destructive ? s.deleteBtn : s.publishBtn} onPress={onConfirm} activeOpacity={0.85}>
              <Text style={s.publishBtnTxt}>{confirmLabel}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function SignInPrompt({ onRequireSignIn, t, s }: { onRequireSignIn: () => void; t: T; s: Styles }) {
  return (
    <View style={s.signInBox}>
      <Text style={s.signInTxt}>{t.forumSignInPrompt}</Text>
      <TouchableOpacity style={s.publishBtn} onPress={onRequireSignIn} activeOpacity={0.85}>
        <Text style={s.publishBtnTxt}>{t.profileLoginBtn}</Text>
      </TouchableOpacity>
    </View>
  );
}

function ForumSection({ posts, onPostsChange, onOpenPost, currentUserId, currentUserName, isSignedIn, onRequireSignIn, t, C, s }: ForumViewProps & {
  posts: ForumPost[]; onPostsChange: (p: ForumPost[]) => void; onOpenPost: (id: string) => void;
}) {
  const [askOpen, setAskOpen] = useState(false);
  const [qTitle, setQTitle] = useState('');
  const [qBody, setQBody] = useState('');
  const [confirmPost, setConfirmPost] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  async function doPublish() {
    if (!currentUserId) return;
    const next = await addPost({ authorId: currentUserId, authorName: currentUserName, title: qTitle.trim(), body: qBody.trim() });
    onPostsChange(next);
    setConfirmPost(false);
    setAskOpen(false);
    setQTitle('');
    setQBody('');
  }

  async function confirmDelete() {
    if (!confirmDeleteId) return;
    onPostsChange(await deleteComment(confirmDeleteId));
    setConfirmDeleteId(null);
  }

  return (
    <>
      <Text style={s.forumIntro}>{t.forumIntro}</Text>

      {isSignedIn ? (
        <TouchableOpacity style={s.askBtn} onPress={() => setAskOpen(true)} activeOpacity={0.85}>
          <Feather name="edit-3" size={16} color="#fff" />
          <Text style={s.askBtnTxt}>{t.askQuestionBtn}</Text>
        </TouchableOpacity>
      ) : (
        <SignInPrompt onRequireSignIn={onRequireSignIn} t={t} s={s} />
      )}

      {posts.length === 0 && (
        <View style={s.emptyBox}>
          <Feather name="message-circle" size={28} color={C.muted} />
          <Text style={s.emptyTxt}>{t.forumEmpty}</Text>
        </View>
      )}

      {posts.map(post => (
        <TouchableOpacity key={post.id} style={s.postCard} onPress={() => onOpenPost(post.id)} activeOpacity={0.7}>
          <Text style={s.postTitle}>{post.title}</Text>
          <Text style={s.postBody} numberOfLines={2}>{post.body}</Text>
          <View style={s.postMeta}>
            <Text style={s.postMetaTxt}>{post.author} · {relTime(post.createdAt, t)}</Text>
            <View style={s.postActions}>
              <View style={s.repliesBadge}>
                <Feather name="message-square" size={12} color={C.primary} />
                <Text style={s.repliesBadgeTxt}>{t.repliesCount.replace('{n}', String(post.replies.length))}</Text>
              </View>
              {/* Delete only renders for the post's own author. */}
              {post.authorId === currentUserId && (
                <TouchableOpacity
                  style={s.trashBtn}
                  onPress={() => setConfirmDeleteId(post.id)}
                  activeOpacity={0.7}
                >
                  <Feather name="trash-2" size={14} color="#ef4444" />
                </TouchableOpacity>
              )}
            </View>
          </View>
        </TouchableOpacity>
      ))}

      <ConfirmModal
        visible={confirmDeleteId !== null}
        message={t.deletePostConfirm}
        confirmLabel={t.deleteBtn}
        destructive
        onCancel={() => setConfirmDeleteId(null)}
        onConfirm={confirmDelete}
        t={t} s={s}
      />

      <ConfirmModal
        visible={confirmPost}
        message={t.postConfirm}
        preview={qBody.trim()}
        confirmLabel={t.publishBtn}
        onCancel={() => setConfirmPost(false)}
        onConfirm={doPublish}
        t={t} s={s}
      />

      <Modal visible={askOpen} transparent animationType="fade" onRequestClose={() => setAskOpen(false)}>
        <KeyboardAvoidingView style={s.modalWrap} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={s.modalCard}>
            <Text style={s.modalTitle}>{t.newQuestionTitle}</Text>
            <TextInput
              style={s.input}
              placeholder={t.qTitlePlaceholder}
              placeholderTextColor={C.muted}
              value={qTitle}
              onChangeText={setQTitle}
            />
            <TextInput
              style={[s.input, s.inputMulti]}
              placeholder={t.qBodyPlaceholder}
              placeholderTextColor={C.muted}
              value={qBody}
              onChangeText={setQBody}
              multiline
            />
            <View style={s.modalBtns}>
              <TouchableOpacity style={s.cancelBtn} onPress={() => setAskOpen(false)} activeOpacity={0.8}>
                <Text style={s.cancelBtnTxt}>{t.cancelBtn}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.publishBtn, !(qTitle.trim() && qBody.trim()) && s.publishBtnDisabled]}
                onPress={() => setConfirmPost(true)}
                disabled={!(qTitle.trim() && qBody.trim())}
                activeOpacity={0.85}
              >
                <Text style={s.publishBtnTxt}>{t.publishBtn}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}

function ThreadView({ post, onPostsChange, onDeleted, currentUserId, currentUserName, isSignedIn, onRequireSignIn, t, C, s }: ForumViewProps & {
  post: ForumPost; onPostsChange: (p: ForumPost[]) => void; onDeleted: () => void;
}) {
  const [reply, setReply] = useState('');
  const [confirmSend, setConfirmSend] = useState(false);
  const [confirmDeletePost, setConfirmDeletePost] = useState(false);
  const [confirmDeleteReplyId, setConfirmDeleteReplyId] = useState<string | null>(null);

  async function doSend() {
    if (!currentUserId) return;
    const next = await addReply(post.id, { authorId: currentUserId, authorName: currentUserName, body: reply.trim() });
    onPostsChange(next);
    setConfirmSend(false);
    setReply('');
  }

  async function doDeletePost() {
    const next = await deleteComment(post.id);
    setConfirmDeletePost(false);
    // Order matters: clear the selection before the posts update so the screen
    // never renders a thread for a post that no longer exists.
    onDeleted();
    onPostsChange(next);
  }

  async function doDeleteReply() {
    if (!confirmDeleteReplyId) return;
    const next = await deleteComment(confirmDeleteReplyId);
    setConfirmDeleteReplyId(null);
    onPostsChange(next);
  }

  return (
    <>
      <View style={s.threadCard}>
        <Text style={s.postTitle}>{post.title}</Text>
        <Text style={s.threadBody}>{post.body}</Text>
        <View style={s.postMeta}>
          <Text style={s.postMetaTxt}>{post.author} · {relTime(post.createdAt, t)}</Text>
          {post.authorId === currentUserId && (
            <TouchableOpacity style={s.trashBtn} onPress={() => setConfirmDeletePost(true)} activeOpacity={0.7}>
              <Feather name="trash-2" size={14} color="#ef4444" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ConfirmModal
        visible={confirmDeletePost}
        message={t.deletePostConfirm}
        confirmLabel={t.deleteBtn}
        destructive
        onCancel={() => setConfirmDeletePost(false)}
        onConfirm={doDeletePost}
        t={t} s={s}
      />

      <Text style={s.repliesHeader}>{t.repliesCount.replace('{n}', String(post.replies.length))}</Text>

      {post.replies.length === 0 && <Text style={s.noReplies}>{t.noRepliesYet}</Text>}

      {post.replies.map(r => (
        <View key={r.id} style={s.replyCard}>
          <Text style={s.replyBody}>{r.body}</Text>
          <View style={s.replyMetaRow}>
            <Text style={s.postMetaTxt}>{r.author} · {relTime(r.createdAt, t)}</Text>
            {r.authorId === currentUserId && (
              <TouchableOpacity style={s.trashBtnSm} onPress={() => setConfirmDeleteReplyId(r.id)} activeOpacity={0.7}>
                <Feather name="trash-2" size={13} color="#ef4444" />
              </TouchableOpacity>
            )}
          </View>
        </View>
      ))}

      <ConfirmModal
        visible={confirmDeleteReplyId !== null}
        message={t.deletePostConfirm}
        confirmLabel={t.deleteBtn}
        destructive
        onCancel={() => setConfirmDeleteReplyId(null)}
        onConfirm={doDeleteReply}
        t={t} s={s}
      />

      {isSignedIn ? (
        <View style={s.replyBox}>
          <View style={s.replyRow}>
            <TextInput
              style={[s.input, s.replyInput]}
              placeholder={t.writeReplyPlaceholder}
              placeholderTextColor={C.muted}
              value={reply}
              onChangeText={setReply}
              multiline
            />
            <TouchableOpacity
              style={[s.sendBtn, !reply.trim() && s.publishBtnDisabled]}
              onPress={() => setConfirmSend(true)}
              disabled={!reply.trim()}
              activeOpacity={0.85}
            >
              <Feather name="send" size={17} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={{ marginTop: 14 }}>
          <SignInPrompt onRequireSignIn={onRequireSignIn} t={t} s={s} />
        </View>
      )}

      <ConfirmModal
        visible={confirmSend}
        message={t.postConfirm}
        preview={reply.trim()}
        confirmLabel={t.sendReplyBtn}
        onCancel={() => setConfirmSend(false)}
        onConfirm={doSend}
        t={t} s={s}
      />
    </>
  );
}

function makeStyles(C: ThemeColors) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: C.bg },
    container: { padding: 20, paddingBottom: 40 },
    header: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 16 },
    back: { fontFamily: 'Heebo_600SemiBold', fontSize: 16, color: C.primary },
    title: { fontFamily: 'Heebo_800ExtraBold', fontSize: 20, color: C.text },

    tabsRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
    tabBtn: {
      flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7,
      paddingVertical: 11, borderRadius: 14, backgroundColor: C.card,
      shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 1,
    },
    tabBtnActive: { backgroundColor: C.primary },
    tabTxt: { fontFamily: 'Heebo_600SemiBold', fontSize: 13.5, color: C.muted },
    tabTxtActive: { color: '#fff' },

    chipsRow: { gap: 8, paddingBottom: 14 },
    chip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: C.chipBg },
    chipActive: { backgroundColor: C.primaryTint },
    chipTxt: { fontFamily: 'Heebo_500Medium', fontSize: 12.5, color: C.muted },
    chipTxtActive: { color: C.primary, fontFamily: 'Heebo_700Bold' },

    faqCard: {
      backgroundColor: C.card, borderRadius: 16, paddingHorizontal: 16, paddingVertical: 14, marginBottom: 10,
      shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.07, shadowRadius: 10, elevation: 2,
    },
    faqHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
    faqQ: { flex: 1, fontFamily: 'Heebo_700Bold', fontSize: 14.5, color: C.text },
    faqA: { fontFamily: 'Heebo_400Regular', fontSize: 13.5, color: C.text, lineHeight: 21, marginTop: 10, opacity: 0.85 },

    forumIntro: { fontFamily: 'Heebo_400Regular', fontSize: 13, color: C.muted, lineHeight: 19, marginBottom: 14 },
    askBtn: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
      backgroundColor: C.primary, borderRadius: 16, paddingVertical: 13, marginBottom: 16,
    },
    askBtnTxt: { fontFamily: 'Heebo_700Bold', fontSize: 14.5, color: '#fff' },

    signInBox: {
      alignItems: 'center', gap: 12, backgroundColor: C.card, borderRadius: 16,
      padding: 20, marginBottom: 16,
    },
    signInTxt: { fontFamily: 'Heebo_500Medium', fontSize: 13.5, color: C.muted, textAlign: 'center', lineHeight: 20 },

    postCard: {
      backgroundColor: C.card, borderRadius: 16, padding: 16, marginBottom: 10,
      shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.07, shadowRadius: 10, elevation: 2,
    },
    postTitle: { fontFamily: 'Heebo_700Bold', fontSize: 15, color: C.text },
    postBody: { fontFamily: 'Heebo_400Regular', fontSize: 13, color: C.muted, lineHeight: 19, marginTop: 4 },
    postMeta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 },
    postMetaTxt: { fontFamily: 'Heebo_500Medium', fontSize: 11.5, color: C.muted, marginTop: 8 },
    repliesBadge: {
      flexDirection: 'row', alignItems: 'center', gap: 5,
      backgroundColor: C.primaryTint, borderRadius: 12, paddingHorizontal: 9, paddingVertical: 4,
    },
    repliesBadgeTxt: { fontFamily: 'Heebo_600SemiBold', fontSize: 11.5, color: C.primary },
    postActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    trashBtn: {
      width: 30, height: 30, borderRadius: 10, alignItems: 'center', justifyContent: 'center',
      backgroundColor: 'rgba(239,68,68,0.10)',
    },
    trashBtnSm: {
      width: 26, height: 26, borderRadius: 9, alignItems: 'center', justifyContent: 'center',
      backgroundColor: 'rgba(239,68,68,0.10)',
    },

    threadCard: {
      backgroundColor: C.card, borderRadius: 16, padding: 16, marginBottom: 18,
      shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.07, shadowRadius: 10, elevation: 2,
    },
    threadBody: { fontFamily: 'Heebo_400Regular', fontSize: 13.5, color: C.text, lineHeight: 21, marginTop: 6, opacity: 0.9 },
    repliesHeader: { fontFamily: 'Heebo_700Bold', fontSize: 14, color: C.text, marginBottom: 10 },
    noReplies: { fontFamily: 'Heebo_400Regular', fontSize: 13, color: C.muted, marginBottom: 12 },
    replyCard: {
      backgroundColor: C.chipBg, borderRadius: 14, padding: 13, marginBottom: 8,
    },
    replyBody: { fontFamily: 'Heebo_400Regular', fontSize: 13, color: C.text, lineHeight: 19 },
    replyMetaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },

    replyBox: { marginTop: 14, gap: 8 },
    replyRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
    replyInput: { flex: 1, minHeight: 44 },
    sendBtn: {
      width: 44, height: 44, borderRadius: 14, backgroundColor: C.primary,
      alignItems: 'center', justifyContent: 'center',
    },

    modalWrap: { flex: 1, backgroundColor: 'rgba(10,10,20,0.45)', justifyContent: 'center', padding: 24 },
    modalCard: { backgroundColor: C.card, borderRadius: 20, padding: 20, gap: 10 },
    modalTitle: { fontFamily: 'Heebo_800ExtraBold', fontSize: 17, color: C.text, marginBottom: 4 },
    input: {
      backgroundColor: C.chipBg, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10,
      fontFamily: 'Heebo_400Regular', fontSize: 13.5, color: C.text,
    },
    inputMulti: { minHeight: 90, textAlignVertical: 'top' },
    previewBox: {
      backgroundColor: C.chipBg, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10,
      fontFamily: 'Heebo_400Regular', fontSize: 13, color: C.text, lineHeight: 19,
    },
    modalBtns: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 6 },
    cancelBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12 },
    cancelBtnTxt: { fontFamily: 'Heebo_600SemiBold', fontSize: 13.5, color: C.muted },
    publishBtn: { backgroundColor: C.primary, borderRadius: 12, paddingHorizontal: 22, paddingVertical: 10 },
    deleteBtn: { backgroundColor: '#ef4444', borderRadius: 12, paddingHorizontal: 22, paddingVertical: 10 },
    confirmTxt: { fontFamily: 'Heebo_500Medium', fontSize: 14, color: C.text, lineHeight: 21 },
    publishBtnDisabled: { opacity: 0.4 },
    publishBtnTxt: { fontFamily: 'Heebo_700Bold', fontSize: 13.5, color: '#fff' },

    emptyBox: {
      alignItems: 'center', justifyContent: 'center', gap: 12,
      backgroundColor: C.card, borderRadius: 20, padding: 36, marginTop: 6, marginBottom: 10,
    },
    emptyTxt: { fontFamily: 'Heebo_500Medium', fontSize: 14, color: C.muted, textAlign: 'center' },
  });
}
