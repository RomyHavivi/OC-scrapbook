import { connectAuthEmulator, getAuth } from "firebase/auth";
import { app, firebaseEmulatorsEnabled, firebaseReady } from "./firebase";

let auth;

if (firebaseReady) {
  auth = getAuth(app);
  if (firebaseEmulatorsEnabled) {
    connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
  }
}

export { auth };
