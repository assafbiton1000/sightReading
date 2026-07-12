import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Animated, Platform, Modal, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useLang } from '../context/LangContext';
import { useSettings, AudioInputSource, NoteNamingStyle, DisappearingTiming } from '../context/SettingsContext';
import { PIANO_SOUND_THEMES } from '../constants/pianoSounds';
import { useTheme, ThemeColors } from '../utils/theme';
import AppHeader from '../components/AppHeader';

type FeatherIcon = keyof typeof Feather.glyphMap;
type Styles = ReturnType<typeof makeStyles>;

export default function SettingsScreen() {
  const { t } = useLang();
  const { settings, updateSetting } = useSettings();
  const C = useTheme();
  const s = makeStyles(C);
  const [inputDropdownOpen, setInputDropdownOpen] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const [reminderHH, reminderMM] = settings.dailyReminderTime.split(':').map(Number);
  const reminderDate = new Date();
  reminderDate.setHours(reminderHH || 0, reminderMM || 0, 0, 0);

  function handleTimeChange(event: DateTimePickerEvent, selected?: Date) {
    if (Platform.OS === 'android') setShowTimePicker(false);
    if (event.type === 'dismissed') return;
    if (selected) {
      const hh = String(selected.getHours()).padStart(2, '0');
      const mm = String(selected.getMinutes()).padStart(2, '0');
      updateSetting('dailyReminderTime', `${hh}:${mm}`);
    }
  }

  return (
    <SafeAreaView style={s.safe}>
      <AppHeader />
      <ScrollView contentContainerStyle={s.container} showsVerticalScrollIndicator={false}>
        <Text style={s.title}>{t.settingsTitle}</Text>

        {/* ── Audio & Input ─────────────────────────────────────── */}
        <SettingCard title={t.sectionAudioInput} s={s}>
          <SettingRow icon="mic" label={t.audioInputLabel} s={s} C={C}>
            <TouchableOpacity style={s.dropdownBtn} onPress={() => setInputDropdownOpen(true)} activeOpacity={0.8}>
              <Text style={s.dropdownBtnTxt}>
                {settings.audioInputSource === 'mic' ? t.audioInputMic : t.audioInputMidi}
              </Text>
              <Feather name="chevron-down" size={14} color={C.muted} />
            </TouchableOpacity>
          </SettingRow>

          <SettingRow icon="sliders" label={t.micSensitivityLabel} s={s} C={C} last>
            <View />
          </SettingRow>
          <View style={s.sliderRow}>
            <Text style={s.sliderEdgeLabel}>{t.sensitivityLow}</Text>
            <Slider
              style={s.slider}
              minimumValue={0}
              maximumValue={1}
              value={settings.micSensitivity}
              onSlidingComplete={v => updateSetting('micSensitivity', v)}
              minimumTrackTintColor={C.primary}
              maximumTrackTintColor={C.border}
              thumbTintColor={C.primary}
            />
            <Text style={s.sliderEdgeLabel}>{t.sensitivityHigh}</Text>
          </View>

          <SettingRow icon="music" label={t.pianoSoundLabel} s={s} C={C} last>
            <View />
          </SettingRow>
          <View style={s.soundThemeRow}>
            {PIANO_SOUND_THEMES.map(theme => (
              <TouchableOpacity
                key={theme.id}
                style={[s.soundChip, settings.pianoSoundTheme === theme.id && s.soundChipActive]}
                onPress={() => updateSetting('pianoSoundTheme', theme.id)}
                activeOpacity={0.8}
              >
                <Text style={[s.soundChipTxt, settings.pianoSoundTheme === theme.id && s.soundChipTxtActive]}>
                  {theme.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </SettingCard>

        {/* ── Musical Display ───────────────────────────────────── */}
        <SettingCard title={t.sectionMusicDisplay} s={s}>
          <SettingRow icon="type" label={t.noteNamingLabel} s={s} C={C}>
            <Segmented
              value={settings.noteNaming}
              options={[
                { value: 'letters' as NoteNamingStyle, label: 'C D E' },
                { value: 'solfege' as NoteNamingStyle, label: t.noteNamingSolfege.replace(/\s*\(.*\)/, '') },
              ]}
              onChange={v => updateSetting('noteNaming', v)}
              s={s}
            />
          </SettingRow>

          <SettingRow icon="droplet" label={t.colorfulNotesLabel} desc={t.colorfulNotesDesc} s={s} C={C}>
            <Toggle value={settings.colorfulNotes} onChange={v => updateSetting('colorfulNotes', v)} C={C} s={s} />
          </SettingRow>

          <SettingRow icon="maximize-2" label={t.staffSizeLabel} s={s} C={C} last>
            <View />
          </SettingRow>
          <View style={[s.sliderRow, s.lastSliderRow]}>
            <Text style={s.sliderEdgeLabel}>{t.staffSizeSmall}</Text>
            <Slider
              style={s.slider}
              minimumValue={0.8}
              maximumValue={1.3}
              value={settings.staffSize}
              onSlidingComplete={v => updateSetting('staffSize', v)}
              minimumTrackTintColor={C.primary}
              maximumTrackTintColor={C.border}
              thumbTintColor={C.primary}
            />
            <Text style={s.sliderEdgeLabel}>{t.staffSizeLarge}</Text>
          </View>
        </SettingCard>

        {/* ── System & Practice ─────────────────────────────────── */}
        <SettingCard title={t.sectionSystemPractice} s={s}>
          <SettingRow icon="moon" label={t.darkModeLabel} desc={t.darkModeDesc} s={s} C={C}>
            <Toggle value={settings.darkMode} onChange={v => updateSetting('darkMode', v)} C={C} s={s} />
          </SettingRow>

          <SettingRow icon="clock" label={t.metronomeLabel} desc={t.metronomeDesc} s={s} C={C}>
            <Toggle value={settings.metronomeEnabled} onChange={v => updateSetting('metronomeEnabled', v)} C={C} s={s} />
          </SettingRow>
          {settings.metronomeEnabled && (
            <>
              <SettingRow icon="activity" label={t.metronomeBpmLabel} s={s} C={C} last>
                <Text style={s.rowValue}>{settings.metronomeBpm} BPM</Text>
              </SettingRow>
              <View style={s.sliderRow}>
                <Text style={s.sliderEdgeLabel}>40</Text>
                <Slider
                  style={s.slider}
                  minimumValue={40}
                  maximumValue={200}
                  step={5}
                  value={settings.metronomeBpm}
                  onSlidingComplete={v => updateSetting('metronomeBpm', Math.round(v))}
                  minimumTrackTintColor={C.primary}
                  maximumTrackTintColor={C.border}
                  thumbTintColor={C.primary}
                />
                <Text style={s.sliderEdgeLabel}>200</Text>
              </View>
              <SettingRow icon="volume-2" label={t.metronomeVolumeLabel} s={s} C={C} last>
                <View />
              </SettingRow>
              <View style={s.sliderRow}>
                <Text style={s.sliderEdgeLabel}>{t.sensitivityLow}</Text>
                <Slider
                  style={s.slider}
                  minimumValue={0}
                  maximumValue={1}
                  value={settings.metronomeVolume}
                  onSlidingComplete={v => updateSetting('metronomeVolume', v)}
                  minimumTrackTintColor={C.primary}
                  maximumTrackTintColor={C.border}
                  thumbTintColor={C.primary}
                />
                <Text style={s.sliderEdgeLabel}>{t.sensitivityHigh}</Text>
              </View>
              <SettingRow icon="zap" label={t.metronomeAccentLabel} s={s} C={C}>
                <Toggle value={settings.metronomeAccent} onChange={v => updateSetting('metronomeAccent', v)} C={C} s={s} />
              </SettingRow>
            </>
          )}

          <SettingRow icon="eye-off" label={t.disappearingMeasuresLabel} desc={t.disappearingMeasuresDesc} s={s} C={C} last={settings.disappearingMeasures}>
            <Toggle value={settings.disappearingMeasures} onChange={v => updateSetting('disappearingMeasures', v)} C={C} s={s} />
          </SettingRow>
          {settings.disappearingMeasures && (
            <View style={[s.soundThemeRow, s.rowBorder]}>
              {([
                { value: 'delayed', label: t.dmTimingDelayed },
                { value: 'onEntry', label: t.dmTimingOnEntry },
                { value: 'afterEnd', label: t.dmTimingAfterEnd },
              ] as { value: DisappearingTiming; label: string }[]).map(opt => (
                <TouchableOpacity
                  key={opt.value}
                  style={[s.soundChip, settings.disappearingMeasuresTiming === opt.value && s.soundChipActive]}
                  onPress={() => updateSetting('disappearingMeasuresTiming', opt.value)}
                  activeOpacity={0.8}
                >
                  <Text style={[s.soundChipTxt, settings.disappearingMeasuresTiming === opt.value && s.soundChipTxtActive]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <SettingRow icon="bell" label={t.dailyReminderLabel} desc={t.dailyReminderDesc} s={s} C={C} last={!settings.dailyReminder}>
            <Toggle value={settings.dailyReminder} onChange={v => updateSetting('dailyReminder', v)} C={C} s={s} />
          </SettingRow>

          {settings.dailyReminder && (
            <SettingRow icon="calendar" label={t.reminderTimeLabel} s={s} C={C} last>
              <TouchableOpacity style={s.dropdownBtn} onPress={() => setShowTimePicker(true)} activeOpacity={0.8}>
                <Text style={s.dropdownBtnTxt}>{settings.dailyReminderTime}</Text>
              </TouchableOpacity>
            </SettingRow>
          )}
        </SettingCard>
      </ScrollView>

      {/* Audio input dropdown */}
      <Modal visible={inputDropdownOpen} transparent animationType="fade" onRequestClose={() => setInputDropdownOpen(false)} statusBarTranslucent>
        <Pressable style={StyleSheet.absoluteFill} onPress={() => setInputDropdownOpen(false)} />
        <View style={s.inputPanelWrap} pointerEvents="box-none">
          <View style={s.inputPanel}>
            <InputOption
              label={t.audioInputMic}
              selected={settings.audioInputSource === 'mic'}
              onPress={() => { updateSetting('audioInputSource', 'mic' as AudioInputSource); setInputDropdownOpen(false); }}
              s={s} C={C}
            />
            <InputOption
              label={t.audioInputMidi}
              selected={settings.audioInputSource === 'midi'}
              onPress={() => { updateSetting('audioInputSource', 'midi' as AudioInputSource); setInputDropdownOpen(false); }}
              s={s} C={C}
            />
          </View>
        </View>
      </Modal>

      {/* Reminder time picker */}
      {showTimePicker && (
        <DateTimePicker
          value={reminderDate}
          mode="time"
          is24Hour
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleTimeChange}
        />
      )}
      {showTimePicker && Platform.OS === 'ios' && (
        <TouchableOpacity style={s.iosDoneBtn} onPress={() => setShowTimePicker(false)}>
          <Text style={s.iosDoneTxt}>OK</Text>
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}

// ── Reusable pieces ──────────────────────────────────────────────────

function SettingCard({ title, children, s }: { title: string; children: React.ReactNode; s: Styles }) {
  return (
    <View style={s.cardWrap}>
      <Text style={s.cardTitle}>{title}</Text>
      <View style={s.card}>{children}</View>
    </View>
  );
}

function SettingRow({
  icon, label, desc, children, last, s, C,
}: { icon: FeatherIcon; label: string; desc?: string; children: React.ReactNode; last?: boolean; s: Styles; C: ThemeColors }) {
  return (
    <View style={[s.row, !last && s.rowBorder]}>
      <View style={s.rowIconWrap}>
        <Feather name={icon} size={16} color={C.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={s.rowLabel}>{label}</Text>
        {!!desc && <Text style={s.rowDesc}>{desc}</Text>}
      </View>
      {children}
    </View>
  );
}

function Toggle({ value, onChange, C, s }: { value: boolean; onChange: (v: boolean) => void; C: ThemeColors; s: Styles }) {
  const anim = React.useRef(new Animated.Value(value ? 1 : 0)).current;
  React.useEffect(() => {
    Animated.timing(anim, { toValue: value ? 1 : 0, duration: 160, useNativeDriver: false }).start();
  }, [value]);

  const bg = anim.interpolate({ inputRange: [0, 1], outputRange: [C.border, C.primary] });
  const translateX = anim.interpolate({ inputRange: [0, 1], outputRange: [2, 20] });

  return (
    <TouchableOpacity activeOpacity={0.85} onPress={() => onChange(!value)}>
      <Animated.View style={[s.toggleTrack, { backgroundColor: bg }]}>
        <Animated.View style={[s.toggleThumb, { transform: [{ translateX }] }]} />
      </Animated.View>
    </TouchableOpacity>
  );
}

function Segmented<T extends string>({
  value, options, onChange, s,
}: { value: T; options: { value: T; label: string }[]; onChange: (v: T) => void; s: Styles }) {
  return (
    <View style={s.segmented}>
      {options.map(opt => (
        <TouchableOpacity
          key={opt.value}
          style={[s.segment, value === opt.value && s.segmentActive]}
          onPress={() => onChange(opt.value)}
          activeOpacity={0.8}
        >
          <Text style={[s.segmentTxt, value === opt.value && s.segmentTxtActive]}>{opt.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

function InputOption({
  label, selected, disabled, badge, onPress, s, C,
}: { label: string; selected: boolean; disabled?: boolean; badge?: string; onPress: () => void; s: Styles; C: ThemeColors }) {
  return (
    <TouchableOpacity
      style={[s.inputOption, selected && s.inputOptionActive]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.75}
    >
      <Text style={[s.inputOptionTxt, selected && s.inputOptionTxtActive, disabled && s.inputOptionTxtDisabled]}>
        {label}
      </Text>
      {badge ? <Text style={s.inputBadge}>{badge}</Text> : selected ? <Feather name="check" size={15} color={C.primary} /> : null}
    </TouchableOpacity>
  );
}

// ── Style tokens (matches HomeScreen) ────────────────────────────────

const cardShadow = {
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 6 },
  shadowOpacity: 0.1,
  shadowRadius: 16,
  elevation: 3,
};

function makeStyles(C: ThemeColors) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: C.bg },
    container: { padding: 24, paddingBottom: 48 },
    title: { fontFamily: 'Heebo_800ExtraBold', fontSize: 26, color: C.text, marginBottom: 20 },

    cardWrap: { marginBottom: 22 },
    cardTitle: { fontFamily: 'Heebo_700Bold', fontSize: 13, color: C.muted, letterSpacing: 0.2, marginBottom: 10, marginStart: 4 },
    card: { backgroundColor: C.card, borderRadius: 20, paddingHorizontal: 16, ...cardShadow },

    row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14 },
    rowBorder: { borderBottomWidth: 1, borderBottomColor: C.border },
    rowIconWrap: { width: 32, height: 32, borderRadius: 16, backgroundColor: C.primaryTint, alignItems: 'center', justifyContent: 'center' },
    rowLabel: { fontFamily: 'Heebo_600SemiBold', fontSize: 14, color: C.text },
    rowDesc: { fontFamily: 'Heebo_400Regular', fontSize: 11.5, color: C.muted, marginTop: 2 },
    rowValue: { fontFamily: 'Heebo_700Bold', fontSize: 13, color: C.text },

    sliderRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: C.border, marginTop: -6 },
    lastSliderRow: { borderBottomWidth: 0 },
    slider: { flex: 1, height: 32 },
    sliderEdgeLabel: { fontFamily: 'Heebo_500Medium', fontSize: 10.5, color: C.muted, width: 34, textAlign: 'center' },

    soundThemeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingBottom: 16 },
    soundChip: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 999, backgroundColor: C.chipBg },
    soundChipActive: { backgroundColor: C.primary },
    soundChipTxt: { fontFamily: 'Heebo_600SemiBold', fontSize: 12.5, color: C.text },
    soundChipTxtActive: { color: '#fff' },

    toggleTrack: { width: 44, height: 26, borderRadius: 13, padding: 2, justifyContent: 'center' },
    toggleThumb: { width: 22, height: 22, borderRadius: 11, backgroundColor: '#fff' },

    segmented: { flexDirection: 'row', backgroundColor: C.chipBg, borderRadius: 999, padding: 3, gap: 2 },
    segment: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999 },
    segmentActive: { backgroundColor: C.primary },
    segmentTxt: { fontFamily: 'Heebo_600SemiBold', fontSize: 12, color: C.muted },
    segmentTxtActive: { color: '#fff' },

    dropdownBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: C.chipBg, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8 },
    dropdownBtnTxt: { fontFamily: 'Heebo_600SemiBold', fontSize: 12.5, color: C.text },

    inputPanelWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
    inputPanel: { width: '100%', maxWidth: 320, backgroundColor: C.card, borderRadius: 18, padding: 8, ...cardShadow },
    inputOption: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 13, paddingHorizontal: 14, borderRadius: 12 },
    inputOptionActive: { backgroundColor: C.primaryTint },
    inputOptionTxt: { fontFamily: 'Heebo_500Medium', fontSize: 14, color: C.text },
    inputOptionTxtActive: { fontFamily: 'Heebo_700Bold', color: C.primary },
    inputOptionTxtDisabled: { color: C.muted },
    inputBadge: { fontFamily: 'Heebo_500Medium', fontSize: 11, color: C.muted, backgroundColor: C.chipBg, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },

    iosDoneBtn: { alignSelf: 'center', marginBottom: 12, paddingHorizontal: 24, paddingVertical: 10, backgroundColor: C.primary, borderRadius: 999 },
    iosDoneTxt: { fontFamily: 'Heebo_700Bold', color: '#fff', fontSize: 14 },
  });
}
