import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Pressable, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useLang } from '../context/LangContext';
import { LANGUAGE_META, Lang } from '../utils/i18n';
import { useTheme, ThemeColors } from '../utils/theme';

const LANGS = Object.entries(LANGUAGE_META) as [Lang, { name: string; rtl: boolean }][];

export default function LanguageDropdown() {
  const { lang, setLang } = useLang();
  const [open, setOpen] = useState(false);
  const current = LANGUAGE_META[lang];
  const C = useTheme();
  const s = makeStyles(C);

  return (
    <>
      <TouchableOpacity style={s.trigger} onPress={() => setOpen(true)} activeOpacity={0.8}>
        <Feather name="globe" size={13} color={C.primary} />
        <Text style={s.triggerTxt}>{current.name}</Text>
        <Feather name="chevron-down" size={13} color={C.muted} />
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)} statusBarTranslucent>
        <Pressable style={StyleSheet.absoluteFill} onPress={() => setOpen(false)} />
        <SafeAreaView style={s.panelWrap} pointerEvents="box-none">
          <View style={s.panel}>
            <FlatList
              data={LANGS}
              keyExtractor={([code]) => code}
              renderItem={({ item: [code, meta] }) => (
                <TouchableOpacity
                  style={[s.item, code === lang && s.itemActive]}
                  onPress={() => { setLang(code); setOpen(false); }}
                  activeOpacity={0.75}
                >
                  <Text style={[s.itemTxt, code === lang && s.itemTxtActive]}>{meta.name}</Text>
                  {code === lang && <Feather name="check" size={15} color={C.primary} />}
                </TouchableOpacity>
              )}
            />
          </View>
        </SafeAreaView>
      </Modal>
    </>
  );
}

function makeStyles(C: ThemeColors) {
  return StyleSheet.create({
    trigger: {
      flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8,
      borderRadius: 999, backgroundColor: C.card,
      shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 6, elevation: 2,
    },
    triggerTxt: { fontFamily: 'Heebo_600SemiBold', fontSize: 12.5, color: C.text },

    panelWrap: { paddingTop: 8, paddingHorizontal: 20, alignItems: 'flex-end' },
    panel: {
      width: 190, maxHeight: 340, backgroundColor: C.card, borderRadius: 18, padding: 8,
      shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.2, shadowRadius: 20, elevation: 8,
    },
    item: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingVertical: 10, paddingHorizontal: 12, borderRadius: 12,
    },
    itemActive: { backgroundColor: C.primaryTint },
    itemTxt: { fontFamily: 'Heebo_500Medium', fontSize: 13.5, color: C.text },
    itemTxtActive: { fontFamily: 'Heebo_700Bold', color: C.primary },
  });
}
