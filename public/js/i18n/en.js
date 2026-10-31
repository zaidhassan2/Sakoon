import { APP_NAME } from '../config.js';

export const EN = Object.freeze({
  appName: APP_NAME,
  metaDescription: 'A calm, private companion and offline grounding space for moments of stress.',

  greetings: {
    morning: 'Good morning',
    afternoon: 'Good afternoon',
    evening: 'Good evening',
    night: 'A quiet space for tonight',
  },

  welcome: {
    heading: APP_NAME,
    subtitle: 'A quiet space to pause when things feel heavy.',
    honestLines: [
      "I'm an AI, not a therapist.",
      "I can't handle emergencies. If you're in danger, help is one tap away.",
      "We don't save your chat. Your messages are sent to an AI service so it can write a reply.",
    ],
    continueBtn: 'Continue',
    howItWorksBtn: 'How this works',
  },

  howItWorks: {
    title: 'How this works',
    closeBtn: 'Close',
    sections: [
      {
        heading: 'What this space is',
        body: `${APP_NAME} is a free, quiet companion for moments of everyday stress. You can talk through what is on your mind or use offline exercises at your own pace.`,
      },
      {
        heading: 'Your privacy',
        body: 'We do not ask for your name, email, or account. We do not use cookies or analytics. Your conversation stays only in this browser tab until you close it or clear it. When you send a message, the recent turns are sent to an AI language service so it can generate a reply.',
      },
      {
        heading: 'Important limits',
        body: 'An AI cannot replace human care, medical advice, or crisis support. Whenever things feel too heavy, you can reach free, confidential human helplines with one tap.',
      },
    ],
  },

  header: {
    helpNowBtn: 'Get help now',
    backToChatBtn: 'Back to chat',
    menuBtnLabel: 'More options',
  },

  menu: {
    title: 'Options',
    exercises: 'Exercises',
    clearChat: 'Clear chat',
    clearAndLeave: 'Clear and leave',
    themeLabel: 'Theme',
    themeOptions: {
      system: 'System',
      light: 'Light',
      dark: 'Dark',
    },
    textSizeLabel: 'Text size',
    textSizeOptions: {
      normal: 'Standard',
      large: 'Larger',
      xlarge: 'Largest',
    },
    reduceMotionLabel: 'Motion',
    reduceMotionOptions: {
      system: 'System default',
      on: 'Reduce motion',
      off: 'Standard motion',
    },
    about: 'About',
    closeMenu: 'Close options',
    chatClearedNotice: 'Your conversation has been cleared.',
  },

  about: {
    title: `About ${APP_NAME}`,
    closeBtn: 'Close',
    whatItIsHeading: 'What this is',
    whatItIsBody: `${APP_NAME} is a calm companion designed for low-energy moments when stress builds up. Everything here is an invitation—you are always in control of what to share, skip, or clear.`,
    whatItIsNotHeading: 'What this is not',
    whatItIsNotBody: 'This is an AI tool, not a human counsellor or emergency service. It does not diagnose, judge, or keep records about you.',
    privacyHeading: 'Privacy in plain words',
    privacyBody: 'Your chat lives only in temporary session memory in this tab. Exercises run entirely on your device and never send anything to a server. Tapping "Clear and leave" erases all temporary data and takes you to a neutral web page.',
  },

  chat: {
    emptyHeading: 'How are you feeling right now?',
    guideMeBtn: "I'd rather not type, guide me",
    composerPlaceholder: 'Write whatever is on your mind...',
    composerLabel: 'Your message',
    sendBtnLabel: 'Send message',
    typingSrText: 'Taking a moment',
    speakerAssistant: 'Companion',
    speakerUser: 'You',
    pauseOfferLabel: 'Take a slow breath together first',
    dismissSuggestionLabel: 'Dismiss exercise suggestion',
    tryExercisePrefix: 'Try it:',
    charRemainingSuffix: 'characters left',
  },

  errors: {
    generic: "That didn't go through. Your message is still here.",
    rateLimited: 'Lots of people are here right now. You can try again in a minute, or breathe here while you wait.',
    providerUnavailable: "I can't reach the server right now. The exercises still work, and help is always one tap away.",
    offlineBanner: "You're offline. Exercises and help options still work.",
    tryAgainBtn: 'Try again',
    breathingBtn: 'Breathing',
  },

  safety: {
    elevatedNote: 'If things feel heavy, there are people you can talk to.',
    seeSupportBtn: 'See support options',
    crisisHeading: "You don't have to carry this alone. You can talk to a real person right now.",
    crisisReassurance: "I'll keep talking with you here.",
    emergencyPrefix: 'Emergency:',
    callPrefix: 'Call',
  },

  helpSheet: {
    title: 'Support options',
    subtitle: 'Free, confidential people you can reach out to right now.',
    countryLabel: 'Location',
    otherCountryOption: 'Another country',
    otherCountryHeading: 'Find support in your area',
    otherCountryEmergency: 'If you are in immediate danger, please call your local emergency number.',
    otherCountryDirectoryBtn: 'Open findahelpline.com directory',
    emergencySectionLabel: 'Immediate emergency',
    helplinesSectionLabel: 'Support lines',
    lastCheckedPrefix: 'Last checked',
    closeBtn: 'Close',
    offlineNotice: 'Phone numbers work offline from your device.',
  },

  exercises: {
    pickerTitle: 'Quiet exercises',
    pickerSubtitle: 'All exercises stay on your device and work offline.',
    backToChat: 'Back to chat',
    startBtn: 'Begin',
    stopAnytimeBtn: 'Stop anytime',
    skipBtn: 'Skip',
    doneBtn: 'Back to chat',

    cards: {
      breathing: {
        id: 'breathing',
        title: 'Breathing',
        durationLabel: '2 min',
        summary: 'A gentle rhythm to help your shoulders drop.',
      },
      grounding: {
        id: 'grounding',
        title: 'Grounding 5-4-3-2-1',
        durationLabel: '3 min',
        summary: 'Notice five simple things around you right now.',
      },
      brain_dump: {
        id: 'brain_dump',
        title: 'Brain dump',
        durationLabel: '3 min',
        summary: 'Set your thoughts down on paper and sort only what you can influence.',
      },
    },

    breathing: {
      title: 'Breathing',
      intro: 'Choose a pace and length that feels comfortable today.',
      paceLabel: 'Pace',
      paces: {
        gentle: {
          id: 'gentle',
          label: 'Gentle',
          detail: 'In 4s, out 6s',
          inSeconds: 4,
          outSeconds: 6,
        },
        steady: {
          id: 'steady',
          label: 'Steady',
          detail: 'In 4s, out 4s',
          inSeconds: 4,
          outSeconds: 4,
        },
      },
      durationLabel: 'Duration',
      durations: [
        { minutes: 1, label: '1 min' },
        { minutes: 2, label: '2 min' },
        { minutes: 3, label: '3 min' },
      ],
      beginBtn: 'Start breathing',
      breatheIn: 'Breathe in',
      breatheOut: 'Breathe out',
      readyHeading: "Whenever you're ready.",
      checkinPrompt: 'How does things feel right now? (Optional)',
      feelings: {
        lighter: 'Lighter',
        same: 'About the same',
        heavy: 'Still heavy',
      },
      heavyFollowup: 'Thank you for checking in. Would you like to talk through what feels heavy, or see support options?',
      talkAboutItBtn: 'Talk about it',
      supportOptionsBtn: 'Support options',
    },

    grounding: {
      title: '5-4-3-2-1 Grounding',
      subtitle: 'Take your time with each step. There is no rush.',
      optionalNoteLabel: 'Optional note (not saved)',
      optionalNotePlaceholder: 'You can jot a few words here if it helps...',
      nextBtn: 'Continue',
      prevBtn: 'Previous',
      finishBtn: 'Finish',
      steps: [
        {
          count: 5,
          sense: 'See',
          prompt: 'Look around slowly and notice 5 things you can see right now.',
          hint: 'A shadow on the wall, the corner of a table, the texture of fabric.',
        },
        {
          count: 4,
          sense: 'Feel',
          prompt: 'Notice 4 things you can physically feel against your body.',
          hint: 'Your feet on the floor, the weight of your hands, the air on your skin.',
        },
        {
          count: 3,
          sense: 'Hear',
          prompt: 'Listen quietly for 3 sounds in the room or in the distance.',
          hint: 'A fan humming, distant traffic, or the sound of your own breath.',
        },
        {
          count: 2,
          sense: 'Smell',
          prompt: 'Notice 2 scents in the air, or recall two scents you find comforting.',
          hint: 'Rain on warm earth, tea, clean linen, or fresh air.',
        },
        {
          count: 1,
          sense: 'Anchor',
          prompt: 'Notice 1 small thing in this moment that is steady and safe.',
          hint: 'You are here, taking one moment at a time.',
        },
      ],
      closingHeading: "Whenever you're ready.",
      closingBody: 'You took a few quiet moments to come back to the present.',
    },

    brainDump: {
      title: 'Brain dump',
      step1Label: 'Write everything on your mind. It stays on this device.',
      step1Hint: 'Put each worry or task on its own line.',
      step1Placeholder: 'Work deadline tomorrow\nDid I reply to that message\nFeeling tired all week...',
      sortBtn: 'Sort these gently',
      clearBtn: 'Clear this',
      step2Heading: 'For each thought, tap where it belongs right now.',
      step2Sub: 'It is okay to set aside things outside your control.',
      influenceBtn: 'I can influence this',
      notInControlBtn: 'Not in my control',
      continueToPickBtn: 'Continue',
      step3Heading: 'Pick one tiny thing for today',
      step3Sub: 'The rest can wait for later.',
      noInfluenceItemsMsg: 'Everything you listed feels outside your control right now. The kindest step today may simply be resting.',
      restStepOption: 'Rest and let the rest wait for today',
      closingHeading: 'One gentle step is enough.',
      closingPrefix: 'For today, only this:',
      closingLetGo: 'Everything else can rest for now.',
    },
  },
});
