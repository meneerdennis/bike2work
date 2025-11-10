// Local Firebase config override (ignored by git).
// By default this reads environment variables so you can set values in `.env.local`:
// REACT_APP_FIREBASE_API_KEY, REACT_APP_FIREBASE_AUTH_DOMAIN, etc.
// If you prefer literal values for local development, replace the empty strings
// below but ensure this file remains in your local .gitignore.

// NOTE: Do NOT hardcode API keys here. This file will be embedded in the build.
// Instead, use environment variables (REACT_APP_FIREBASE_*) from .env.local or CI/CD.
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY || "",
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || "",
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || "",
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: process.env.REACT_APP_FIREBASE_APP_ID || "",
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID || "",
};

export default firebaseConfig;
