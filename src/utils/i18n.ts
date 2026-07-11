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
    openSearch: 'פתח חיפוש',
    learningBtn: '🎓 למידה',
    audioTestBtn: '🎤 בדיקת שמע',

    modeSRTitle: 'Sight Reading',
    modeSRDesc: 'נגן תווים אקראיים — בדיקה בזמן אמת',
    modeListenTitle: 'האזנה חופשית',
    modeListenDesc: 'הצג תווים ושמע אותם — ללא בדיקה',
    modeSearchTitle: 'חיפוש שירים',
    modeSearchDesc: 'חפש תווים ואקורדים לשירים',

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
    openSearch: 'Open search',
    learningBtn: '🎓 Learning',
    audioTestBtn: '🎤 Audio test',

    modeSRTitle: 'Sight Reading',
    modeSRDesc: 'Play random notes — real-time feedback',
    modeListenTitle: 'Free Listening',
    modeListenDesc: 'View notes and hear them — no check',
    modeSearchTitle: 'Song Search',
    modeSearchDesc: 'Find notes and chords for songs',

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
    openSearch: 'Abrir búsqueda',
    learningBtn: '🎓 Aprendizaje',
    audioTestBtn: '🎤 Prueba de audio',

    modeSRTitle: 'Sight Reading',
    modeSRDesc: 'Toca notas al azar — evaluación en tiempo real',
    modeListenTitle: 'Escucha libre',
    modeListenDesc: 'Ver notas y escucharlas — sin evaluación',
    modeSearchTitle: 'Buscar canciones',
    modeSearchDesc: 'Busca notas y acordes para canciones',

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
    openSearch: 'Ouvrir la recherche',
    learningBtn: '🎓 Apprentissage',
    audioTestBtn: '🎤 Test audio',

    modeSRTitle: 'Sight Reading',
    modeSRDesc: 'Jouer des notes aléatoires — évaluation en temps réel',
    modeListenTitle: 'Écoute libre',
    modeListenDesc: 'Voir les notes et les écouter — sans évaluation',
    modeSearchTitle: 'Rechercher des chansons',
    modeSearchDesc: 'Chercher des notes et accords pour des chansons',

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
    openSearch: 'Suche öffnen',
    learningBtn: '🎓 Lernen',
    audioTestBtn: '🎤 Audiotest',

    modeSRTitle: 'Sight Reading',
    modeSRDesc: 'Zufällige Noten spielen — Echtzeit-Feedback',
    modeListenTitle: 'Freies Hören',
    modeListenDesc: 'Noten anzeigen und hören — ohne Prüfung',
    modeSearchTitle: 'Lieder suchen',
    modeSearchDesc: 'Noten und Akkorde für Lieder suchen',

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
    openSearch: 'Открыть поиск',
    learningBtn: '🎓 Обучение',
    audioTestBtn: '🎤 Тест звука',

    modeSRTitle: 'Sight Reading',
    modeSRDesc: 'Играть случайные ноты — проверка в реальном времени',
    modeListenTitle: 'Свободное прослушивание',
    modeListenDesc: 'Отображать ноты и слушать — без проверки',
    modeSearchTitle: 'Поиск песен',
    modeSearchDesc: 'Найти ноты и аккорды для песен',

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
    openSearch: 'فتح البحث',
    learningBtn: '🎓 التعلم',
    audioTestBtn: '🎤 اختبار الصوت',

    modeSRTitle: 'Sight Reading',
    modeSRDesc: 'عزف نوتات عشوائية — تقييم فوري',
    modeListenTitle: 'الاستماع الحر',
    modeListenDesc: 'عرض النوتات وسماعها — بدون تقييم',
    modeSearchTitle: 'البحث عن أغاني',
    modeSearchDesc: 'البحث عن نوتات وأوتار للأغاني',

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
    openSearch: 'Abrir pesquisa',
    learningBtn: '🎓 Aprendizagem',
    audioTestBtn: '🎤 Teste de áudio',

    modeSRTitle: 'Sight Reading',
    modeSRDesc: 'Tocar notas aleatórias — avaliação em tempo real',
    modeListenTitle: 'Escuta livre',
    modeListenDesc: 'Ver notas e ouvi-las — sem avaliação',
    modeSearchTitle: 'Pesquisar músicas',
    modeSearchDesc: 'Buscar notas e acordes para músicas',

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
    openSearch: 'Apri ricerca',
    learningBtn: '🎓 Apprendimento',
    audioTestBtn: '🎤 Test audio',

    modeSRTitle: 'Sight Reading',
    modeSRDesc: 'Suona note casuali — valutazione in tempo reale',
    modeListenTitle: 'Ascolto libero',
    modeListenDesc: 'Visualizza note e ascoltale — senza valutazione',
    modeSearchTitle: 'Cerca canzoni',
    modeSearchDesc: 'Cerca note e accordi per canzoni',

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
