// Firebase initialization.
// Config values come from environment variables (see .env.example).
// With no Firebase settings, the public book uses local sample data. Partial
// settings are reported to the user instead of silently using those samples.

import { initializeApp } from "firebase/app";
import { connectFirestoreEmulator, getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const hasAnyFirebaseConfig = Object.values(firebaseConfig).some(Boolean);
export const firebaseReady = Object.values(firebaseConfig).every(Boolean);
export const firebaseEmulatorsEnabled = import.meta.env.VITE_USE_FIREBASE_EMULATORS === "true";
export const firebaseConfigurationError = hasAnyFirebaseConfig && !firebaseReady
  ? "Firebase configuration is incomplete. Fill in the Firebase web app values in .env."
  : "";

let app, db;

if (firebaseReady) {
  app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  if (firebaseEmulatorsEnabled) {
    connectFirestoreEmulator(db, "127.0.0.1", 8080);
  }
}

export { app, db };

// Firestore rules and the server-verified media functions enforce admin writes.
export const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL || "";
