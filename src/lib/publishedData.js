import { collection, onSnapshot, query } from "firebase/firestore";
import { db } from "./firebase";

function requireFirestore() {
  if (!db) {
    throw new Error("Firebase is not configured. Add the project settings to .env and restart the app.");
  }
}

export function subscribeToCharacters(onData, onError) {
  requireFirestore();
  return onSnapshot(
    query(collection(db, "characters")),
    (snapshot) => onData(snapshot.docs
      .map((entry) => {
        const data = entry.data();
        return {
          id: entry.id,
          ...data,
          heroImageUrl: data.heroImageUrl || data.heroImage?.url || "",
          heroImagePath: data.heroImagePath || data.heroImage?.storagePath || "",
        };
      })
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))),
    onError,
  );
}

export function subscribeToWorlds(onData, onError) {
  requireFirestore();
  return onSnapshot(
    collection(db, "worlds"),
    (snapshot) => onData(snapshot.docs.map((entry) => {
      const data = entry.data();
      return { id: entry.id, ...data, color: data.color || data.colorTag || "" };
    })),
    onError,
  );
}

export function subscribeToStickers(onData, onError) {
  requireFirestore();
  return onSnapshot(
    collection(db, "stickers"),
    (snapshot) => onData(snapshot.docs.map((entry) => ({
      id: entry.id,
      ...entry.data(),
    }))),
    onError,
  );
}

export function subscribeToStickerPlacements(onData, onError) {
  requireFirestore();
  return onSnapshot(
    collection(db, "stickerPlacements"),
    (snapshot) => onData(snapshot.docs.map((entry) => ({
      id: entry.id,
      ...entry.data(),
    }))),
    onError,
  );
}
