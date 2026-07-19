import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Modal, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/types';
import { useLang } from '../context/LangContext';
import { useProfile } from '../context/ProfileContext';
import { useHistory } from '../context/HistoryContext';
import { useTheme, ThemeColors } from '../utils/theme';
import { formatMinutes } from '../utils/format';
import { badgeForEmail, BADGE_META, ALL_BADGES, UserBadge } from '../constants/badges';
import { RANK_LABEL, Rank } from '../constants/ranks';
import AppHeader from '../components/AppHeader';

type Styles = ReturnType<typeof makeStyles>;

export default function ProfileScreen() {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const { t } = useLang();
  const { profile, rank, updateProfile, deleteAccount, logout } = useProfile();
  const { stats } = useHistory();
  const C = useTheme();
  const s = makeStyles(C);

  // Edit mode (signed-in state) — email is the account identity and can't be
  // edited here, only the display name.
  const [editing, setEditing] = useState(false);
  const [nameDraft, setNameDraft] = useState('');
  const [saving, setSaving] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  function startEdit() {
    if (!profile) return;
    setNameDraft(profile.name);
    setEditing(true);
  }

  async function saveEdit() {
    if (!nameDraft.trim() || saving) return;
    setSaving(true);
    try {
      await updateProfile({ name: nameDraft.trim() });
      setEditing(false);
    } finally {
      setSaving(false);
    }
  }

  async function runDeleteAccount() {
    if (deleting) return;
    setDeleting(true);
    try {
      const res = await deleteAccount();
      setConfirmDelete(false);
      // On success `profile` turns null and the screen falls back to the
      // signed-out card by itself.
      if (!res.ok) Alert.alert(t.deleteAccountBtn, t.deleteAccountErrMsg);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <SafeAreaView style={s.safe}>
      <AppHeader />
      <ScrollView contentContainerStyle={s.container} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View style={s.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={s.back}>{t.back}</Text>
          </TouchableOpacity>
          <Text style={s.title}>{t.drawerProfile}</Text>
        </View>

        {!profile ? (
          /* ---- Signed out: route to the real auth screen ---- */
          <View style={s.card}>
            <View style={s.loginIconWrap}>
              <Feather name="user" size={30} color={C.primary} />
            </View>
            <Text style={s.loginTitle}>{t.profileNotLoggedIn}</Text>
            <Text style={s.loginPrompt}>{t.profileLoginPrompt}</Text>
            <TouchableOpacity
              style={s.primaryBtn}
              onPress={() => navigation.navigate('Auth', { mode: 'signin' })}
              activeOpacity={0.85}
            >
              <Feather name="log-in" size={16} color="#fff" />
              <Text style={s.primaryBtnTxt}>{t.profileLoginBtn}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.navigate('Auth', { mode: 'signup' })} activeOpacity={0.8}>
              <Text style={s.signupLinkTxt}>{t.authSwitchToSignUp}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* ---- Identity hero ---- */}
            <View style={s.hero}>
              <View style={s.avatar}>
                <Text style={s.avatarTxt}>{profile.name.trim().charAt(0).toUpperCase()}</Text>
              </View>
              <Text style={s.heroName}>{profile.name}</Text>
              {!!profile.email && <Text style={s.heroEmail}>{profile.email}</Text>}
              {(() => {
                const meta = BADGE_META[badgeForEmail(profile.email)];
                return (
                  <View style={[s.badgeChip, { backgroundColor: meta.bg }]}>
                    <Feather name={meta.icon} size={13} color={meta.color} />
                    <Text style={[s.badgeChipTxt, { color: meta.color }]}>{meta.name}</Text>
                  </View>
                );
              })()}
              {!!rank && (
                <View style={s.rankChip}>
                  <Feather name="star" size={12} color="#0ea5e9" />
                  <Text style={s.rankChipTxt}>{RANK_LABEL[rank as Rank] ?? rank}</Text>
                </View>
              )}
              <View style={s.sinceChip}>
                <Feather name="calendar" size={12} color={C.muted} />
                <Text style={s.sinceTxt}>
                  {t.profileMemberSince} {new Date(profile.joinedAt).toLocaleDateString()}
                </Text>
              </View>
            </View>

            {/* ---- Personal details (view / edit) ---- */}
            <View style={s.card2}>
              <View style={s.cardHead}>
                <View style={[s.cardIcon, { backgroundColor: C.primaryTint }]}>
                  <Feather name="user" size={16} color={C.primary} />
                </View>
                <Text style={s.cardTitle}>{t.profilePersonalDetails}</Text>
              </View>

              {editing ? (
                <>
                  <Text style={s.fieldLabel}>{t.profileNameLabel}</Text>
                  <TextInput style={s.input} value={nameDraft} onChangeText={setNameDraft} placeholderTextColor={C.muted} />
                  <View style={s.fieldRow}>
                    <Text style={s.fieldLabel}>{t.profileEmailLabel}</Text>
                    <Text style={s.fieldValue}>{profile.email || '—'}</Text>
                  </View>
                  <TouchableOpacity
                    style={[s.primaryBtn, (!nameDraft.trim() || saving) && s.btnDisabled]}
                    onPress={saveEdit}
                    disabled={!nameDraft.trim() || saving}
                    activeOpacity={0.85}
                  >
                    <Feather name="check" size={16} color="#fff" />
                    <Text style={s.primaryBtnTxt}>{t.profileSaveBtn}</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <View style={s.fieldRow}>
                    <Text style={s.fieldLabel}>{t.profileNameLabel}</Text>
                    <Text style={s.fieldValue}>{profile.name}</Text>
                  </View>
                  <View style={s.fieldRow}>
                    <Text style={s.fieldLabel}>{t.profileEmailLabel}</Text>
                    <Text style={s.fieldValue}>{profile.email || '—'}</Text>
                  </View>
                  <TouchableOpacity style={s.editBtn} onPress={startEdit} activeOpacity={0.8}>
                    <Feather name="edit-2" size={14} color={C.primary} />
                    <Text style={s.editBtnTxt}>{t.profileEditBtn}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={s.deleteBtn} onPress={() => setConfirmDelete(true)} activeOpacity={0.8}>
                    <Feather name="trash-2" size={14} color="#ef4444" />
                    <Text style={s.deleteBtnTxt}>{t.deleteAccountBtn}</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>

            {/* ---- Activity summary (from practice history) ---- */}
            <View style={s.card2}>
              <View style={s.cardHead}>
                <View style={[s.cardIcon, { backgroundColor: 'rgba(245,158,11,0.12)' }]}>
                  <Feather name="activity" size={16} color="#f59e0b" />
                </View>
                <Text style={s.cardTitle}>{t.profileActivityTitle}</Text>
              </View>
              <View style={s.statsRow}>
                <View style={s.statCol}>
                  <Text style={s.statValue}>{stats.streak}</Text>
                  <Text style={s.statLabel}>{t.dayStreakLabel}</Text>
                </View>
                <View style={s.statDivider} />
                <View style={s.statCol}>
                  <Text style={s.statValue}>{formatMinutes(stats.weekMinutes)}</Text>
                  <Text style={s.statLabel}>{t.thisWeekLabel} ({t.minutesUnit})</Text>
                </View>
                <View style={s.statDivider} />
                <View style={s.statCol}>
                  <Text style={s.statValue}>{stats.avgAccuracy !== null ? `${stats.avgAccuracy}%` : '—'}</Text>
                  <Text style={s.statLabel}>{t.avgAccuracyLabel}</Text>
                </View>
              </View>
            </View>

            {/* ---- Badges: all user types, with the user's own highlighted ---- */}
            <View style={s.card2}>
              <View style={s.cardHead}>
                <View style={[s.cardIcon, { backgroundColor: 'rgba(139,92,246,0.12)' }]}>
                  <Feather name="award" size={16} color="#8b5cf6" />
                </View>
                <Text style={s.cardTitle}>{t.badgeSectionTitle}</Text>
              </View>
              {(() => {
                const mine = badgeForEmail(profile.email);
                const descByBadge: Record<UserBadge, string> = {
                  developer: t.badgeDevDesc,
                  patron: t.badgePatronDesc,
                  general: t.badgeLoverDesc,
                };
                return ALL_BADGES.map(b => {
                  const meta = BADGE_META[b];
                  const isMine = b === mine;
                  return (
                    <View key={b} style={[s.badgeRow, isMine && { backgroundColor: meta.bg }]}>
                      <View style={[s.badgeIcon, { backgroundColor: isMine ? meta.color : meta.bg }]}>
                        <Feather name={meta.icon} size={16} color={isMine ? '#fff' : meta.color} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[s.badgeName, isMine && { color: meta.color }]}>{meta.name}</Text>
                        <Text style={s.badgeDesc}>{descByBadge[b]}</Text>
                      </View>
                      {isMine && (
                        <View style={[s.badgeMineTag, { backgroundColor: meta.color }]}>
                          <Feather name="check" size={11} color="#fff" />
                          <Text style={s.badgeMineTxt}>{t.badgeYours}</Text>
                        </View>
                      )}
                    </View>
                  );
                });
              })()}
            </View>

            {/* ---- Clear logout ---- */}
            <TouchableOpacity style={s.logoutBtn} onPress={() => setConfirmLogout(true)} activeOpacity={0.85}>
              <Feather name="log-out" size={16} color="#fff" />
              <Text style={s.logoutBtnTxt}>{t.drawerLogout}</Text>
            </TouchableOpacity>

            <Modal visible={confirmDelete} transparent animationType="fade" onRequestClose={() => setConfirmDelete(false)}>
              <View style={s.modalWrap}>
                <View style={s.modalCard}>
                  <Text style={s.confirmTxt}>{t.deleteAccountConfirmMsg}</Text>
                  <View style={s.modalBtns}>
                    <TouchableOpacity style={s.cancelBtn} onPress={() => setConfirmDelete(false)} disabled={deleting} activeOpacity={0.8}>
                      <Text style={s.cancelBtnTxt}>{t.cancelBtn}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[s.confirmLogoutBtn, deleting && { opacity: 0.6 }]}
                      onPress={runDeleteAccount}
                      disabled={deleting}
                      activeOpacity={0.85}
                    >
                      {deleting ? (
                        <ActivityIndicator size="small" color="#fff" />
                      ) : (
                        <Text style={s.primaryBtnTxt}>{t.deleteAccountBtn}</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </Modal>

            <Modal visible={confirmLogout} transparent animationType="fade" onRequestClose={() => setConfirmLogout(false)}>
              <View style={s.modalWrap}>
                <View style={s.modalCard}>
                  <Text style={s.confirmTxt}>{t.logoutConfirmMsg}</Text>
                  <View style={s.modalBtns}>
                    <TouchableOpacity style={s.cancelBtn} onPress={() => setConfirmLogout(false)} activeOpacity={0.8}>
                      <Text style={s.cancelBtnTxt}>{t.cancelBtn}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={s.confirmLogoutBtn}
                      onPress={() => { setConfirmLogout(false); setEditing(false); logout(); }}
                      activeOpacity={0.85}
                    >
                      <Text style={s.primaryBtnTxt}>{t.drawerLogout}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </Modal>
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

    card: {
      alignItems: 'center', backgroundColor: C.card, borderRadius: 20, padding: 26, gap: 10,
      shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.1, shadowRadius: 16, elevation: 3,
    },
    loginIconWrap: {
      width: 64, height: 64, borderRadius: 32, backgroundColor: C.primaryTint,
      alignItems: 'center', justifyContent: 'center', marginBottom: 2,
    },
    loginTitle: { fontFamily: 'Heebo_800ExtraBold', fontSize: 18, color: C.text },
    loginPrompt: { fontFamily: 'Heebo_400Regular', fontSize: 13, color: C.muted, textAlign: 'center', lineHeight: 19, marginBottom: 6 },
    signupLinkTxt: { fontFamily: 'Heebo_600SemiBold', fontSize: 13, color: C.primary, paddingVertical: 4 },

    hero: {
      alignItems: 'center', backgroundColor: C.card, borderRadius: 20, padding: 24, marginBottom: 14,
      shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.1, shadowRadius: 16, elevation: 3,
    },
    avatar: {
      width: 68, height: 68, borderRadius: 34, backgroundColor: C.primary,
      alignItems: 'center', justifyContent: 'center', marginBottom: 10,
    },
    avatarTxt: { fontFamily: 'Heebo_800ExtraBold', fontSize: 28, color: '#fff' },
    heroName: { fontFamily: 'Heebo_800ExtraBold', fontSize: 21, color: C.text },
    heroEmail: { fontFamily: 'Heebo_500Medium', fontSize: 13, color: C.muted, marginTop: 2 },
    badgeChip: {
      flexDirection: 'row', alignItems: 'center', gap: 6,
      borderRadius: 14, paddingHorizontal: 12, paddingVertical: 5, marginTop: 10,
    },
    badgeChipTxt: { fontFamily: 'Heebo_700Bold', fontSize: 12 },
    rankChip: {
      flexDirection: 'row', alignItems: 'center', gap: 6,
      backgroundColor: 'rgba(14,165,233,0.12)', borderRadius: 14, paddingHorizontal: 12, paddingVertical: 5, marginTop: 8,
    },
    rankChipTxt: { fontFamily: 'Heebo_700Bold', fontSize: 12, color: '#0ea5e9' },
    sinceChip: {
      flexDirection: 'row', alignItems: 'center', gap: 6,
      backgroundColor: C.chipBg, borderRadius: 14, paddingHorizontal: 12, paddingVertical: 5, marginTop: 8,
    },
    sinceTxt: { fontFamily: 'Heebo_600SemiBold', fontSize: 11.5, color: C.muted },

    card2: {
      backgroundColor: C.card, borderRadius: 20, padding: 18, marginBottom: 14,
      shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.07, shadowRadius: 10, elevation: 2,
    },
    cardHead: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
    cardIcon: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
    cardTitle: { fontFamily: 'Heebo_700Bold', fontSize: 15.5, color: C.text },

    fieldRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8 },
    fieldLabel: { fontFamily: 'Heebo_500Medium', fontSize: 13, color: C.muted, marginBottom: 2 },
    fieldValue: { fontFamily: 'Heebo_600SemiBold', fontSize: 14, color: C.text },
    editBtn: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7,
      backgroundColor: C.primaryTint, borderRadius: 12, paddingVertical: 10, marginTop: 8,
    },
    editBtnTxt: { fontFamily: 'Heebo_700Bold', fontSize: 13, color: C.primary },
    deleteBtn: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7,
      backgroundColor: 'rgba(239,68,68,0.10)', borderRadius: 12, paddingVertical: 10, marginTop: 8,
    },
    deleteBtnTxt: { fontFamily: 'Heebo_700Bold', fontSize: 13, color: '#ef4444' },

    badgeRow: {
      flexDirection: 'row', alignItems: 'center', gap: 12,
      borderRadius: 14, paddingHorizontal: 10, paddingVertical: 9, marginBottom: 4,
    },
    badgeIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
    badgeName: { fontFamily: 'Heebo_700Bold', fontSize: 13.5, color: C.text },
    badgeDesc: { fontFamily: 'Heebo_400Regular', fontSize: 11.5, color: C.muted, marginTop: 1 },
    badgeMineTag: {
      flexDirection: 'row', alignItems: 'center', gap: 4,
      borderRadius: 10, paddingHorizontal: 8, paddingVertical: 4,
    },
    badgeMineTxt: { fontFamily: 'Heebo_700Bold', fontSize: 10.5, color: '#fff' },

    statsRow: { flexDirection: 'row', alignItems: 'center' },
    statCol: { flex: 1, alignItems: 'center' },
    statValue: { fontFamily: 'Heebo_800ExtraBold', fontSize: 20, color: C.text },
    statLabel: { fontFamily: 'Heebo_500Medium', fontSize: 10.5, color: C.muted, marginTop: 2, textAlign: 'center' },
    statDivider: { width: 1, height: 34, backgroundColor: C.border, marginHorizontal: 8 },

    input: {
      alignSelf: 'stretch', backgroundColor: C.chipBg, borderRadius: 12,
      paddingHorizontal: 14, paddingVertical: 10, marginBottom: 8,
      fontFamily: 'Heebo_400Regular', fontSize: 13.5, color: C.text,
    },
    primaryBtn: {
      alignSelf: 'stretch', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
      backgroundColor: C.primary, borderRadius: 14, paddingVertical: 12, marginTop: 4,
    },
    primaryBtnTxt: { fontFamily: 'Heebo_700Bold', fontSize: 14, color: '#fff' },
    btnDisabled: { opacity: 0.4 },

    logoutBtn: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
      backgroundColor: '#ef4444', borderRadius: 16, paddingVertical: 13, marginTop: 4,
    },
    logoutBtnTxt: { fontFamily: 'Heebo_700Bold', fontSize: 14.5, color: '#fff' },

    modalWrap: { flex: 1, backgroundColor: 'rgba(10,10,20,0.45)', justifyContent: 'center', padding: 24 },
    modalCard: { backgroundColor: C.card, borderRadius: 20, padding: 20, gap: 10 },
    confirmTxt: { fontFamily: 'Heebo_500Medium', fontSize: 14, color: C.text, lineHeight: 21 },
    modalBtns: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 6 },
    cancelBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12 },
    cancelBtnTxt: { fontFamily: 'Heebo_600SemiBold', fontSize: 13.5, color: C.muted },
    confirmLogoutBtn: { backgroundColor: '#ef4444', borderRadius: 12, paddingHorizontal: 22, paddingVertical: 10 },
  });
}
