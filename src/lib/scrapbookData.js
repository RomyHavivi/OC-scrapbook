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
import { db } from "./firebase";
import { auth } from "./firebaseAdmin";
import { deleteMedia, uploadMedia } from "./mediaStorage";

const MAX_IMAGE_SIZE = 10 * 1024 * 1024;

function requireFirebase() {
  if (!db || !auth) {
    throw new Error("Firebase is not configured. Add the project settings to .env and restart the app.");
  }
}

async function uploadImage(characterId, file) {
  if (file.size > MAX_IMAGE_SIZE) {
    throw new Error(`"${file.name}" exceeds the 10 MB image limit.`);
  }
  return uploadMedia("characters", characterId, file);
}

async function removeStoredImages(paths) {
  const uniquePaths = [...new Set(paths.filter(Boolean))];
  if (uniquePaths.length === 0) return [];
  try {
    await deleteMedia(uniquePaths);
    return [];
  } catch (error) {
    return [`Could not delete stored images: ${error.message}`];
  }
}

export async function saveCharacter(character, previousCharacter) {
  requireFirebase();
  const id = character.id || doc(collection(db, "characters")).id;
  const uploadedPaths = [];

  try {
    let heroImage = {
      url: character.heroImageUrl || "",
      storagePath: character.heroImagePath || "",
    };
    if (character.heroImageFile) {
      heroImage = await uploadImage(id, character.heroImageFile);
      uploadedPaths.push(heroImage.storagePath);
    }

    const images = [];
    for (const image of character.images || []) {
      let uploaded = { url: image.url || "", storagePath: image.storagePath || "" };
      if (image.file) {
        uploaded = await uploadImage(id, image.file);
        uploadedPaths.push(uploaded.storagePath);
      }
      images.push({
        id: image.id || crypto.randomUUID(),
        ...uploaded,
        alt: image.alt || "",
        side: image.side === "left" ? "left" : "right",
      });
    }

    const data = {
      name: character.name.trim(),
      description: character.description,
      worldId: character.worldId || null,
      heroImageUrl: heroImage.url,
      heroImagePath: heroImage.storagePath,
      images,
      notes: (character.notes || []).map((note) => ({
        id: note.id || crypto.randomUUID(),
        text: note.text.trim(),
        side: note.side === "left" ? "left" : "right",
        verticalPosition: ["top", "middle", "bottom"].includes(note.verticalPosition)
          ? note.verticalPosition
          : "bottom",
        horizontalPosition: ["left", "center", "right"].includes(note.horizontalPosition)
          ? note.horizontalPosition
          : "right",
      })).filter((note) => note.text),
      order: character.order,
      updatedAt: new Date().toISOString(),
    };

    const previousPaths = [
      previousCharacter?.heroImagePath,
      ...(previousCharacter?.images || []).map((image) => image.storagePath),
    ];
    const retainedPaths = new Set([
      data.heroImagePath,
      ...data.images.map((image) => image.storagePath),
    ]);
    await setDoc(doc(db, "characters", id), data);
    return {
      id,
      character: { id, ...data },
      cleanupWarnings: await removeStoredImages(
        previousPaths.filter((path) => path && !retainedPaths.has(path)),
      ),
    };
  } catch (error) {
    const cleanupWarnings = await removeStoredImages(uploadedPaths);
    if (cleanupWarnings.length) {
      throw new Error(`${error.message} ${cleanupWarnings.join(" ")}`);
    }
    throw error;
  }
}

export async function deleteCharacter(character) {
  requireFirebase();
  await deleteDoc(doc(db, "characters", character.id));
  return removeStoredImages([
    character.heroImagePath,
    ...(character.images || []).map((image) => image.storagePath),
  ]);
}

export async function reorderCharacters(characters) {
  requireFirebase();
  const batch = writeBatch(db);
  characters.forEach((character, index) => {
    batch.update(doc(db, "characters", character.id), { order: index + 1 });
  });
  await batch.commit();
}

export async function saveWorld(world) {
  requireFirebase();
  const refForWorld = world.id
    ? doc(db, "worlds", world.id)
    : doc(collection(db, "worlds"));
  await setDoc(refForWorld, {
    name: world.name.trim(),
    color: world.color,
  });
}

export async function deleteWorld(worldId) {
  requireFirebase();
  const assignedCharacters = await getDocs(query(
    collection(db, "characters"),
    where("worldId", "==", worldId),
  ));
  if (!assignedCharacters.empty) {
    throw new Error("Move this world's characters to another world before deleting it.");
  }
  await deleteDoc(doc(db, "worlds", worldId));
}
