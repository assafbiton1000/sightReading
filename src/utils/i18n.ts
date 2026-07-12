export type Lang = 'he' | 'en' | 'es' | 'fr' | 'de' | 'ru' | 'ar' | 'pt' | 'it';

export const LANGUAGE_META: Record<Lang, { name: string; rtl: boolean }> = {
  he: { name: 'עברית',    rtl: true  },
  en: { name: 'English',  rtl: false },
  es: { name: 'Español',  rtl: false },
  fr: { name: 'Français', rtl: false },
  de: { name: 'Deutsch',  rtl: false },
  ru: { name: 'Русский',  rtl: false },
  ar: { name: 'العربية',  rtl: true  },
  pt: { name: 'Português',rtl: false },
  it: { name: 'Italiano', rtl: false },
};

export interface T {
  // common
  back: string;
  yes: string;
  no: string;
  upTo: string;
  sharpsFlats: string;

  // home
  appTitle: string;
  appSubtitle: string;
  chooseMode: string;
  chooseLevel: string;
  chooseClef: string;
  noteCount: string;
  playOrder: string;
  tempo: string;
  chords: string;
  maxKeys: string;
  startBtn: string;
  openSearch: string;
  learningBtn: string;
  audioTestBtn: string;

  // modes
  modeSRTitle: string;
  modeSRDesc: string;
  modeListenTitle: string;
  modeListenDesc: string;
  modeSearchTitle: string;
  modeSearchDesc: string;

  // clef
  clefTreble: string;
  clefBass: string;
  clefBoth: string;

  // both-mode
  seqLabel: string;
  seqDesc: string;
  simLabel: string;
  simDesc: string;

  // practice
  correctLabel: string;
  wrongLabel: string;
  noteProgress: string; // use {n} and {total} placeholders
  tryAgain: string;
  newExercise: string;
  stop: string;

  // playback
  playBtn: string;
  stopBtn: string;
  newNotes: string;
  listenLabel: string;

  // result
  msgExcellent: string;
  msgGreat: string;
  msgKeepGoing: string;
  msgNotBad: string;
  pctCorrect: string; // "{pct}% correct"
  levelLabel: string;
  notesLabel: string;
  tryAgainSame: string;
  backToMenu: string;

  // learning
  learningTitle: string;
  notesCount: string;
  streakLabel: string;
  listeningLabel: string;
  waitingLabel: string;
  correctExclaim: string;
  learningHint: string;
  skipBtn: string;

  // note names C D E F G A B
  noteC: string;
  noteD: string;
  noteE: string;
  noteF: string;
  noteG: string;
  noteA: string;
  noteB: string;

  // audio test
  audioTestTitle: string;
  notesDetected: string;
  micSignal: string;
  waitingSound: string;
  micActiveLabel: string;
  micErrorLabel: string;
  calibrateBtn: string;
  calibratingLabel: string;
  calibratedLabel: string;
  calibrateHint: string;
  playNoteHint: string;

  // level names (index 0..7 matches LEVELS in constants/levels.ts)
  levelNames: string[];

  // drawer navigation
  drawerHome: string;
  drawerSettings: string;
  drawerStats: string;
  drawerTrainingModes: string;
  drawerLearning: string;
  drawerHelp: string;
  drawerAbout: string;
  drawerProfile: string;
  drawerLogout: string;

  // settings screen
  settingsTitle: string;
  sectionAudioInput: string;
  sectionMusicDisplay: string;
  sectionSystemPractice: string;
  audioInputLabel: string;
  audioInputMic: string;
  audioInputMidi: string;
  audioInputMidiSoon: string;
  micSensitivityLabel: string;
  sensitivityLow: string;
  sensitivityHigh: string;
  audioFeedbackLabel: string;
  audioFeedbackDesc: string;
  noteNamingLabel: string;
  noteNamingLetters: string;
  noteNamingSolfege: string;
  colorfulNotesLabel: string;
  colorfulNotesDesc: string;
  staffSizeLabel: string;
  staffSizeSmall: string;
  staffSizeLarge: string;
  darkModeLabel: string;
  darkModeDesc: string;
  pianoSoundLabel: string;
  countInLabel: string;
  countInDesc: string;
  liveErrorFeedbackLabel: string;
  liveErrorFeedbackDesc: string;
  dailyReminderLabel: string;
  dailyReminderDesc: string;
  reminderTimeLabel: string;
  dailyReminderNotifTitle: string;
  dailyReminderNotifBody: string;
  notifPermissionDeniedMsg: string;

  // song library
  songLibraryTitle: string;
  searchSongsPlaceholder: string;
  noSongsFound: string;
  levelBadge: string;

  // statistics
  statisticsTitle: string;
  dayStreakLabel: string;
  daysUnit: string;
  practiceTimeLabel: string;
  todayLabel: string;
  thisWeekLabel: string;
  minutesUnit: string;
  avgAccuracyLabel: string;
  totalSessionsLabel: string;
  noStatsYet: string;
  streakGrewMsg: string; // "{days}" placeholder
  yourAccuracyLabel: string;
  overallAvgLabel: string;
}

