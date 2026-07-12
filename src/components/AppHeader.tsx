import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import SideDrawer from './SideDrawer';
import LanguageDropdown from './LanguageDropdown';
import { useTheme, ThemeColors } from '../utils/theme';

export default function AppHeader() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const C = useTheme();
  const s = makeStyles(C);

  return (
    <>
      <View style={s.bar}>
        <TouchableOpacity style={s.menuBtn} onPress={() => setDrawerOpen(true)} activeOpacity={0.8}>
          <Feather name="menu" size={19} color={C.text} />
        </TouchableOpacity>
        <LanguageDropdown />
      </View>
      <SideDrawer visible={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </>
  );
}

function makeStyles(C: ThemeColors) {
  return StyleSheet.create({
    bar: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingHorizontal: 20, paddingTop: 8, paddingBottom: 8,
    },
    menuBtn: {
      width: 38, height: 38, borderRadius: 13, alignItems: 'center', justifyContent: 'center',
      backgroundColor: C.card,
      shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 6, elevation: 2,
    },
  });
}
