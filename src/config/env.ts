export const ENV = {
  apiBaseUrl:
    import.meta.env.VITE_API_BASE_URL || 'https://api.mateeazy.in',
  googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
  playStoreUrl:
    'https://play.google.com/store/apps/details?id=com.mateeazy.app',
  siteHost: 'mateeazy.in',
  // Firebase Web Config — set via .env.local locally or GitHub Secrets in CI
  firebase: {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
    authDomain:
      import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ||
      'mateeazy-98b16.firebaseapp.com',
    projectId:
      import.meta.env.VITE_FIREBASE_PROJECT_ID || 'mateeazy-98b16',
    storageBucket:
      import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ||
      'mateeazy-98b16.firebasestorage.app',
    messagingSenderId:
      import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '96144317653',
    appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
    measurementId:
      import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || 'G-V1M3M8RRW8',
  },
} as const;
