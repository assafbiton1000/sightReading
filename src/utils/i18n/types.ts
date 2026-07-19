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
  skippedLabel: string;
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
  showScoreBtn: string;
  rhythmErrorsLabel: string;
  showCorrectBtn: string;
  showYourBtn: string;
  songChooseTitle: string;
  practiceModeBtn: string;

  // learning
  learningTitle: string;
  notesCount: string;
  streakLabel: string;
  listeningLabel: string;
  waitingLabel: string;
  playOnKeyboardLabel: string;
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
  drawerSupport: string;
  drawerLeaderboard: string;
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
  micSensitivityLabel: string;
  sensitivityLow: string;
  sensitivityHigh: string;
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
  metronomeLabel: string;
  metronomeDesc: string;
  metronomeBpmLabel: string;
  metronomeVolumeLabel: string;
  metronomeAccentLabel: string;
  disappearingMeasuresLabel: string;
  disappearingMeasuresDesc: string;
  dmTimingDelayed: string;
  dmTimingOnEntry: string;
  dmTimingAfterEnd: string;
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

  // help & support (FAQ + community forum)
  helpFaqTab: string;
  helpForumTab: string;
  faqCatAll: string;
  faqCatTechnical: string;
  faqCatMusical: string;
  faqCatApp: string;
  forumIntro: string;
  askQuestionBtn: string;
  newQuestionTitle: string;
  qTitlePlaceholder: string;
  qBodyPlaceholder: string;
  qNamePlaceholder: string;
  anonymousName: string;
  publishBtn: string;
  cancelBtn: string;
  repliesCount: string; // "{n}" placeholder
  noRepliesYet: string;
  writeReplyPlaceholder: string;
  sendReplyBtn: string;
  forumEmpty: string;
  deleteBtn: string;
  deletePostConfirm: string;
  postConfirm: string;         // confirm-before-posting a comment/reply
  forumSignInPrompt: string;   // shown when a signed-out user tries to participate
  timeJustNow: string;
  timeMinAgo: string;  // "{n}" placeholder
  timeHourAgo: string; // "{n}" placeholder
  timeDayAgo: string;  // "{n}" placeholder

  // profile & account
  profileNotLoggedIn: string;
  profileLoginPrompt: string;
  profileNamePlaceholder: string;
  profileEmailPlaceholder: string;
  profileLoginBtn: string;
  profilePersonalDetails: string;
  profileNameLabel: string;
  profileEmailLabel: string;
  profileMemberSince: string;
  profileActivityTitle: string;
  profileEditBtn: string;
  profileSaveBtn: string;
  logoutConfirmMsg: string;

  // auth — real accounts (Supabase): sign in / sign up / verify / reset password
  authSignInTitle: string;
  authSignUpTitle: string;
  authForgotTitle: string;
  authForgotHint: string;
  authPasswordPlaceholder: string;
  authPasswordConfirmPlaceholder: string;
  authSignUpBtn: string;
  authSendResetBtn: string;
  authForgotLink: string;
  authSwitchToSignUp: string;
  authSwitchToSignIn: string;
  authGoogleBtn: string;
  authOrDivider: string;
  authVerifySentTitle: string;
  authVerifySentMsg: string; // "{email}" placeholder
  authResendBtn: string;
  authResendDone: string;
  authResetSentTitle: string;
  authResetSentMsg: string; // "{email}" placeholder
  authNewPasswordTitle: string;
  authNewPasswordPlaceholder: string;
  authSetPasswordBtn: string;
  authPasswordUpdatedMsg: string;
  authBackToSignIn: string;
  authErrInvalidCreds: string;
  authErrEmailNotConfirmed: string;
  authErrUserExists: string;
  authErrWeakPassword: string;
  authErrPasswordMismatch: string;
  authErrNetwork: string;
  authErrCancelled: string;
  authErrUnknown: string;
  authErrNotConfigured: string;
  deleteAccountBtn: string;
  deleteAccountConfirmMsg: string;
  deleteAccountErrMsg: string;

  // profile badges (badge names themselves are untranslated brand names)
  badgeSectionTitle: string;
  badgeYours: string;
  badgeDevDesc: string;
  badgePatronDesc: string;
  badgeLoverDesc: string;

  // support screen
  supportTitle: string;
  supportIntro: string;
  watchAdLabel: string;
  watchAdDesc: string;
  watchAdLoading: string;
  watchAdThanks: string;
  watchAdError: string;
  watchAdPointsEarned: string; // "{points}" placeholder
  // support tiers (in-app purchase)
  supportTierTitle: string;
  supportTierIntro: string;
  supportPatronActive: string;
  supportSignInRequired: string;
  supportStoreUnavailable: string;
  supportThanksTitle: string;
  supportThanksBody: string;
  supportPurchaseError: string;

  // points + leaderboard
  pointsLabel: string;
  leaderboardTitle: string;
  leaderboardIntro: string;
  leaderboardSignInPrompt: string;
  leaderboardSignInBtn: string;
  leaderboardEmpty: string;
  leaderboardYou: string;
  leaderboardNotConfigured: string;
  // player ranks (shown on the leaderboard + profile)
  rankBeginner: string;
  rankIntermediate: string;
  rankAdvanced: string;
  rankExpert: string;
  rankMaster: string;

  // practice start hint
  startPlayingHint: string;
}
