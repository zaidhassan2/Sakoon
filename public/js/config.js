/**
 * Application-wide constants for Sukoon.
 * Keep the product name in this single config constant.
 */
export const APP_NAME = 'Sukoon';

export const CONFIG = Object.freeze({
  appName: APP_NAME,
  defaultModuleId: 'stress',
  defaultCountry: 'PK',
  safeExitUrl: 'https://www.google.com',
  apiEndpoint: '/api/chat',
  healthEndpoint: '/api/health',
  helplinesPath: '/data/helplines.json',
  apiTimeoutMs: 25000,
  typingIndicatorDelayMs: 400,
  maxMessages: 12,
  maxMessageChars: 1000,
  softCounterThreshold: 800,
  sessionKeys: Object.freeze({
    welcomeSeen: 'sukoon_welcome_seen',
    messages: 'sukoon_messages',
    country: 'sukoon_country',
    safetyEmphasised: 'sukoon_safety_emphasised',
  }),
  localKeys: Object.freeze({
    theme: 'sukoon_theme',
    textSize: 'sukoon_text_size',
    reduceMotion: 'sukoon_reduce_motion',
  }),
});
