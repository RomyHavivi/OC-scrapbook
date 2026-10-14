import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  setDoc,
  where,
  writeBatch,
} from "firebase/firestore";
import {
  deleteObject,
  getDownloadURL,
  ref,
  uploadBytes,
} from "firebase/storage";
import { db } from "./firebase";
import { storage } from "./firebaseAdmin";

const MAX_STICKER_SIZE = 10 * 1024 * 1024;

function requireFirebase() {
  if (!db || !storage) {
    throw new Error("Firebase is not configured. Add the project settings to .env and restart the app.");
  }
}

export async function uploadSticker(file) {
  requireFirebase();
  if (!file.type.startsWith("image/") || file.size === 0) {
    throw new Error(`"${file.name}" is not an image file.`);
  }
  if (file.size > MAX_STICKER_SIZE) {
    throw new Error(`"${file.name}" exceeds the 10 MB image limit.`);
  }

  const stickerRef = doc(collection(db, "stickers"));
  const extension = file.name.match(/\.[a-zA-Z0-9]+$/)?.[0] || "";
  const storagePath = `stickers/${stickerRef.id}/${crypto.randomUUID()}${extension}`;
  const imageRef = ref(storage, storagePath);
  await uploadBytes(imageRef, file, { contentType: file.type });

  try {
    const url = await getDownloadURL(imageRef);
    const sticker = {
      name: file.name,
      url,
      storagePath,
      createdAt: new Date().toISOString(),
    };
    await setDoc(stickerRef, sticker);
    return { id: stickerRef.id, ...sticker };
  } catch (error) {
    try {
      await deleteObject(imageRef);
    } catch (cleanupError) {
      throw new Error(`Could not save the sticker (${error.message}) or clean up its upload (${cleanupError.message}).`);
    }
    throw error;
  }
}

export async function saveStickerPlacement(placement) {
  requireFirebase();
  const data = {
    stickerId: placement.stickerId,
    pageId: placement.pageId,
    x: Math.min(0.77, Math.max(0, placement.x)),
    y: Math.min(0.68, Math.max(0, placement.y)),
    updatedAt: new Date().toISOString(),
  };
  const placementRef = placement.id
    ? doc(db, "stickerPlacements", placement.id)
    : doc(collection(db, "stickerPlacements"));
  await setDoc(placementRef, data);
  return { id: placementRef.id, ...data };
}

export async function deleteStickerPlacement(placementId) {
  requireFirebase();
  await deleteDoc(doc(db, "stickerPlacements", placementId));
}

export async function deleteSticker(sticker) {
  requireFirebase();
  const placements = await getDocs(query(
    collection(db, "stickerPlacements"),
    where("stickerId", "==", sticker.id),
  ));
  const placementDocs = placements.docs;

  for (let index = 0; index < placementDocs.length; index += 499) {
    const batch = writeBatch(db);
    placementDocs.slice(index, index + 499).forEach((placement) => batch.delete(placement.ref));
    await batch.commit();
  }

  try {
    await deleteObject(ref(storage, sticker.storagePath));
  } catch (error) {
    if (error.code !== "storage/object-not-found") {
      throw new Error(`Sticker placements were removed, but its uploaded file could not be deleted: ${error.message}`);
    }
  }
  await deleteDoc(doc(db, "stickers", sticker.id));
}
