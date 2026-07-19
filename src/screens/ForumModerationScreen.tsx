import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useLang } from '../context/LangContext';
import { useProfile } from '../context/ProfileContext';
import { useTheme, ThemeColors } from '../utils/theme';
import { PendingComment, fetchPendingComments, approveComment, deletePendingComment } from '../utils/forumModeration';
import AppHeader from '../components/AppHeader';

// Admin-only moderation queue (Feature: forum moderation). Lists every pending
// comment and lets the admin approve (publish) or delete it. Every call goes
// through the forum-moderate Edge Function, which re-verifies is_admin — the
// client gate here is purely UX. English-only, like AdminScreen.

type Styles = ReturnType<typeof makeStyles>;

function when(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '' : d.toISOString().slice(0, 16).replace('T', ' ');
}

export default function ForumModerationScreen() {
  const navigation = useNavigation();
  const { t } = useLang();
  const { isAdmin } = useProfile();
  const C = useTheme();
  const s = makeStyles(C);

  const [pending, setPending] = useState<PendingComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      setPending(await fetchPendingComments());
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { if (isAdmin) load(); else setLoading(false); }, [isAdmin, load]);

  async function act(id: string, fn: (id: string) => Promise<PendingComment[]>) {
    setSavingId(id);
    try {
      setPending(await fn(id));
    } catch {
      setError(true);
    } finally {
      setSavingId(null);
    }
  }

  return (
    <SafeAreaView style={s.safe}>
      <AppHeader />
      <ScrollView contentContainerStyle={s.container} showsVerticalScrollIndicator={false}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={s.back}>{t.back}</Text>
          </TouchableOpacity>
          <Text style={s.title}>Forum moderation</Text>
        </View>

        {!isAdmin ? (
          <View style={s.centerBox}>
            <Feather name="lock" size={28} color={C.muted} />
            <Text style={s.centerTxt}>Admins only.</Text>
          </View>
        ) : loading ? (
          <View style={s.centerBox}><ActivityIndicator size="large" color={C.primary} /></View>
        ) : error ? (
          <View style={s.centerBox}>
            <Feather name="alert-triangle" size={28} color="#ef4444" />
            <Text style={s.centerTxt}>Couldn't load the moderation queue.</Text>
            <TouchableOpacity style={s.retryBtn} onPress={load} activeOpacity={0.85}>
              <Text style={s.retryTxt}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : pending.length === 0 ? (
          <View style={s.centerBox}>
            <Feather name="check-circle" size={28} color="#10b981" />
            <Text style={s.centerTxt}>Nothing pending — the queue is clear.</Text>
          </View>
        ) : (
          <>
            <Text style={s.countTxt}>{pending.length} pending</Text>
            {pending.map(c => {
              const saving = savingId === c.id;
              const isReply = c.parentId !== null;
              return (
                <View key={c.id} style={s.card}>
                  <View style={s.metaRow}>
                    <View style={[s.kindChip, isReply ? s.kindReply : s.kindPost]}>
                      <Feather name={isReply ? 'corner-down-right' : 'message-square'} size={11} color={isReply ? '#0ea5e9' : '#8b5cf6'} />
                      <Text style={[s.kindTxt, { color: isReply ? '#0ea5e9' : '#8b5cf6' }]}>{isReply ? 'reply' : 'post'}</Text>
                    </View>
                    <Text style={s.author} numberOfLines={1}>{c.authorName}</Text>
                    <Text style={s.date}>{when(c.createdAt)}</Text>
                  </View>

                  {!!c.title && <Text style={s.postTitle}>{c.title}</Text>}
                  <Text style={s.body}>{c.body}</Text>

                  <View style={s.actions}>
                    <TouchableOpacity
                      style={[s.btn, s.approveBtn, saving && s.disabled]}
                      onPress={() => act(c.id, approveComment)}
                      disabled={saving}
                      activeOpacity={0.85}
                    >
                      <Feather name="check" size={15} color="#fff" />
                      <Text style={s.approveTxt}>Approve</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[s.btn, s.deleteBtn, saving && s.disabled]}
                      onPress={() => act(c.id, deletePendingComment)}
                      disabled={saving}
                      activeOpacity={0.85}
                    >
                      <Feather name="trash-2" size={15} color="#ef4444" />
                      <Text style={s.deleteTxt}>Delete</Text>
                    </TouchableOpacity>
                    {saving && <ActivityIndicator size="small" color={C.muted} />}
                  </View>
                </View>
              );
            })}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function makeStyles(C: ThemeColors) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: C.bg },
    container: { padding: 20, paddingBottom: 40 },
    header: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 16 },
    back: { fontFamily: 'Heebo_600SemiBold', fontSize: 16, color: C.primary },
    title: { fontFamily: 'Heebo_800ExtraBold', fontSize: 20, color: C.text },

    centerBox: { alignItems: 'center', justifyContent: 'center', gap: 12, paddingVertical: 60 },
    centerTxt: { fontFamily: 'Heebo_500Medium', fontSize: 14, color: C.muted, textAlign: 'center' },
    retryBtn: { backgroundColor: C.primary, borderRadius: 12, paddingHorizontal: 22, paddingVertical: 10, marginTop: 4 },
    retryTxt: { fontFamily: 'Heebo_700Bold', fontSize: 13.5, color: '#fff' },

    countTxt: { fontFamily: 'Heebo_600SemiBold', fontSize: 13, color: C.muted, marginBottom: 12 },

    card: {
      backgroundColor: C.card, borderRadius: 16, padding: 16, marginBottom: 12, gap: 8,
      shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.07, shadowRadius: 10, elevation: 2,
    },
    metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    kindChip: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3 },
    kindPost: { backgroundColor: 'rgba(139,92,246,0.12)' },
    kindReply: { backgroundColor: 'rgba(14,165,233,0.12)' },
    kindTxt: { fontFamily: 'Heebo_700Bold', fontSize: 10.5 },
    author: { flex: 1, fontFamily: 'Heebo_700Bold', fontSize: 13, color: C.text },
    date: { fontFamily: 'Heebo_500Medium', fontSize: 11, color: C.muted },

    postTitle: { fontFamily: 'Heebo_800ExtraBold', fontSize: 15, color: C.text },
    body: { fontFamily: 'Heebo_400Regular', fontSize: 13.5, color: C.text, lineHeight: 20 },

    actions: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 4 },
    btn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderRadius: 12, paddingVertical: 10, paddingHorizontal: 16 },
    approveBtn: { backgroundColor: '#10b981', flex: 1 },
    approveTxt: { fontFamily: 'Heebo_700Bold', fontSize: 13.5, color: '#fff' },
    deleteBtn: { backgroundColor: 'rgba(239,68,68,0.12)', flex: 1 },
    deleteTxt: { fontFamily: 'Heebo_700Bold', fontSize: 13.5, color: '#ef4444' },
    disabled: { opacity: 0.4 },
  });
}
