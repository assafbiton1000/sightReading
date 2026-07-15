import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Dimensions, Pressable, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/types';
import { useLang } from '../context/LangContext';
import { useProfile } from '../context/ProfileContext';
import { useTheme, ThemeColors } from '../utils/theme';

type Nav = StackNavigationProp<RootStackParamList>;
type FeatherIcon = keyof typeof Feather.glyphMap;

const { width: SCREEN_W } = Dimensions.get('window');
const DRAWER_W = Math.min(300, SCREEN_W * 0.8);

interface DrawerItem {
  key: string;
  label: string;
  icon: FeatherIcon;
  onPress?: () => void;
}

export default function SideDrawer({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const navigation = useNavigation<Nav>();
  const { t } = useLang();
  const { profile, logout } = useProfile();
  const C = useTheme();
  const s = makeStyles(C);
  const translateX = useRef(new Animated.Value(-DRAWER_W)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const [mounted, setMounted] = useState(visible);
  const [confirmLogout, setConfirmLogout] = useState(false);

  useEffect(() => {
    if (visible) {
      setMounted(true);
      Animated.parallel([
        Animated.timing(translateX, { toValue: 0, duration: 260, useNativeDriver: true }),
        Animated.timing(backdropOpacity, { toValue: 1, duration: 260, useNativeDriver: true }),
      ]).start();
    } else if (mounted) {
      Animated.parallel([
        Animated.timing(translateX, { toValue: -DRAWER_W, duration: 220, useNativeDriver: true }),
        Animated.timing(backdropOpacity, { toValue: 0, duration: 220, useNativeDriver: true }),
      ]).start(() => setMounted(false));
    }
  }, [visible]);

  if (!mounted) return null;

  function go(screen: 'Home' | 'Learning' | 'Settings' | 'Statistics' | 'Help' | 'About' | 'Support' | 'Profile') {
    onClose();
    navigation.navigate(screen);
  }

  const mainItems: DrawerItem[] = [
    { key: 'home',     label: t.drawerHome,          icon: 'home',          onPress: () => go('Home') },
    { key: 'settings', label: t.drawerSettings,       icon: 'settings',      onPress: () => go('Settings') },
    { key: 'stats',    label: t.drawerStats,          icon: 'bar-chart-2', onPress: () => go('Statistics') },
    { key: 'training', label: t.drawerTrainingModes,  icon: 'target',        onPress: () => go('Home') },
    { key: 'learning', label: t.drawerLearning,       icon: 'book-open',     onPress: () => go('Learning') },
    { key: 'help',     label: t.drawerHelp,           icon: 'help-circle',   onPress: () => go('Help') },
    { key: 'about',    label: t.drawerAbout,          icon: 'info',          onPress: () => go('About') },
    { key: 'support',  label: t.drawerSupport,        icon: 'heart',         onPress: () => go('Support') },
  ];

  const bottomItems: DrawerItem[] = [
    { key: 'profile', label: profile ? profile.name : t.drawerProfile, icon: 'user', onPress: () => go('Profile') },
    // Signed in: confirm-and-logout. Signed out: there's nothing to log out of,
    // so lead to the Profile screen's sign-in form instead of a dead row.
    { key: 'logout',  label: t.drawerLogout,  icon: 'log-out', onPress: profile ? () => setConfirmLogout(true) : () => go('Profile') },
  ];

  return (
    <Modal visible={mounted} transparent animationType="none" onRequestClose={onClose} statusBarTranslucent>
      <View style={StyleSheet.absoluteFill}>
        <Animated.View style={[StyleSheet.absoluteFill, s.backdropWrap, { opacity: backdropOpacity }]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose}>
            <BlurView intensity={28} tint="dark" style={StyleSheet.absoluteFill} />
          </Pressable>
        </Animated.View>

        {/* Crisp, fully-opaque close button — drawn on top of the blur so it never looks
            transparent, and lives in a separate Modal layer so the tap that opened the
            drawer can never also register as a tap that closes it. */}
        <SafeAreaView style={s.closeBarWrap} pointerEvents="box-none">
          <TouchableOpacity style={s.closeBtn} onPress={onClose} activeOpacity={0.8}>
            <Feather name="x" size={19} color={C.text} />
          </TouchableOpacity>
        </SafeAreaView>

        <Animated.View style={[s.drawer, { width: DRAWER_W, transform: [{ translateX }] }]}>
          <SafeAreaView style={s.header}>
            <View style={s.logoDot}>
              <Feather name="music" size={18} color={C.primary} />
            </View>
            <Text style={s.appName}>{t.appTitle}</Text>
          </SafeAreaView>

          <View style={s.list}>
            {mainItems.map(item => (
              <DrawerRow key={item.key} item={item} active={item.key === 'home'} C={C} s={s} />
            ))}
          </View>

          <View style={s.divider} />
          <View style={s.list}>
            {bottomItems.map(item => (
              <DrawerRow key={item.key} item={item} active={false} C={C} s={s} />
            ))}
          </View>

          <View style={s.spacer} />
        </Animated.View>

        {/* Logout confirmation — drawn as an overlay inside this Modal rather than a
            nested Modal, which iOS can't present while the drawer's Modal is open. */}
        {confirmLogout && (
          <View style={s.confirmWrap}>
            <View style={s.confirmCard}>
              <Text style={s.confirmTxt}>{t.logoutConfirmMsg}</Text>
              <View style={s.confirmBtns}>
                <TouchableOpacity style={s.confirmCancel} onPress={() => setConfirmLogout(false)} activeOpacity={0.8}>
                  <Text style={s.confirmCancelTxt}>{t.cancelBtn}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={s.confirmLogout}
                  onPress={() => { setConfirmLogout(false); logout(); onClose(); }}
                  activeOpacity={0.85}
                >
                  <Text style={s.confirmLogoutTxt}>{t.drawerLogout}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      </View>
    </Modal>
  );
}

function DrawerRow({ item, active, C, s }: { item: DrawerItem; active: boolean; C: ThemeColors; s: Styles }) {
  const disabled = !item.onPress;
  const iconBg = active ? 'rgba(255,255,255,0.22)' : disabled ? C.chipBg : C.primaryTint;
  const iconColor = active ? '#fff' : disabled ? C.muted : C.primary;

  return (
    <TouchableOpacity
      style={[s.row, active && s.rowActive]}
      onPress={item.onPress}
      disabled={disabled}
      activeOpacity={0.7}
    >
      <View style={[s.rowIcon, { backgroundColor: iconBg }]}>
        <Feather name={item.icon} size={16} color={iconColor} />
      </View>
      <Text style={[s.rowTxt, active && s.rowTxtActive, disabled && s.rowTxtDisabled]}>{item.label}</Text>
    </TouchableOpacity>
  );
}

type Styles = ReturnType<typeof makeStyles>;

function makeStyles(C: ThemeColors) {
  return StyleSheet.create({
    backdropWrap: { backgroundColor: 'rgba(10,10,20,0.15)' },

    closeBarWrap: { position: 'absolute', left: 0, right: 0, top: 0 },
    closeBtn: {
      width: 38, height: 38, borderRadius: 13, alignItems: 'center', justifyContent: 'center',
      backgroundColor: C.card, marginLeft: 20, marginTop: 8,
      shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 6, elevation: 3,
    },

    drawer: {
      position: 'absolute', left: 0, top: 0, bottom: 0, backgroundColor: C.card,
      borderTopRightRadius: 26, borderBottomRightRadius: 26,
      paddingBottom: 24, paddingHorizontal: 16,
      shadowColor: '#000', shadowOffset: { width: 6, height: 0 }, shadowOpacity: 0.18, shadowRadius: 20, elevation: 12,
    },
    header: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 8, paddingTop: 28, marginBottom: 22 },
    logoDot: { width: 36, height: 36, borderRadius: 18, backgroundColor: C.primaryTint, alignItems: 'center', justifyContent: 'center' },
    appName: { fontFamily: 'Heebo_700Bold', fontSize: 16, color: C.text },

    list: { gap: 4 },
    spacer: { flex: 1, minHeight: 12 },
    divider: { height: 1, backgroundColor: C.border, marginTop: 10, marginBottom: 8, marginHorizontal: 8 },

    row: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 11, paddingHorizontal: 10, borderRadius: 14 },
    rowActive: { backgroundColor: C.primary },
    rowIcon: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
    rowTxt: { fontFamily: 'Heebo_500Medium', fontSize: 14.5, color: C.text },
    rowTxtActive: { color: '#fff', fontFamily: 'Heebo_700Bold' },
    rowTxtDisabled: { color: C.muted },

    confirmWrap: {
      ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(10,10,20,0.45)',
      alignItems: 'center', justifyContent: 'center', padding: 24,
    },
    confirmCard: {
      alignSelf: 'stretch', backgroundColor: C.card, borderRadius: 20, padding: 20, gap: 10,
      shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.2, shadowRadius: 20, elevation: 8,
    },
    confirmTxt: { fontFamily: 'Heebo_500Medium', fontSize: 14, color: C.text, lineHeight: 21 },
    confirmBtns: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 6 },
    confirmCancel: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12 },
    confirmCancelTxt: { fontFamily: 'Heebo_600SemiBold', fontSize: 13.5, color: C.muted },
    confirmLogout: { backgroundColor: '#ef4444', borderRadius: 12, paddingHorizontal: 22, paddingVertical: 10 },
    confirmLogoutTxt: { fontFamily: 'Heebo_700Bold', fontSize: 13.5, color: '#fff' },
  });
}
