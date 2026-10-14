import { connectAuthEmulator, getAuth } from "firebase/auth";
import { connectStorageEmulator, getStorage } from "firebase/storage";
import { app, firebaseEmulatorsEnabled, firebaseReady } from "./firebase";

let auth, storage;

if (firebaseReady) {
  auth = getAuth(app);
  storage = getStorage(app);
  if (firebaseEmulatorsEnabled) {
    connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
    connectStorageEmulator(storage, "127.0.0.1", 9199);
  }
}

export { auth, storage };
