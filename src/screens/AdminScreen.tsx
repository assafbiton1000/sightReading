import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/types';
import { useLang } from '../context/LangContext';
import { useProfile } from '../context/ProfileContext';
import { useTheme, ThemeColors } from '../utils/theme';
import { AdminUser, fetchAdminUsers, updateAdminUser } from '../utils/admin';
import { RANKS, RANK_LABEL, Rank } from '../constants/ranks';
import AppHeader from '../components/AppHeader';

// In-app admin dashboard (Feature 3). Visible only via the admin-gated drawer
// entry; every read/write below goes through the admin-users Edge Function,
// which re-verifies the caller is an admin server-side — the client gate here
// is purely UX. English-only: this is an internal developer tool.

type Styles = ReturnType<typeof makeStyles>;

const POINT_STEPS = [-10, -1, 1, 10];

function rankLabel(rank: string): string {
  return RANK_LABEL[rank as Rank] ?? rank;
}

function joinedDate(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '' : d.toISOString().slice(0, 10);
}

export default function AdminScreen() {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const { t } = useLang();
  const { isAdmin } = useProfile();
  const C = useTheme();
  const s = makeStyles(C);

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [rankPickerFor, setRankPickerFor] = useState<AdminUser | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      setUsers(await fetchAdminUsers());
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { if (isAdmin) load(); else setLoading(false); }, [isAdmin, load]);

  async function changePoints(user: AdminUser, delta: number) {
    const next = Math.max(0, user.points + delta);
    if (next === user.points) return;
    setSavingId(user.id);
    try {
      setUsers(await updateAdminUser({ userId: user.id, points: next }));
    } catch {
      setError(true);
    } finally {
      setSavingId(null);
    }
  }

  async function setRank(user: AdminUser, rank: Rank) {
    setRankPickerFor(null);
    setSavingId(user.id);
    try {
      setUsers(await updateAdminUser({ userId: user.id, rank }));
    } catch {
      setError(true);
    } finally {
      setSavingId(null);
    }
  }

  async function toggleBadge(user: AdminUser, flag: 'isAdmin' | 'isPatron') {
    setSavingId(user.id);
    try {
      const patch = flag === 'isAdmin' ? { isAdmin: !user.isAdmin } : { isPatron: !user.isPatron };
      setUsers(await updateAdminUser({ userId: user.id, ...patch }));
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
          <Text style={s.title}>Admin</Text>
        </View>

        {!isAdmin ? (
          <View style={s.centerBox}>
            <Feather name="lock" size={28} color={C.muted} />
            <Text style={s.centerTxt}>Admins only.</Text>
          </View>
        ) : loading ? (
          <View style={s.centerBox}>
            <ActivityIndicator size="large" color={C.primary} />
          </View>
        ) : error ? (
          <View style={s.centerBox}>
            <Feather name="alert-triangle" size={28} color="#ef4444" />
            <Text style={s.centerTxt}>Couldn't load users.</Text>
            <TouchableOpacity style={s.retryBtn} onPress={load} activeOpacity={0.85}>
              <Text style={s.retryTxt}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <TouchableOpacity style={s.modLink} onPress={() => navigation.navigate('ForumModeration')} activeOpacity={0.85}>
              <Feather name="shield" size={15} color={C.primary} />
              <Text style={s.modLinkTxt}>Forum moderation</Text>
              <Feather name="chevron-right" size={16} color={C.muted} />
            </TouchableOpacity>
            <Text style={s.countTxt}>{users.length} user{users.length === 1 ? '' : 's'}</Text>
            {users.map(user => {
              const saving = savingId === user.id;
              return (
                <View key={user.id} style={s.card}>
                  <View style={s.cardTop}>
                    <View style={{ flex: 1 }}>
                      <View style={s.nameRow}>
                        <Text style={s.name} numberOfLines={1}>{user.name}</Text>
                        {user.isAdmin && (
                          <View style={s.adminBadge}>
                            <Feather name="shield" size={11} color="#8b5cf6" />
                            <Text style={s.adminBadgeTxt}>admin</Text>
                          </View>
                        )}
                      </View>
                      <Text style={s.email} numberOfLines={1}>{user.email}</Text>
                      <Text style={s.meta}>{user.comments} comments · joined {joinedDate(user.joinedAt)}</Text>
                    </View>
                    {saving && <ActivityIndicator size="small" color={C.muted} />}
                  </View>

                  {/* Points stepper */}
                  <View style={s.pointsRow}>
                    <TouchableOpacity
                      style={[s.stepBtn, s.stepBtnLg, saving && s.disabled]}
                      onPress={() => changePoints(user, POINT_STEPS[0])}
                      disabled={saving}
                    >
                      <Text style={s.stepTxt}>−10</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[s.stepBtn, saving && s.disabled]}
                      onPress={() => changePoints(user, POINT_STEPS[1])}
                      disabled={saving}
                    >
                      <Text style={s.stepTxt}>−1</Text>
                    </TouchableOpacity>

                    <Text style={s.points}>{user.points} pts</Text>

                    <TouchableOpacity
                      style={[s.stepBtn, saving && s.disabled]}
                      onPress={() => changePoints(user, POINT_STEPS[2])}
                      disabled={saving}
                    >
                      <Text style={s.stepTxt}>+1</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[s.stepBtn, s.stepBtnLg, saving && s.disabled]}
                      onPress={() => changePoints(user, POINT_STEPS[3])}
                      disabled={saving}
                    >
                      <Text style={s.stepTxt}>+10</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Rank selector */}
                  <TouchableOpacity
                    style={[s.rankBtn, saving && s.disabled]}
                    onPress={() => setRankPickerFor(user)}
                    disabled={saving}
                    activeOpacity={0.8}
                  >
                    <Text style={s.rankLabel}>Rank</Text>
                    <View style={s.rankValueWrap}>
                      <Text style={s.rankValue}>{rankLabel(user.rank)}</Text>
                      <Feather name="chevron-down" size={16} color={C.muted} />
                    </View>
                  </TouchableOpacity>

                  {/* Badge promotion */}
                  <View style={s.badgeToggleRow}>
                    <TouchableOpacity
                      style={[s.badgeToggle, user.isPatron && s.badgeToggleOnPatron, saving && s.disabled]}
                      onPress={() => toggleBadge(user, 'isPatron')}
                      disabled={saving}
                      activeOpacity={0.8}
                    >
                      <Feather name="award" size={13} color={user.isPatron ? '#f59e0b' : C.muted} />
                      <Text style={[s.badgeToggleTxt, user.isPatron && { color: '#f59e0b' }]}>Patron</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[s.badgeToggle, user.isAdmin && s.badgeToggleOnDev, saving && s.disabled]}
                      onPress={() => toggleBadge(user, 'isAdmin')}
                      disabled={saving}
                      activeOpacity={0.8}
                    >
                      <Feather name="code" size={13} color={user.isAdmin ? '#8b5cf6' : C.muted} />
                      <Text style={[s.badgeToggleTxt, user.isAdmin && { color: '#8b5cf6' }]}>Code Composer</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </>
        )}
      </ScrollView>

      {/* Rank picker */}
      <Modal visible={rankPickerFor !== null} transparent animationType="fade" onRequestClose={() => setRankPickerFor(null)}>
        <TouchableOpacity style={s.modalWrap} activeOpacity={1} onPress={() => setRankPickerFor(null)}>
          <View style={s.modalCard}>
            <Text style={s.modalTitle}>Set rank{rankPickerFor ? ` — ${rankPickerFor.name}` : ''}</Text>
            {RANKS.map(r => {
              const selected = rankPickerFor?.rank === r;
              return (
                <TouchableOpacity
                  key={r}
                  style={[s.rankOption, selected && s.rankOptionActive]}
                  onPress={() => rankPickerFor && setRank(rankPickerFor, r)}
                  activeOpacity={0.8}
                >
                  <Text style={[s.rankOptionTxt, selected && s.rankOptionTxtActive]}>{RANK_LABEL[r]}</Text>
                  {selected && <Feather name="check" size={16} color={C.primary} />}
                </TouchableOpacity>
              );
            })}
          </View>
        </TouchableOpacity>
      </Modal>
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

    modLink: {
      flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: C.card,
      borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14, marginBottom: 14,
      shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.07, shadowRadius: 10, elevation: 2,
    },
    modLinkTxt: { flex: 1, fontFamily: 'Heebo_700Bold', fontSize: 14, color: C.text },

    countTxt: { fontFamily: 'Heebo_600SemiBold', fontSize: 13, color: C.muted, marginBottom: 12 },

    card: {
      backgroundColor: C.card, borderRadius: 16, padding: 16, marginBottom: 12, gap: 12,
      shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.07, shadowRadius: 10, elevation: 2,
    },
    cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
    nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    name: { fontFamily: 'Heebo_700Bold', fontSize: 15, color: C.text, flexShrink: 1 },
    adminBadge: {
      flexDirection: 'row', alignItems: 'center', gap: 4,
      backgroundColor: 'rgba(139,92,246,0.12)', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3,
    },
    adminBadgeTxt: { fontFamily: 'Heebo_700Bold', fontSize: 10.5, color: '#8b5cf6' },
    email: { fontFamily: 'Heebo_400Regular', fontSize: 12.5, color: C.muted, marginTop: 3 },
    meta: { fontFamily: 'Heebo_500Medium', fontSize: 11.5, color: C.muted, marginTop: 5 },

    pointsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 6 },
    stepBtn: {
      minWidth: 40, height: 36, paddingHorizontal: 8, borderRadius: 10,
      backgroundColor: C.chipBg, alignItems: 'center', justifyContent: 'center',
    },
    stepBtnLg: { backgroundColor: C.primaryTint },
    stepTxt: { fontFamily: 'Heebo_700Bold', fontSize: 13, color: C.text },
    points: { flex: 1, textAlign: 'center', fontFamily: 'Heebo_800ExtraBold', fontSize: 15, color: C.text },
    disabled: { opacity: 0.4 },

    rankBtn: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      backgroundColor: C.chipBg, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 11,
    },
    rankLabel: { fontFamily: 'Heebo_600SemiBold', fontSize: 13, color: C.muted },
    rankValueWrap: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    rankValue: { fontFamily: 'Heebo_700Bold', fontSize: 13.5, color: C.text },

    badgeToggleRow: { flexDirection: 'row', gap: 8 },
    badgeToggle: {
      flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
      backgroundColor: C.chipBg, borderRadius: 12, paddingVertical: 10,
      borderWidth: 1.5, borderColor: 'transparent',
    },
    badgeToggleOnPatron: { borderColor: '#f59e0b', backgroundColor: 'rgba(245,158,11,0.10)' },
    badgeToggleOnDev: { borderColor: '#8b5cf6', backgroundColor: 'rgba(139,92,246,0.10)' },
    badgeToggleTxt: { fontFamily: 'Heebo_700Bold', fontSize: 12.5, color: C.muted },

    modalWrap: { flex: 1, backgroundColor: 'rgba(10,10,20,0.45)', justifyContent: 'center', padding: 24 },
    modalCard: { backgroundColor: C.card, borderRadius: 20, padding: 16, gap: 6 },
    modalTitle: { fontFamily: 'Heebo_800ExtraBold', fontSize: 16, color: C.text, marginBottom: 6, paddingHorizontal: 4 },
    rankOption: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingHorizontal: 14, paddingVertical: 12, borderRadius: 12,
    },
    rankOptionActive: { backgroundColor: C.primaryTint },
    rankOptionTxt: { fontFamily: 'Heebo_600SemiBold', fontSize: 14, color: C.text },
    rankOptionTxtActive: { color: C.primary, fontFamily: 'Heebo_700Bold' },
  });
}
