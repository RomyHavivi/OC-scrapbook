import { createClient } from "@supabase/supabase-js";
import { auth } from "./firebaseAdmin";

const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
const BUCKET = "scrapbook-media";

let supabase;

function getSupabase() {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error("Supabase image storage is not configured. Set the public Supabase URL and anon key in the app environment.");
  }
  if (!supabase) {
    supabase = createClient(url, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    });
  }
  return supabase;
}

async function callMediaFunction(functionName, body) {
  if (!auth?.currentUser) {
    throw new Error("Sign in as an administrator before managing images.");
  }

  const token = await auth.currentUser.getIdToken();
  const response = await fetch(`/.netlify/functions/${functionName}`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${token}`,
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
  });

  let result;
  try {
    result = await response.json();
  } catch {
    throw new Error(`The image service returned an invalid response (${response.status}).`);
  }
  if (!response.ok) {
    throw new Error(result.error || `The image service failed (${response.status}).`);
  }
  return result;
}

export async function uploadMedia(kind, ownerId, file) {
  if (!file.type.startsWith("image/") || file.size === 0) {
    throw new Error(`"${file.name}" is not a valid image file.`);
  }
  if (file.size > MAX_IMAGE_SIZE) {
    throw new Error(`"${file.name}" exceeds the 10 MB image limit.`);
  }

  const { path, token } = await callMediaFunction("media-upload-url", {
    kind,
    ownerId,
    filename: file.name,
    contentType: file.type,
    size: file.size,
  });
  const { error } = await getSupabase()
    .storage
    .from(BUCKET)
    .uploadToSignedUrl(path, token, file, { contentType: file.type, upsert: false });
  if (error) {
    try {
      await deleteMedia([path]);
    } catch (cleanupError) {
      throw new Error(`Could not upload "${file.name}" (${error.message}) or clean up the partial upload (${cleanupError.message}).`);
    }
    throw new Error(`Could not upload "${file.name}": ${error.message}`);
  }

  const { data } = getSupabase().storage.from(BUCKET).getPublicUrl(path);
  return { url: data.publicUrl, storagePath: path };
}

export async function deleteMedia(paths) {
  const uniquePaths = [...new Set(paths.filter(Boolean))];
  for (let index = 0; index < uniquePaths.length; index += 100) {
    await callMediaFunction("media-delete", {
      paths: uniquePaths.slice(index, index + 100),
    });
  }
}