const translations: Record<Lang, T> = {
  he: {
    back: '← חזרה',
    yes: 'כן',
    no: 'לא',
    upTo: 'עד',
    sharpsFlats: 'בכ״מ',

    appTitle: 'קריאת תווים',
    appSubtitle: 'פסנתר · Sight Reading',
    chooseMode: 'בחר מצב',
    chooseLevel: 'בחר רמה',
    chooseClef: 'מפתח',
    noteCount: 'מספר תווים',
    playOrder: 'סדר נגינה',
    tempo: 'קצב',
    chords: 'אקורדים',
    maxKeys: 'מקשים',
    startBtn: 'התחל',
    openSearch: 'פתח ספרייה',
    learningBtn: '🎓 למידה',
    audioTestBtn: '🎤 בדיקת שמע',

    modeSRTitle: 'Sight Reading',
    modeSRDesc: 'נגן תווים אקראיים — בדיקה בזמן אמת',
    modeListenTitle: 'האזנה חופשית',
    modeListenDesc: 'הצג תווים ושמע אותם — ללא בדיקה',
    modeSearchTitle: 'ספריית שירים',
    modeSearchDesc: 'תרגל שירים קלאסיים ועממיים מוכרים',

    clefTreble: 'מפתח סול',
    clefBass: 'מפתח פה',
    clefBoth: 'שניהם',

    seqLabel: 'ימין ← שמאל',
    seqDesc: 'כל יד ימין, אחר כך שמאל',
    simLabel: 'שניהם ביחד',
    simDesc: 'זוגות — שתי הידיים בו זמנית',

    correctLabel: 'נכון',
    wrongLabel: 'שגוי',
    noteProgress: 'תו {n} / {total}',
    tryAgain: 'נסה שוב',
    newExercise: 'תרגיל חדש',
    stop: 'עצור',

    playBtn: '▶ נגן',
    stopBtn: '⏹ עצור',
    newNotes: 'תווים חדשים',
    listenLabel: 'האזנה',

    msgExcellent: 'מעולה!',
    msgGreat: 'כל הכבוד!',
    msgKeepGoing: 'המשך להתאמן',
    msgNotBad: 'לא נורא, נסה שוב',
    pctCorrect: '{pct}% נכון',
    levelLabel: 'רמה',
    notesLabel: 'תווים',
    tryAgainSame: 'נסה שוב — אותה רמה',
    backToMenu: 'חזרה לתפריט',

    learningTitle: 'למידה',
    notesCount: 'תווים',
    streakLabel: 'ברצף',
    listeningLabel: '🎤 מאזין...',
    waitingLabel: '🎤 מחכה...',
    correctExclaim: '✓ נכון!',
    learningHint: 'נגן את התו על הפסנתר — כשתנגן נכון התו יתחלף אוטומטית',
    skipBtn: 'דלג →',

    noteC: 'דו', noteD: 'רה', noteE: 'מי',
    noteF: 'פה', noteG: 'סול', noteA: 'לה', noteB: 'סי',

    audioTestTitle: 'בדיקת שמע',
    notesDetected: 'תווים זוהו',
    micSignal: 'אות מיקרופון',
    waitingSound: 'ממתין לצליל...',
    micActiveLabel: 'מיקרופון פעיל',
    micErrorLabel: 'שגיאת מיקרופון',
    calibrateBtn: '🎹 כייל קול לפי הפסנתר שלך',
    calibratingLabel: '⏳ מאזין לפסנתר...',
    calibratedLabel: '✓ קול כויל',
    calibrateHint: 'נגן תו ואחזק אותו 2-3 שניות',
    playNoteHint: 'נגן את התו הכחול על הפסנתר. כשתנגן נכון הוא יתחלף לתו חדש.',

    levelNames: ['מתחיל מוחלט', 'מתחיל', 'בסיסי', 'בסיסי+', 'בינוני', 'בינוני+', 'מתקדם', 'מומחה'],

    drawerHome: 'מסך בית',
    drawerSettings: 'הגדרות',
    drawerStats: 'סטטיסטיקה',
    drawerTrainingModes: 'מצבי אימון',
    drawerLearning: 'למידה',
    drawerHelp: 'עזרה ותמיכה',
    drawerAbout: 'אודות',
    drawerProfile: 'פרופיל',
    drawerLogout: 'התנתקות',

    settingsTitle: 'הגדרות',
    sectionAudioInput: 'הגדרות שמע וקלט',
    sectionMusicDisplay: 'הגדרות תצוגה מוזיקלית',
    sectionSystemPractice: 'מערכת ותרגול',
    audioInputLabel: 'בחירת קלט',
    audioInputMic: 'מיקרופון מובנה',
    audioInputMidi: 'מקלדת MIDI',
    audioInputMidiSoon: 'בקרוב',
    micSensitivityLabel: 'רגישות מיקרופון',
    sensitivityLow: 'נמוכה',
    sensitivityHigh: 'גבוהה',
    audioFeedbackLabel: 'פידבק קולי בנגינה',
    audioFeedbackDesc: 'השמעת צליל פסנתר כשמזוהה תו נכון',
    noteNamingLabel: 'שמות התווים',
    noteNamingLetters: 'אותיות (C D E)',
    noteNamingSolfege: 'סולפז׳ (דו רה מי)',
    colorfulNotesLabel: 'תווים צבעוניים',
    colorfulNotesDesc: 'צביעת כל תו בצבע לפי הצליל — מומלץ למתחילים',
    staffSizeLabel: 'גודל תצוגת חמשה',
    staffSizeSmall: 'קטן',
    staffSizeLarge: 'גדול',
    darkModeLabel: 'מצב כהה',
    darkModeDesc: 'עיצוב כהה לכל האפליקציה — נוח יותר לעיניים בתאורה חלשה',
    pianoSoundLabel: 'שינוי קול פסנתר',
    countInLabel: 'ספירה לאחור לפני תרגול',
    countInDesc: '4 פעימות מטרונום לפני תחילת התרגיל',
    liveErrorFeedbackLabel: 'הצגת שגיאות בזמן אמת',
    liveErrorFeedbackDesc: 'תגובה מיידית לכל תו, במקום רק בסיום התרגול',
    dailyReminderLabel: 'תזכורת אימון יומית',
    dailyReminderDesc: 'התראה יומית בשעה שתבחר/י, כדי לא לפספס יום תרגול',
    reminderTimeLabel: 'שעת תזכורת',
    dailyReminderNotifTitle: 'זמן לתרגל! 🎹',
    dailyReminderNotifBody: 'כמה דקות של קריאת תווים ישמרו על הכישרון שלך חד',
    notifPermissionDeniedMsg: 'לא ניתנה הרשאת התראות — התזכורת לא תישלח. אפשר לאשר בהגדרות המכשיר.',

    songLibraryTitle: 'ספריית שירים',
    searchSongsPlaceholder: 'חפש שיר...',
    noSongsFound: 'לא נמצאו שירים',
    levelBadge: 'רמה',

    statisticsTitle: 'סטטיסטיקה',
    dayStreakLabel: 'ימי אימון ברצף',
    daysUnit: 'ימים',
    practiceTimeLabel: 'זמן תרגול',
    todayLabel: 'היום',
    thisWeekLabel: 'השבוע',
    minutesUnit: 'דק׳',
    avgAccuracyLabel: 'דיוק ממוצע',
    totalSessionsLabel: 'סה״כ תרגולים',
    noStatsYet: 'עוד לא תרגלת — תתחיל/י כדי לראות כאן נתונים',
    streakGrewMsg: 'הרצף שלך גדל ל-{days} ימים! 🔥',
    yourAccuracyLabel: 'הדיוק שלך',
    overallAvgLabel: 'ממוצע כללי',
  },

  en: {
    back: '← Back',
    yes: 'Yes',
    no: 'No',
    upTo: 'Up to',
    sharpsFlats: 'sharps/flats',

    appTitle: 'Note Reading',
    appSubtitle: 'Piano · Sight Reading',
    chooseMode: 'Choose mode',
    chooseLevel: 'Choose level',
    chooseClef: 'Clef',
    noteCount: 'Note count',
    playOrder: 'Play order',
    tempo: 'Tempo',
    chords: 'Chords',
    maxKeys: 'Keys',
    startBtn: 'Start',
    openSearch: 'Open library',
    learningBtn: '🎓 Learning',
    audioTestBtn: '🎤 Audio test',

    modeSRTitle: 'Sight Reading',
    modeSRDesc: 'Play random notes — real-time feedback',
    modeListenTitle: 'Free Listening',
    modeListenDesc: 'View notes and hear them — no check',
    modeSearchTitle: 'Song Library',
    modeSearchDesc: 'Practice well-known classical and folk songs',

    clefTreble: 'Treble clef',
    clefBass: 'Bass clef',
    clefBoth: 'Both',

    seqLabel: 'Right → Left',
    seqDesc: 'Right hand first, then left',
    simLabel: 'Both together',
    simDesc: 'Pairs — both hands simultaneously',

    correctLabel: 'Correct',
    wrongLabel: 'Wrong',
    noteProgress: 'Note {n} / {total}',
    tryAgain: 'Try again',
    newExercise: 'New exercise',
    stop: 'Stop',

    playBtn: '▶ Play',
    stopBtn: '⏹ Stop',
    newNotes: 'New notes',
    listenLabel: 'Listen',

    msgExcellent: 'Excellent!',
    msgGreat: 'Great job!',
    msgKeepGoing: 'Keep practicing',
    msgNotBad: 'Not bad, try again',
    pctCorrect: '{pct}% correct',
    levelLabel: 'Level',
    notesLabel: 'Notes',
    tryAgainSame: 'Try again — same level',
    backToMenu: 'Back to menu',

    learningTitle: 'Learning',
    notesCount: 'Notes',
    streakLabel: 'Streak',
    listeningLabel: '🎤 Listening...',
    waitingLabel: '🎤 Waiting...',
    correctExclaim: '✓ Correct!',
    learningHint: 'Play the note on the piano — when correct it will change automatically',
    skipBtn: 'Skip →',

    noteC: 'C', noteD: 'D', noteE: 'E',
    noteF: 'F', noteG: 'G', noteA: 'A', noteB: 'B',

    audioTestTitle: 'Audio Test',
    notesDetected: 'Notes detected',
    micSignal: 'Microphone signal',
    waitingSound: 'Waiting for sound...',
    micActiveLabel: 'Microphone active',
    micErrorLabel: 'Microphone error',
    calibrateBtn: '🎹 Calibrate sound to your piano',
    calibratingLabel: '⏳ Listening to piano...',
    calibratedLabel: '✓ Sound calibrated',
    calibrateHint: 'Play a note and hold it for 2-3 seconds',
    playNoteHint: 'Play the blue note on the piano. When correct it will change.',

    levelNames: ['Absolute Beginner', 'Beginner', 'Elementary', 'Elementary+', 'Intermediate', 'Intermediate+', 'Advanced', 'Expert'],

    drawerHome: 'Home',
    drawerSettings: 'Settings',
    drawerStats: 'Statistics',
    drawerTrainingModes: 'Training Modes',
    drawerLearning: 'Learning',
    drawerHelp: 'Help & Support',
    drawerAbout: 'About',
    drawerProfile: 'Profile',
    drawerLogout: 'Log Out',

    settingsTitle: 'Settings',
    sectionAudioInput: 'Audio & Input',
    sectionMusicDisplay: 'Musical Display',
    sectionSystemPractice: 'System & Practice',
    audioInputLabel: 'Input Source',
    audioInputMic: 'Built-in Microphone',
    audioInputMidi: 'MIDI Keyboard',
    audioInputMidiSoon: 'coming soon',
    micSensitivityLabel: 'Microphone Sensitivity',
    sensitivityLow: 'Low',
    sensitivityHigh: 'High',
    audioFeedbackLabel: 'Audio Feedback',
    audioFeedbackDesc: 'Play a piano sound when a correct note is detected',
    noteNamingLabel: 'Note Naming',
    noteNamingLetters: 'Letters (C D E)',
    noteNamingSolfege: 'Solfège (Do Re Mi)',
    colorfulNotesLabel: 'Colorful Notes',
    colorfulNotesDesc: 'Color each note by pitch — great for beginners',
    staffSizeLabel: 'Staff Size',
    staffSizeSmall: 'Small',
    staffSizeLarge: 'Large',
    darkModeLabel: 'Dark Mode',
    darkModeDesc: 'Dark theme across the whole app — easier on the eyes in low light',
    pianoSoundLabel: 'Piano Sound',
    countInLabel: 'Count-in Before Practice',
    countInDesc: '4 metronome beats before the exercise starts',
    liveErrorFeedbackLabel: 'Real-time Error Feedback',
    liveErrorFeedbackDesc: 'Instant response per note, instead of only at the end',
    dailyReminderLabel: 'Daily Practice Reminder',
    dailyReminderDesc: 'A daily notification at your chosen time, so you never miss a practice day',
    reminderTimeLabel: 'Reminder Time',
    dailyReminderNotifTitle: 'Time to practice! 🎹',
    dailyReminderNotifBody: 'A few minutes of sight reading will keep your skills sharp',
    notifPermissionDeniedMsg: 'Notification permission was not granted — the reminder won\'t be sent. You can allow it in your device settings.',

    songLibraryTitle: 'Song Library',
    searchSongsPlaceholder: 'Search songs...',
    noSongsFound: 'No songs found',
    levelBadge: 'Level',

    statisticsTitle: 'Statistics',
    dayStreakLabel: 'Day Streak',
    daysUnit: 'days',
    practiceTimeLabel: 'Practice Time',
    todayLabel: 'Today',
    thisWeekLabel: 'This Week',
    minutesUnit: 'min',
    avgAccuracyLabel: 'Average Accuracy',
    totalSessionsLabel: 'Total Sessions',
    noStatsYet: "You haven't practiced yet — start a session to see your stats here",
    streakGrewMsg: 'Your streak grew to {days} days! 🔥',
    yourAccuracyLabel: 'Your accuracy',
    overallAvgLabel: 'Overall average',
  },

  es: {
    back: '← Volver',
    yes: 'Sí',
    no: 'No',
    upTo: 'Hasta',
    sharpsFlats: 'sostenidos/bemoles',

    appTitle: 'Lectura de Notas',
    appSubtitle: 'Piano · Sight Reading',
    chooseMode: 'Elige el modo',
    chooseLevel: 'Elige el nivel',
    chooseClef: 'Clave',
    noteCount: 'Número de notas',
    playOrder: 'Orden de ejecución',
    tempo: 'Tempo',
    chords: 'Acordes',
    maxKeys: 'Tonalidad',
    startBtn: 'Comenzar',
    openSearch: 'Abrir biblioteca',
    learningBtn: '🎓 Aprendizaje',
    audioTestBtn: '🎤 Prueba de audio',

    modeSRTitle: 'Sight Reading',
    modeSRDesc: 'Toca notas al azar — evaluación en tiempo real',
    modeListenTitle: 'Escucha libre',
    modeListenDesc: 'Ver notas y escucharlas — sin evaluación',
    modeSearchTitle: 'Biblioteca de canciones',
    modeSearchDesc: 'Practica canciones clásicas y populares conocidas',

    clefTreble: 'Clave de sol',
    clefBass: 'Clave de fa',
    clefBoth: 'Ambos',

    seqLabel: 'Derecha → Izquierda',
    seqDesc: 'Mano derecha primero, luego izquierda',
    simLabel: 'Ambas a la vez',
    simDesc: 'Pares — ambas manos simultáneamente',

    correctLabel: 'Correcto',
    wrongLabel: 'Incorrecto',
    noteProgress: 'Nota {n} / {total}',
    tryAgain: 'Intentar de nuevo',
    newExercise: 'Nuevo ejercicio',
    stop: 'Detener',

    playBtn: '▶ Reproducir',
    stopBtn: '⏹ Detener',
    newNotes: 'Nuevas notas',
    listenLabel: 'Escuchar',

    msgExcellent: '¡Excelente!',
    msgGreat: '¡Muy bien!',
    msgKeepGoing: 'Sigue practicando',
    msgNotBad: 'No está mal, inténtalo',
    pctCorrect: '{pct}% correcto',
    levelLabel: 'Nivel',
    notesLabel: 'Notas',
    tryAgainSame: 'Intentar — mismo nivel',
    backToMenu: 'Volver al menú',

    learningTitle: 'Aprendizaje',
    notesCount: 'Notas',
    streakLabel: 'Racha',
    listeningLabel: '🎤 Escuchando...',
    waitingLabel: '🎤 Esperando...',
    correctExclaim: '✓ ¡Correcto!',
    learningHint: 'Toca la nota en el piano — cuando sea correcta cambiará automáticamente',
    skipBtn: 'Omitir →',

    noteC: 'Do', noteD: 'Re', noteE: 'Mi',
    noteF: 'Fa', noteG: 'Sol', noteA: 'La', noteB: 'Si',

    audioTestTitle: 'Prueba de audio',
    notesDetected: 'Notas detectadas',
    micSignal: 'Señal del micrófono',
    waitingSound: 'Esperando sonido...',
    micActiveLabel: 'Micrófono activo',
    micErrorLabel: 'Error de micrófono',
    calibrateBtn: '🎹 Calibrar sonido a tu piano',
    calibratingLabel: '⏳ Escuchando el piano...',
    calibratedLabel: '✓ Sonido calibrado',
    calibrateHint: 'Toca una nota y mantenla 2-3 segundos',
    playNoteHint: 'Toca la nota azul en el piano. Cuando sea correcta cambiará.',

    levelNames: ['Principiante absoluto', 'Principiante', 'Elemental', 'Elemental+', 'Intermedio', 'Intermedio+', 'Avanzado', 'Experto'],

    drawerHome: 'Inicio',
    drawerSettings: 'Ajustes',
    drawerStats: 'Estadísticas',
    drawerTrainingModes: 'Modos de práctica',
    drawerLearning: 'Aprendizaje',
    drawerHelp: 'Ayuda y soporte',
    drawerAbout: 'Acerca de',
    drawerProfile: 'Perfil',
    drawerLogout: 'Cerrar sesión',

    settingsTitle: 'Ajustes',
    sectionAudioInput: 'Audio y entrada',
    sectionMusicDisplay: 'Visualización musical',
    sectionSystemPractice: 'Sistema y práctica',
    audioInputLabel: 'Fuente de entrada',
    audioInputMic: 'Micrófono integrado',
    audioInputMidi: 'Teclado MIDI',
    audioInputMidiSoon: 'próximamente',
    micSensitivityLabel: 'Sensibilidad del micrófono',
    sensitivityLow: 'Baja',
    sensitivityHigh: 'Alta',
    audioFeedbackLabel: 'Retroalimentación sonora',
    audioFeedbackDesc: 'Reproduce un sonido de piano al detectar una nota correcta',
    noteNamingLabel: 'Nombres de las notas',
    noteNamingLetters: 'Letras (C D E)',
    noteNamingSolfege: 'Solfeo (Do Re Mi)',
    colorfulNotesLabel: 'Notas de colores',
    colorfulNotesDesc: 'Colorea cada nota según su tono — ideal para principiantes',
    staffSizeLabel: 'Tamaño del pentagrama',
    staffSizeSmall: 'Pequeño',
    staffSizeLarge: 'Grande',
    darkModeLabel: 'Modo oscuro',
    darkModeDesc: 'Tema oscuro en toda la app — más cómodo para los ojos con poca luz',
    pianoSoundLabel: 'Sonido del piano',
    countInLabel: 'Cuenta atrás antes de practicar',
    countInDesc: '4 pulsos de metrónomo antes de empezar el ejercicio',
    liveErrorFeedbackLabel: 'Errores en tiempo real',
    liveErrorFeedbackDesc: 'Respuesta inmediata por nota, en vez de solo al final',
    dailyReminderLabel: 'Recordatorio de práctica diaria',
    dailyReminderDesc: 'Una notificación diaria a la hora que elijas, para no perderte ningún día de práctica',
    reminderTimeLabel: 'Hora del recordatorio',
    dailyReminderNotifTitle: '¡Hora de practicar! 🎹',
    dailyReminderNotifBody: 'Unos minutos de lectura a primera vista mantendrán tu habilidad afilada',
    notifPermissionDeniedMsg: 'No se concedió permiso de notificaciones — el recordatorio no se enviará. Puedes permitirlo en los ajustes del dispositivo.',

    songLibraryTitle: 'Biblioteca de canciones',
    searchSongsPlaceholder: 'Buscar canciones...',
    noSongsFound: 'No se encontraron canciones',
    levelBadge: 'Nivel',

    statisticsTitle: 'Estadísticas',
    dayStreakLabel: 'Racha de días',
    daysUnit: 'días',
    practiceTimeLabel: 'Tiempo de práctica',
    todayLabel: 'Hoy',
    thisWeekLabel: 'Esta semana',
    minutesUnit: 'min',
    avgAccuracyLabel: 'Precisión media',
    totalSessionsLabel: 'Sesiones totales',
    noStatsYet: 'Todavía no has practicado — empieza una sesión para ver tus estadísticas aquí',
    streakGrewMsg: '¡Tu racha creció a {days} días! 🔥',
    yourAccuracyLabel: 'Tu precisión',
    overallAvgLabel: 'Promedio general',
  },

  fr: {
    back: '← Retour',
    yes: 'Oui',
    no: 'Non',
    upTo: "Jusqu'à",
    sharpsFlats: 'dièses/bémols',

    appTitle: 'Lecture de Notes',
    appSubtitle: 'Piano · Sight Reading',
    chooseMode: 'Choisir le mode',
    chooseLevel: 'Choisir le niveau',
    chooseClef: 'Clé',
    noteCount: 'Nombre de notes',
    playOrder: "Ordre d'exécution",
    tempo: 'Tempo',
    chords: 'Accords',
    maxKeys: 'Tonalité',
    startBtn: 'Commencer',
    openSearch: 'Ouvrir la bibliothèque',
    learningBtn: '🎓 Apprentissage',
    audioTestBtn: '🎤 Test audio',

    modeSRTitle: 'Sight Reading',
    modeSRDesc: 'Jouer des notes aléatoires — évaluation en temps réel',
    modeListenTitle: 'Écoute libre',
    modeListenDesc: 'Voir les notes et les écouter — sans évaluation',
    modeSearchTitle: 'Bibliothèque de chansons',
    modeSearchDesc: 'Pratiquez des chansons classiques et populaires connues',

    clefTreble: 'Clef de sol',
    clefBass: 'Clef de fa',
    clefBoth: 'Les deux',

    seqLabel: 'Droite → Gauche',
    seqDesc: 'Main droite d\'abord, puis gauche',
    simLabel: 'Les deux ensemble',
    simDesc: 'Paires — les deux mains simultanément',

    correctLabel: 'Correct',
    wrongLabel: 'Incorrect',
    noteProgress: 'Note {n} / {total}',
    tryAgain: 'Réessayer',
    newExercise: 'Nouvel exercice',
    stop: 'Arrêter',

    playBtn: '▶ Jouer',
    stopBtn: '⏹ Arrêter',
    newNotes: 'Nouvelles notes',
    listenLabel: 'Écouter',

    msgExcellent: 'Excellent!',
    msgGreat: 'Très bien!',
    msgKeepGoing: 'Continue à pratiquer',
    msgNotBad: 'Pas mal, réessaie',
    pctCorrect: '{pct}% correct',
    levelLabel: 'Niveau',
    notesLabel: 'Notes',
    tryAgainSame: 'Réessayer — même niveau',
    backToMenu: 'Retour au menu',

    learningTitle: 'Apprentissage',
    notesCount: 'Notes',
    streakLabel: 'Série',
    listeningLabel: '🎤 Écoute...',
    waitingLabel: '🎤 En attente...',
    correctExclaim: '✓ Correct!',
    learningHint: 'Joue la note sur le piano — quand elle est correcte elle changera automatiquement',
    skipBtn: 'Passer →',

    noteC: 'Do', noteD: 'Ré', noteE: 'Mi',
    noteF: 'Fa', noteG: 'Sol', noteA: 'La', noteB: 'Si',

    audioTestTitle: 'Test audio',
    notesDetected: 'Notes détectées',
    micSignal: 'Signal du microphone',
    waitingSound: 'En attente de son...',
    micActiveLabel: 'Microphone actif',
    micErrorLabel: 'Erreur de microphone',
    calibrateBtn: '🎹 Calibrer le son à votre piano',
    calibratingLabel: '⏳ Écoute du piano...',
    calibratedLabel: '✓ Son calibré',
    calibrateHint: 'Jouez une note et maintenez-la 2-3 secondes',
    playNoteHint: 'Jouez la note bleue sur le piano. Quand elle est correcte elle changera.',

    levelNames: ['Débutant absolu', 'Débutant', 'Élémentaire', 'Élémentaire+', 'Intermédiaire', 'Intermédiaire+', 'Avancé', 'Expert'],

    drawerHome: 'Accueil',
    drawerSettings: 'Paramètres',
    drawerStats: 'Statistiques',
    drawerTrainingModes: "Modes d'entraînement",
    drawerLearning: 'Apprentissage',
    drawerHelp: 'Aide et support',
    drawerAbout: 'À propos',
    drawerProfile: 'Profil',
    drawerLogout: 'Déconnexion',

    settingsTitle: 'Paramètres',
    sectionAudioInput: 'Audio et entrée',
    sectionMusicDisplay: 'Affichage musical',
    sectionSystemPractice: 'Système et entraînement',
    audioInputLabel: "Source d'entrée",
    audioInputMic: 'Microphone intégré',
    audioInputMidi: 'Clavier MIDI',
    audioInputMidiSoon: 'bientôt disponible',
    micSensitivityLabel: 'Sensibilité du microphone',
    sensitivityLow: 'Basse',
    sensitivityHigh: 'Haute',
    audioFeedbackLabel: 'Retour sonore',
    audioFeedbackDesc: "Jouer un son de piano quand une note correcte est détectée",
    noteNamingLabel: 'Noms des notes',
    noteNamingLetters: 'Lettres (C D E)',
    noteNamingSolfege: 'Solfège (Do Ré Mi)',
    colorfulNotesLabel: 'Notes colorées',
    colorfulNotesDesc: 'Colorer chaque note selon sa hauteur — idéal pour les débutants',
    staffSizeLabel: 'Taille de la portée',
    staffSizeSmall: 'Petite',
    staffSizeLarge: 'Grande',
    darkModeLabel: 'Mode sombre',
    darkModeDesc: "Thème sombre sur toute l'application — plus reposant pour les yeux en faible luminosité",
    pianoSoundLabel: 'Son du piano',
    countInLabel: "Décompte avant l'entraînement",
    countInDesc: "4 temps de métronome avant le début de l'exercice",
    liveErrorFeedbackLabel: 'Erreurs en temps réel',
    liveErrorFeedbackDesc: 'Réponse immédiate par note, au lieu de seulement à la fin',
    dailyReminderLabel: "Rappel d'entraînement quotidien",
    dailyReminderDesc: "Une notification quotidienne à l'heure choisie, pour ne jamais manquer un jour d'entraînement",
    reminderTimeLabel: 'Heure du rappel',
    dailyReminderNotifTitle: "C'est l'heure de pratiquer ! 🎹",
    dailyReminderNotifBody: 'Quelques minutes de déchiffrage garderont votre niveau affûté',
    notifPermissionDeniedMsg: "La permission de notification n'a pas été accordée — le rappel ne sera pas envoyé. Vous pouvez l'autoriser dans les paramètres de l'appareil.",

    songLibraryTitle: 'Bibliothèque de chansons',
    searchSongsPlaceholder: 'Rechercher des chansons...',
    noSongsFound: 'Aucune chanson trouvée',
    levelBadge: 'Niveau',

    statisticsTitle: 'Statistiques',
    dayStreakLabel: 'Série de jours',
    daysUnit: 'jours',
    practiceTimeLabel: "Temps d'entraînement",
    todayLabel: "Aujourd'hui",
    thisWeekLabel: 'Cette semaine',
    minutesUnit: 'min',
    avgAccuracyLabel: 'Précision moyenne',
    totalSessionsLabel: 'Sessions totales',
    noStatsYet: "Vous n'avez pas encore pratiqué — commencez une session pour voir vos statistiques ici",
    streakGrewMsg: 'Votre série est passée à {days} jours ! 🔥',
    yourAccuracyLabel: 'Votre précision',
    overallAvgLabel: 'Moyenne générale',
  },

  de: {
    back: '← Zurück',
    yes: 'Ja',
    no: 'Nein',
    upTo: 'Bis zu',
    sharpsFlats: 'Vorzeichen',

    appTitle: 'Noten lesen',
    appSubtitle: 'Klavier · Sight Reading',
    chooseMode: 'Modus wählen',
    chooseLevel: 'Niveau wählen',
    chooseClef: 'Schlüssel',
    noteCount: 'Notenanzahl',
    playOrder: 'Spielreihenfolge',
    tempo: 'Tempo',
    chords: 'Akkorde',
    maxKeys: 'Tonart',
    startBtn: 'Starten',
    openSearch: 'Bibliothek öffnen',
    learningBtn: '🎓 Lernen',
    audioTestBtn: '🎤 Audiotest',

    modeSRTitle: 'Sight Reading',
    modeSRDesc: 'Zufällige Noten spielen — Echtzeit-Feedback',
    modeListenTitle: 'Freies Hören',
    modeListenDesc: 'Noten anzeigen und hören — ohne Prüfung',
    modeSearchTitle: 'Liederbibliothek',
    modeSearchDesc: 'Bekannte klassische und Volkslieder üben',

    clefTreble: 'Violinschlüssel',
    clefBass: 'Bassschlüssel',
    clefBoth: 'Beide',

    seqLabel: 'Rechts → Links',
    seqDesc: 'Erst rechte Hand, dann linke',
    simLabel: 'Beide zusammen',
    simDesc: 'Paare — beide Hände gleichzeitig',

    correctLabel: 'Richtig',
    wrongLabel: 'Falsch',
    noteProgress: 'Note {n} / {total}',
    tryAgain: 'Nochmal versuchen',
    newExercise: 'Neue Übung',
    stop: 'Stopp',

    playBtn: '▶ Spielen',
    stopBtn: '⏹ Stopp',
    newNotes: 'Neue Noten',
    listenLabel: 'Zuhören',

    msgExcellent: 'Ausgezeichnet!',
    msgGreat: 'Sehr gut!',
    msgKeepGoing: 'Weiter üben',
    msgNotBad: 'Nicht schlecht, probier nochmal',
    pctCorrect: '{pct}% richtig',
    levelLabel: 'Niveau',
    notesLabel: 'Noten',
    tryAgainSame: 'Nochmal — gleiches Niveau',
    backToMenu: 'Zurück zum Menü',

    learningTitle: 'Lernen',
    notesCount: 'Noten',
    streakLabel: 'Serie',
    listeningLabel: '🎤 Zuhören...',
    waitingLabel: '🎤 Warten...',
    correctExclaim: '✓ Richtig!',
    learningHint: 'Spiele die Note auf dem Klavier — bei richtiger Note wechselt sie automatisch',
    skipBtn: 'Überspringen →',

    noteC: 'C', noteD: 'D', noteE: 'E',
    noteF: 'F', noteG: 'G', noteA: 'A', noteB: 'H',

    audioTestTitle: 'Audiotest',
    notesDetected: 'Noten erkannt',
    micSignal: 'Mikrofonsignal',
    waitingSound: 'Warte auf Ton...',
    micActiveLabel: 'Mikrofon aktiv',
    micErrorLabel: 'Mikrofonfehler',
    calibrateBtn: '🎹 Klang auf dein Klavier kalibrieren',
    calibratingLabel: '⏳ Höre Klavier...',
    calibratedLabel: '✓ Klang kalibriert',
    calibrateHint: 'Spiele eine Note und halte sie 2-3 Sekunden',
    playNoteHint: 'Spiele die blaue Note auf dem Klavier. Bei richtiger Note wechselt sie.',

    levelNames: ['Absoluter Anfänger', 'Anfänger', 'Grundstufe', 'Grundstufe+', 'Mittelstufe', 'Mittelstufe+', 'Fortgeschritten', 'Experte'],

    drawerHome: 'Startseite',
    drawerSettings: 'Einstellungen',
    drawerStats: 'Statistik',
    drawerTrainingModes: 'Übungsmodi',
    drawerLearning: 'Lernen',
    drawerHelp: 'Hilfe & Support',
    drawerAbout: 'Über',
    drawerProfile: 'Profil',
    drawerLogout: 'Abmelden',

    settingsTitle: 'Einstellungen',
    sectionAudioInput: 'Audio & Eingabe',
    sectionMusicDisplay: 'Musikalische Anzeige',
    sectionSystemPractice: 'System & Übung',
    audioInputLabel: 'Eingabequelle',
    audioInputMic: 'Eingebautes Mikrofon',
    audioInputMidi: 'MIDI-Keyboard',
    audioInputMidiSoon: 'demnächst',
    micSensitivityLabel: 'Mikrofonempfindlichkeit',
    sensitivityLow: 'Niedrig',
    sensitivityHigh: 'Hoch',
    audioFeedbackLabel: 'Akustisches Feedback',
    audioFeedbackDesc: 'Klavierton abspielen, wenn eine richtige Note erkannt wird',
    noteNamingLabel: 'Notennamen',
    noteNamingLetters: 'Buchstaben (C D E)',
    noteNamingSolfege: 'Solmisation (Do Re Mi)',
    colorfulNotesLabel: 'Farbige Noten',
    colorfulNotesDesc: 'Jede Note nach Tonhöhe einfärben — ideal für Anfänger',
    staffSizeLabel: 'Notensystem-Größe',
    staffSizeSmall: 'Klein',
    staffSizeLarge: 'Groß',
    darkModeLabel: 'Dunkelmodus',
    darkModeDesc: 'Dunkles Design für die ganze App — angenehmer für die Augen bei wenig Licht',
    pianoSoundLabel: 'Klavierklang',
    countInLabel: 'Einzähler vor der Übung',
    countInDesc: '4 Metronomschläge vor Beginn der Übung',
    liveErrorFeedbackLabel: 'Fehler in Echtzeit anzeigen',
    liveErrorFeedbackDesc: 'Sofortige Rückmeldung pro Note statt nur am Ende',
    dailyReminderLabel: 'Tägliche Übungserinnerung',
    dailyReminderDesc: 'Eine tägliche Benachrichtigung zur gewählten Uhrzeit, damit du keinen Übungstag verpasst',
    reminderTimeLabel: 'Erinnerungszeit',
    dailyReminderNotifTitle: 'Zeit zum Üben! 🎹',
    dailyReminderNotifBody: 'Ein paar Minuten Notenlesen halten deine Fähigkeiten scharf',
    notifPermissionDeniedMsg: 'Benachrichtigungsberechtigung wurde nicht erteilt — die Erinnerung wird nicht gesendet. Du kannst sie in den Geräteeinstellungen erlauben.',

    songLibraryTitle: 'Liederbibliothek',
    searchSongsPlaceholder: 'Lieder suchen...',
    noSongsFound: 'Keine Lieder gefunden',
    levelBadge: 'Stufe',

    statisticsTitle: 'Statistik',
    dayStreakLabel: 'Tage-Serie',
    daysUnit: 'Tage',
    practiceTimeLabel: 'Übungszeit',
    todayLabel: 'Heute',
    thisWeekLabel: 'Diese Woche',
    minutesUnit: 'Min',
    avgAccuracyLabel: 'Durchschnittliche Genauigkeit',
    totalSessionsLabel: 'Übungen insgesamt',
    noStatsYet: 'Du hast noch nicht geübt — starte eine Übung, um hier deine Statistik zu sehen',
    streakGrewMsg: 'Deine Serie ist auf {days} Tage gewachsen! 🔥',
    yourAccuracyLabel: 'Deine Genauigkeit',
    overallAvgLabel: 'Gesamtdurchschnitt',
  },

  ru: {
    back: '← Назад',
    yes: 'Да',
    no: 'Нет',
    upTo: 'До',
    sharpsFlats: 'знаков',

    appTitle: 'Чтение нот',
    appSubtitle: 'Фортепиано · Sight Reading',
    chooseMode: 'Выбрать режим',
    chooseLevel: 'Выбрать уровень',
    chooseClef: 'Ключ',
    noteCount: 'Количество нот',
    playOrder: 'Порядок игры',
    tempo: 'Темп',
    chords: 'Аккорды',
    maxKeys: 'Тональность',
    startBtn: 'Начать',
    openSearch: 'Открыть библиотеку',
    learningBtn: '🎓 Обучение',
    audioTestBtn: '🎤 Тест звука',

    modeSRTitle: 'Sight Reading',
    modeSRDesc: 'Играть случайные ноты — проверка в реальном времени',
    modeListenTitle: 'Свободное прослушивание',
    modeListenDesc: 'Отображать ноты и слушать — без проверки',
    modeSearchTitle: 'Библиотека песен',
    modeSearchDesc: 'Играйте известные классические и народные песни',

    clefTreble: 'Скрипичный ключ',
    clefBass: 'Басовый ключ',
    clefBoth: 'Оба',

    seqLabel: 'Правая → Левая',
    seqDesc: 'Сначала правая рука, потом левая',
    simLabel: 'Обе вместе',
    simDesc: 'Пары — обе руки одновременно',

    correctLabel: 'Верно',
    wrongLabel: 'Неверно',
    noteProgress: 'Нота {n} / {total}',
    tryAgain: 'Попробовать снова',
    newExercise: 'Новое упражнение',
    stop: 'Стоп',

    playBtn: '▶ Играть',
    stopBtn: '⏹ Стоп',
    newNotes: 'Новые ноты',
    listenLabel: 'Слушать',

    msgExcellent: 'Отлично!',
    msgGreat: 'Молодец!',
    msgKeepGoing: 'Продолжай тренироваться',
    msgNotBad: 'Неплохо, попробуй снова',
    pctCorrect: '{pct}% верно',
    levelLabel: 'Уровень',
    notesLabel: 'Ноты',
    tryAgainSame: 'Снова — тот же уровень',
    backToMenu: 'Вернуться в меню',

    learningTitle: 'Обучение',
    notesCount: 'Ноты',
    streakLabel: 'Серия',
    listeningLabel: '🎤 Слушаю...',
    waitingLabel: '🎤 Ожидание...',
    correctExclaim: '✓ Верно!',
    learningHint: 'Сыграй ноту на фортепиано — при правильной ноте она автоматически сменится',
    skipBtn: 'Пропустить →',

    noteC: 'До', noteD: 'Ре', noteE: 'Ми',
    noteF: 'Фа', noteG: 'Соль', noteA: 'Ля', noteB: 'Си',

    audioTestTitle: 'Тест звука',
    notesDetected: 'Нот обнаружено',
    micSignal: 'Сигнал микрофона',
    waitingSound: 'Ожидание звука...',
    micActiveLabel: 'Микрофон активен',
    micErrorLabel: 'Ошибка микрофона',
    calibrateBtn: '🎹 Калибровать звук под ваше фортепиано',
    calibratingLabel: '⏳ Слушаю фортепиано...',
    calibratedLabel: '✓ Звук откалиброван',
    calibrateHint: 'Сыграйте ноту и удерживайте её 2-3 секунды',
    playNoteHint: 'Сыграйте синюю ноту на фортепиано. При правильной ноте она сменится.',

    levelNames: ['Абсолютный новичок', 'Новичок', 'Начальный', 'Начальный+', 'Средний', 'Средний+', 'Продвинутый', 'Эксперт'],

    drawerHome: 'Главная',
    drawerSettings: 'Настройки',
    drawerStats: 'Статистика',
    drawerTrainingModes: 'Режимы тренировки',
    drawerLearning: 'Обучение',
    drawerHelp: 'Помощь и поддержка',
    drawerAbout: 'О приложении',
    drawerProfile: 'Профиль',
    drawerLogout: 'Выйти',

    settingsTitle: 'Настройки',
    sectionAudioInput: 'Звук и ввод',
    sectionMusicDisplay: 'Отображение нот',
    sectionSystemPractice: 'Система и тренировка',
    audioInputLabel: 'Источник ввода',
    audioInputMic: 'Встроенный микрофон',
    audioInputMidi: 'MIDI-клавиатура',
    audioInputMidiSoon: 'скоро',
    micSensitivityLabel: 'Чувствительность микрофона',
    sensitivityLow: 'Низкая',
    sensitivityHigh: 'Высокая',
    audioFeedbackLabel: 'Звуковая обратная связь',
    audioFeedbackDesc: 'Воспроизводить звук пианино при верной ноте',
    noteNamingLabel: 'Названия нот',
    noteNamingLetters: 'Буквы (C D E)',
    noteNamingSolfege: 'Сольфеджио (До Ре Ми)',
    colorfulNotesLabel: 'Цветные ноты',
    colorfulNotesDesc: 'Раскрашивать каждую ноту по высоте звука — отлично для новичков',
    staffSizeLabel: 'Размер нотного стана',
    staffSizeSmall: 'Маленький',
    staffSizeLarge: 'Большой',
    darkModeLabel: 'Тёмная тема',
    darkModeDesc: 'Тёмная тема для всего приложения — комфортнее для глаз при слабом освещении',
    pianoSoundLabel: 'Звук пианино',
    countInLabel: 'Отсчёт перед тренировкой',
    countInDesc: '4 удара метронома перед началом упражнения',
    liveErrorFeedbackLabel: 'Ошибки в реальном времени',
    liveErrorFeedbackDesc: 'Мгновенная реакция на каждую ноту вместо только в конце',
    dailyReminderLabel: 'Ежедневное напоминание о тренировке',
    dailyReminderDesc: 'Ежедневное уведомление в выбранное время, чтобы не пропустить день тренировки',
    reminderTimeLabel: 'Время напоминания',
    dailyReminderNotifTitle: 'Время практики! 🎹',
    dailyReminderNotifBody: 'Несколько минут чтения нот с листа сохранят твой навык острым',
    notifPermissionDeniedMsg: 'Разрешение на уведомления не предоставлено — напоминание не будет отправлено. Вы можете разрешить это в настройках устройства.',

    songLibraryTitle: 'Библиотека песен',
    searchSongsPlaceholder: 'Поиск песен...',
    noSongsFound: 'Песни не найдены',
    levelBadge: 'Уровень',

    statisticsTitle: 'Статистика',
    dayStreakLabel: 'Дней подряд',
    daysUnit: 'дней',
    practiceTimeLabel: 'Время тренировки',
    todayLabel: 'Сегодня',
    thisWeekLabel: 'На этой неделе',
    minutesUnit: 'мин',
    avgAccuracyLabel: 'Средняя точность',
    totalSessionsLabel: 'Всего тренировок',
    noStatsYet: 'Вы ещё не тренировались — начните тренировку, чтобы увидеть статистику здесь',
    streakGrewMsg: 'Ваша серия выросла до {days} дней! 🔥',
    yourAccuracyLabel: 'Ваша точность',
    overallAvgLabel: 'Общее среднее',
  },

  ar: {
    back: '→ رجوع',
    yes: 'نعم',
    no: 'لا',
    upTo: 'حتى',
    sharpsFlats: 'علامات',

    appTitle: 'قراءة النوتات',
    appSubtitle: 'بيانو · Sight Reading',
    chooseMode: 'اختر الوضع',
    chooseLevel: 'اختر المستوى',
    chooseClef: 'المفتاح',
    noteCount: 'عدد النوتات',
    playOrder: 'ترتيب العزف',
    tempo: 'الإيقاع',
    chords: 'الأوتار',
    maxKeys: 'المقام',
    startBtn: 'ابدأ',
    openSearch: 'فتح المكتبة',
    learningBtn: '🎓 التعلم',
    audioTestBtn: '🎤 اختبار الصوت',

    modeSRTitle: 'Sight Reading',
    modeSRDesc: 'عزف نوتات عشوائية — تقييم فوري',
    modeListenTitle: 'الاستماع الحر',
    modeListenDesc: 'عرض النوتات وسماعها — بدون تقييم',
    modeSearchTitle: 'مكتبة الأغاني',
    modeSearchDesc: 'تدرب على أغاني كلاسيكية وشعبية معروفة',

    clefTreble: 'مفتاح صول',
    clefBass: 'مفتاح فا',
    clefBoth: 'كلاهما',

    seqLabel: 'يمين → يسار',
    seqDesc: 'اليد اليمنى أولاً، ثم اليسرى',
    simLabel: 'كلاهما معاً',
    simDesc: 'أزواج — كلتا اليدين في آنٍ واحد',

    correctLabel: 'صحيح',
    wrongLabel: 'خطأ',
    noteProgress: 'نوتة {n} / {total}',
    tryAgain: 'حاول مرة أخرى',
    newExercise: 'تمرين جديد',
    stop: 'إيقاف',

    playBtn: '▶ تشغيل',
    stopBtn: '⏹ إيقاف',
    newNotes: 'نوتات جديدة',
    listenLabel: 'استماع',

    msgExcellent: 'ممتاز!',
    msgGreat: 'عمل رائع!',
    msgKeepGoing: 'استمر في التمرين',
    msgNotBad: 'ليس سيئاً، حاول مرة أخرى',
    pctCorrect: '{pct}% صحيح',
    levelLabel: 'المستوى',
    notesLabel: 'نوتات',
    tryAgainSame: 'حاول مرة أخرى — نفس المستوى',
    backToMenu: 'العودة للقائمة',

    learningTitle: 'التعلم',
    notesCount: 'نوتات',
    streakLabel: 'تسلسل',
    listeningLabel: '🎤 يستمع...',
    waitingLabel: '🎤 انتظار...',
    correctExclaim: '✓ صحيح!',
    learningHint: 'اعزف النوتة على البيانو — عند الصواب ستتغير تلقائياً',
    skipBtn: '← تخطي',

    noteC: 'دو', noteD: 'ري', noteE: 'مي',
    noteF: 'فا', noteG: 'صول', noteA: 'لا', noteB: 'سي',

    audioTestTitle: 'اختبار الصوت',
    notesDetected: 'نوتات مكتشفة',
    micSignal: 'إشارة الميكروفون',
    waitingSound: 'انتظار الصوت...',
    micActiveLabel: 'الميكروفون نشط',
    micErrorLabel: 'خطأ في الميكروفون',
    calibrateBtn: '🎹 معايرة الصوت لبيانوك',
    calibratingLabel: '⏳ يستمع للبيانو...',
    calibratedLabel: '✓ تمت المعايرة',
    calibrateHint: 'اعزف نوتة واحتفظ بها 2-3 ثوانٍ',
    playNoteHint: 'اعزف النوتة الزرقاء على البيانو. عند الصواب ستتغير.',

    levelNames: ['مبتدئ مطلق', 'مبتدئ', 'ابتدائي', 'ابتدائي+', 'متوسط', 'متوسط+', 'متقدم', 'خبير'],

    drawerHome: 'الشاشة الرئيسية',
    drawerSettings: 'الإعدادات',
    drawerStats: 'الإحصائيات',
    drawerTrainingModes: 'أوضاع التدريب',
    drawerLearning: 'التعلم',
    drawerHelp: 'المساعدة والدعم',
    drawerAbout: 'حول',
    drawerProfile: 'الملف الشخصي',
    drawerLogout: 'تسجيل الخروج',

    settingsTitle: 'الإعدادات',
    sectionAudioInput: 'الصوت والإدخال',
    sectionMusicDisplay: 'عرض النوتة الموسيقية',
    sectionSystemPractice: 'النظام والتدريب',
    audioInputLabel: 'مصدر الإدخال',
    audioInputMic: 'الميكروفون المدمج',
    audioInputMidi: 'لوحة مفاتيح MIDI',
    audioInputMidiSoon: 'قريباً',
    micSensitivityLabel: 'حساسية الميكروفون',
    sensitivityLow: 'منخفضة',
    sensitivityHigh: 'عالية',
    audioFeedbackLabel: 'التغذية الراجعة الصوتية',
    audioFeedbackDesc: 'تشغيل صوت بيانو عند اكتشاف نغمة صحيحة',
    noteNamingLabel: 'أسماء النغمات',
    noteNamingLetters: 'حروف (C D E)',
    noteNamingSolfege: 'سولفيج (دو ري مي)',
    colorfulNotesLabel: 'نغمات ملونة',
    colorfulNotesDesc: 'تلوين كل نغمة حسب حدتها — مثالي للمبتدئين',
    staffSizeLabel: 'حجم السلم الموسيقي',
    staffSizeSmall: 'صغير',
    staffSizeLarge: 'كبير',
    darkModeLabel: 'الوضع الداكن',
    darkModeDesc: 'مظهر داكن لكامل التطبيق — أكثر راحة للعين في الإضاءة المنخفضة',
    pianoSoundLabel: 'صوت البيانو',
    countInLabel: 'العد التنازلي قبل التدريب',
    countInDesc: '4 نبضات مترونوم قبل بدء التمرين',
    liveErrorFeedbackLabel: 'عرض الأخطاء في الوقت الفعلي',
    liveErrorFeedbackDesc: 'استجابة فورية لكل نغمة، بدلاً من في النهاية فقط',
    dailyReminderLabel: 'تذكير التدريب اليومي',
    dailyReminderDesc: 'إشعار يومي في الوقت الذي تختاره، حتى لا يفوتك يوم تدريب',
    reminderTimeLabel: 'وقت التذكير',
    dailyReminderNotifTitle: 'حان وقت التدريب! 🎹',
    dailyReminderNotifBody: 'بضع دقائق من قراءة النوتات ستحافظ على مهارتك حادة',
    notifPermissionDeniedMsg: 'لم يتم منح إذن الإشعارات — لن يتم إرسال التذكير. يمكنك السماح بذلك من إعدادات الجهاز.',

    songLibraryTitle: 'مكتبة الأغاني',
    searchSongsPlaceholder: 'ابحث عن أغاني...',
    noSongsFound: 'لم يتم العثور على أغاني',
    levelBadge: 'المستوى',

    statisticsTitle: 'الإحصائيات',
    dayStreakLabel: 'أيام متتالية',
    daysUnit: 'أيام',
    practiceTimeLabel: 'وقت التدريب',
    todayLabel: 'اليوم',
    thisWeekLabel: 'هذا الأسبوع',
    minutesUnit: 'د',
    avgAccuracyLabel: 'متوسط الدقة',
    totalSessionsLabel: 'إجمالي التدريبات',
    noStatsYet: 'لم تتدرب بعد — ابدأ تدريبًا لترى إحصائياتك هنا',
    streakGrewMsg: 'ارتفع تسلسلك إلى {days} أيام! 🔥',
    yourAccuracyLabel: 'دقتك',
    overallAvgLabel: 'المتوسط العام',
  },

  pt: {
    back: '← Voltar',
    yes: 'Sim',
    no: 'Não',
    upTo: 'Até',
    sharpsFlats: 'sustenidos/bemóis',

    appTitle: 'Leitura de Notas',
    appSubtitle: 'Piano · Sight Reading',
    chooseMode: 'Escolher modo',
    chooseLevel: 'Escolher nível',
    chooseClef: 'Clave',
    noteCount: 'Número de notas',
    playOrder: 'Ordem de execução',
    tempo: 'Tempo',
    chords: 'Acordes',
    maxKeys: 'Tonalidade',
    startBtn: 'Começar',
    openSearch: 'Abrir biblioteca',
    learningBtn: '🎓 Aprendizagem',
    audioTestBtn: '🎤 Teste de áudio',

    modeSRTitle: 'Sight Reading',
    modeSRDesc: 'Tocar notas aleatórias — avaliação em tempo real',
    modeListenTitle: 'Escuta livre',
    modeListenDesc: 'Ver notas e ouvi-las — sem avaliação',
    modeSearchTitle: 'Biblioteca de músicas',
    modeSearchDesc: 'Pratique músicas clássicas e populares conhecidas',

    clefTreble: 'Clave de sol',
    clefBass: 'Clave de fá',
    clefBoth: 'Ambos',

    seqLabel: 'Direita → Esquerda',
    seqDesc: 'Mão direita primeiro, depois esquerda',
    simLabel: 'Ambas juntas',
    simDesc: 'Pares — ambas as mãos simultaneamente',

    correctLabel: 'Correto',
    wrongLabel: 'Incorreto',
    noteProgress: 'Nota {n} / {total}',
    tryAgain: 'Tentar novamente',
    newExercise: 'Novo exercício',
    stop: 'Parar',

    playBtn: '▶ Tocar',
    stopBtn: '⏹ Parar',
    newNotes: 'Novas notas',
    listenLabel: 'Ouvir',

    msgExcellent: 'Excelente!',
    msgGreat: 'Muito bem!',
    msgKeepGoing: 'Continue praticando',
    msgNotBad: 'Não está mal, tente novamente',
    pctCorrect: '{pct}% correto',
    levelLabel: 'Nível',
    notesLabel: 'Notas',
    tryAgainSame: 'Tentar — mesmo nível',
    backToMenu: 'Voltar ao menu',

    learningTitle: 'Aprendizagem',
    notesCount: 'Notas',
    streakLabel: 'Sequência',
    listeningLabel: '🎤 Ouvindo...',
    waitingLabel: '🎤 Aguardando...',
    correctExclaim: '✓ Correto!',
    learningHint: 'Toque a nota no piano — quando correta ela mudará automaticamente',
    skipBtn: 'Pular →',

    noteC: 'Dó', noteD: 'Ré', noteE: 'Mi',
    noteF: 'Fá', noteG: 'Sol', noteA: 'Lá', noteB: 'Si',

    audioTestTitle: 'Teste de áudio',
    notesDetected: 'Notas detectadas',
    micSignal: 'Sinal do microfone',
    waitingSound: 'Aguardando som...',
    micActiveLabel: 'Microfone ativo',
    micErrorLabel: 'Erro no microfone',
    calibrateBtn: '🎹 Calibrar som para seu piano',
    calibratingLabel: '⏳ Ouvindo o piano...',
    calibratedLabel: '✓ Som calibrado',
    calibrateHint: 'Toque uma nota e segure por 2-3 segundos',
    playNoteHint: 'Toque a nota azul no piano. Quando correta ela mudará.',

    levelNames: ['Iniciante absoluto', 'Iniciante', 'Elementar', 'Elementar+', 'Intermediário', 'Intermediário+', 'Avançado', 'Especialista'],

    drawerHome: 'Início',
    drawerSettings: 'Configurações',
    drawerStats: 'Estatísticas',
    drawerTrainingModes: 'Modos de treino',
    drawerLearning: 'Aprendizagem',
    drawerHelp: 'Ajuda e suporte',
    drawerAbout: 'Sobre',
    drawerProfile: 'Perfil',
    drawerLogout: 'Sair',

    settingsTitle: 'Configurações',
    sectionAudioInput: 'Áudio e entrada',
    sectionMusicDisplay: 'Exibição musical',
    sectionSystemPractice: 'Sistema e prática',
    audioInputLabel: 'Fonte de entrada',
    audioInputMic: 'Microfone integrado',
    audioInputMidi: 'Teclado MIDI',
    audioInputMidiSoon: 'em breve',
    micSensitivityLabel: 'Sensibilidade do microfone',
    sensitivityLow: 'Baixa',
    sensitivityHigh: 'Alta',
    audioFeedbackLabel: 'Feedback sonoro',
    audioFeedbackDesc: 'Tocar um som de piano ao detectar uma nota correta',
    noteNamingLabel: 'Nomes das notas',
    noteNamingLetters: 'Letras (C D E)',
    noteNamingSolfege: 'Solfejo (Dó Ré Mi)',
    colorfulNotesLabel: 'Notas coloridas',
    colorfulNotesDesc: 'Colorir cada nota pela sua altura — ótimo para iniciantes',
    staffSizeLabel: 'Tamanho da pauta',
    staffSizeSmall: 'Pequeno',
    staffSizeLarge: 'Grande',
    darkModeLabel: 'Modo escuro',
    darkModeDesc: 'Tema escuro em todo o app — mais confortável para os olhos com pouca luz',
    pianoSoundLabel: 'Som do piano',
    countInLabel: 'Contagem antes da prática',
    countInDesc: '4 batidas de metrônomo antes do início do exercício',
    liveErrorFeedbackLabel: 'Erros em tempo real',
    liveErrorFeedbackDesc: 'Resposta imediata por nota, em vez de só no final',
    dailyReminderLabel: 'Lembrete de prática diária',
    dailyReminderDesc: 'Uma notificação diária no horário escolhido, para você nunca perder um dia de prática',
    reminderTimeLabel: 'Horário do lembrete',
    dailyReminderNotifTitle: 'Hora de praticar! 🎹',
    dailyReminderNotifBody: 'Alguns minutos de leitura à primeira vista manterão sua habilidade afiada',
    notifPermissionDeniedMsg: 'A permissão de notificações não foi concedida — o lembrete não será enviado. Você pode permitir isso nas configurações do dispositivo.',

    songLibraryTitle: 'Biblioteca de músicas',
    searchSongsPlaceholder: 'Pesquisar músicas...',
    noSongsFound: 'Nenhuma música encontrada',
    levelBadge: 'Nível',

    statisticsTitle: 'Estatísticas',
    dayStreakLabel: 'Sequência de dias',
    daysUnit: 'dias',
    practiceTimeLabel: 'Tempo de prática',
    todayLabel: 'Hoje',
    thisWeekLabel: 'Esta semana',
    minutesUnit: 'min',
    avgAccuracyLabel: 'Precisão média',
    totalSessionsLabel: 'Total de práticas',
    noStatsYet: 'Você ainda não praticou — comece uma sessão para ver suas estatísticas aqui',
    streakGrewMsg: 'Sua sequência aumentou para {days} dias! 🔥',
    yourAccuracyLabel: 'Sua precisão',
    overallAvgLabel: 'Média geral',
  },

  it: {
    back: '← Indietro',
    yes: 'Sì',
    no: 'No',
    upTo: 'Fino a',
    sharpsFlats: 'alterazioni',

    appTitle: 'Lettura Note',
    appSubtitle: 'Pianoforte · Sight Reading',
    chooseMode: 'Scegli modalità',
    chooseLevel: 'Scegli livello',
    chooseClef: 'Chiave',
    noteCount: 'Numero di note',
    playOrder: 'Ordine di esecuzione',
    tempo: 'Tempo',
    chords: 'Accordi',
    maxKeys: 'Tonalità',
    startBtn: 'Inizia',
    openSearch: 'Apri libreria',
    learningBtn: '🎓 Apprendimento',
    audioTestBtn: '🎤 Test audio',

    modeSRTitle: 'Sight Reading',
    modeSRDesc: 'Suona note casuali — valutazione in tempo reale',
    modeListenTitle: 'Ascolto libero',
    modeListenDesc: 'Visualizza note e ascoltale — senza valutazione',
    modeSearchTitle: 'Libreria di canzoni',
    modeSearchDesc: 'Esercitati con canzoni classiche e popolari conosciute',

    clefTreble: 'Chiave di violino',
    clefBass: 'Chiave di basso',
    clefBoth: 'Entrambi',

    seqLabel: 'Destra → Sinistra',
    seqDesc: 'Prima mano destra, poi sinistra',
    simLabel: 'Entrambe insieme',
    simDesc: 'Coppie — entrambe le mani simultaneamente',

    correctLabel: 'Corretto',
    wrongLabel: 'Sbagliato',
    noteProgress: 'Nota {n} / {total}',
    tryAgain: 'Riprova',
    newExercise: 'Nuovo esercizio',
    stop: 'Ferma',

    playBtn: '▶ Suona',
    stopBtn: '⏹ Ferma',
    newNotes: 'Nuove note',
    listenLabel: 'Ascolta',

    msgExcellent: 'Eccellente!',
    msgGreat: 'Ottimo lavoro!',
    msgKeepGoing: 'Continua a praticare',
    msgNotBad: 'Non male, riprova',
    pctCorrect: '{pct}% corretto',
    levelLabel: 'Livello',
    notesLabel: 'Note',
    tryAgainSame: 'Riprova — stesso livello',
    backToMenu: 'Torna al menu',

    learningTitle: 'Apprendimento',
    notesCount: 'Note',
    streakLabel: 'Serie',
    listeningLabel: '🎤 Ascolto...',
    waitingLabel: '🎤 In attesa...',
    correctExclaim: '✓ Corretto!',
    learningHint: 'Suona la nota sul pianoforte — quando è corretta cambierà automaticamente',
    skipBtn: 'Salta →',

    noteC: 'Do', noteD: 'Re', noteE: 'Mi',
    noteF: 'Fa', noteG: 'Sol', noteA: 'La', noteB: 'Si',

    audioTestTitle: 'Test audio',
    notesDetected: 'Note rilevate',
    micSignal: 'Segnale microfono',
    waitingSound: 'In attesa di suono...',
    micActiveLabel: 'Microfono attivo',
    micErrorLabel: 'Errore microfono',
    calibrateBtn: '🎹 Calibra suono per il tuo pianoforte',
    calibratingLabel: '⏳ Ascolto pianoforte...',
    calibratedLabel: '✓ Suono calibrato',
    calibrateHint: 'Suona una nota e tienila per 2-3 secondi',
    playNoteHint: 'Suona la nota blu sul pianoforte. Quando è corretta cambierà.',

    levelNames: ['Principiante assoluto', 'Principiante', 'Elementare', 'Elementare+', 'Intermedio', 'Intermedio+', 'Avanzato', 'Esperto'],

    drawerHome: 'Home',
    drawerSettings: 'Impostazioni',
    drawerStats: 'Statistiche',
    drawerTrainingModes: 'Modalità di allenamento',
    drawerLearning: 'Apprendimento',
    drawerHelp: 'Aiuto e supporto',
    drawerAbout: 'Informazioni',
    drawerProfile: 'Profilo',
    drawerLogout: 'Esci',

    settingsTitle: 'Impostazioni',
    sectionAudioInput: 'Audio e input',
    sectionMusicDisplay: 'Visualizzazione musicale',
    sectionSystemPractice: 'Sistema ed esercizio',
    audioInputLabel: 'Sorgente di input',
    audioInputMic: 'Microfono integrato',
    audioInputMidi: 'Tastiera MIDI',
    audioInputMidiSoon: 'in arrivo',
    micSensitivityLabel: 'Sensibilità del microfono',
    sensitivityLow: 'Bassa',
    sensitivityHigh: 'Alta',
    audioFeedbackLabel: 'Feedback sonoro',
    audioFeedbackDesc: 'Riproduce un suono di pianoforte quando viene rilevata una nota corretta',
    noteNamingLabel: 'Nomi delle note',
    noteNamingLetters: 'Lettere (C D E)',
    noteNamingSolfege: 'Solfeggio (Do Re Mi)',
    colorfulNotesLabel: 'Note colorate',
    colorfulNotesDesc: "Colora ogni nota in base all'altezza — ideale per i principianti",
    staffSizeLabel: 'Dimensione del pentagramma',
    staffSizeSmall: 'Piccolo',
    staffSizeLarge: 'Grande',
    darkModeLabel: 'Modalità scura',
    darkModeDesc: "Tema scuro per tutta l'app — più comodo per gli occhi con poca luce",
    pianoSoundLabel: 'Suono del pianoforte',
    countInLabel: "Conto alla rovescia prima dell'esercizio",
    countInDesc: "4 battiti di metronomo prima dell'inizio dell'esercizio",
    liveErrorFeedbackLabel: 'Errori in tempo reale',
    liveErrorFeedbackDesc: 'Risposta immediata per ogni nota, invece che solo alla fine',
    dailyReminderLabel: 'Promemoria di pratica giornaliero',
    dailyReminderDesc: "Una notifica giornaliera all'orario scelto, per non perdere mai un giorno di pratica",
    reminderTimeLabel: 'Orario del promemoria',
    dailyReminderNotifTitle: "È ora di esercitarsi! 🎹",
    dailyReminderNotifBody: 'Qualche minuto di lettura a prima vista manterrà la tua abilità affilata',
    notifPermissionDeniedMsg: "Il permesso per le notifiche non è stato concesso — il promemoria non verrà inviato. Puoi consentirlo nelle impostazioni del dispositivo.",

    songLibraryTitle: 'Libreria di canzoni',
    searchSongsPlaceholder: 'Cerca canzoni...',
    noSongsFound: 'Nessuna canzone trovata',
    levelBadge: 'Livello',

    statisticsTitle: 'Statistiche',
    dayStreakLabel: 'Giorni consecutivi',
    daysUnit: 'giorni',
    practiceTimeLabel: 'Tempo di pratica',
    todayLabel: 'Oggi',
    thisWeekLabel: 'Questa settimana',
    minutesUnit: 'min',
    avgAccuracyLabel: 'Precisione media',
    totalSessionsLabel: 'Sessioni totali',
    noStatsYet: 'Non hai ancora esercitato — inizia una sessione per vedere qui le tue statistiche',
    streakGrewMsg: 'La tua serie è salita a {days} giorni! 🔥',
    yourAccuracyLabel: 'La tua precisione',
    overallAvgLabel: 'Media generale',
  },
};

// Module-level singleton — survives navigation, cleared on app restart
let currentLang: Lang = 'he';

export const langSettings = {
  get: (): Lang => currentLang,
  set: (lang: Lang) => { currentLang = lang; },
  t: (): T => translations[currentLang],
};

export function tr(key: keyof T): string {
  return translations[currentLang][key] as string;
}
