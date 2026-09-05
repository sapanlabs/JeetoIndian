export const APP_CONFIG = {
  appName: 'JeetoIndian',
  tagline: "India's Competitive Knowledge Platform",
  legal: {
    isFreeToPlay: true,
    allowEntryFee: false, // NON-NEGOTIABLE BUSINESS RULE
    allowCashWallet: false,
    fundingSource: 'SPONSOR_B2B_CAMPAIGN',
    dataLocalizationRegion: 'ap-south-1',
  },
  quizDefaults: {
    correctScore: 100,
    wrongScore: 0,
    unansweredScore: 0,
    minTimePerQuestionMs: 300, // Anti-cheat bot speed threshold
  },
  auth: {
    otpLength: 6,
    otpExpirySeconds: 300, // 5 minutes
    otpThrottleSeconds: 60, // 1 minute per resend
    accessTokenExpiry: '15m',
    refreshTokenExpiry: '7d',
  },
};
