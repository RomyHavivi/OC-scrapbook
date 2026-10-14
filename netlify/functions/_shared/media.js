import { createClient } from "@supabase/supabase-js";
import { createRemoteJWKSet, jwtVerify } from "jose";

const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
const FIREBASE_JWKS = createRemoteJWKSet(
  new URL("https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com"),
);
const SAFE_STORAGE_PATH = /^(characters|stickers)\/[A-Za-z0-9_-]{1,128}\/[A-Za-z0-9_-][A-Za-z0-9._-]{0,127}$/;

let supabase;

export class RequestError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export function jsonResponse(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

export async function requireAdmin(request) {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const adminEmail = process.env.FIREBASE_ADMIN_EMAIL?.trim().toLowerCase();
  if (!projectId || !adminEmail) {
    throw new RequestError(500, "Media service is not configured.");
  }

  const authorization = request.headers.get("authorization") || "";
  const token = authorization.match(/^Bearer (.+)$/)?.[1];
  if (!token) throw new RequestError(401, "Sign in as an administrator to manage images.");

  try {
    const { payload } = await jwtVerify(token, FIREBASE_JWKS, {
      algorithms: ["RS256"],
      audience: projectId,
      issuer: `https://securetoken.google.com/${projectId}`,
      requiredClaims: ["exp", "iat", "sub", "auth_time", "email"],
    });
    if (payload.email?.toLowerCase() !== adminEmail) {
      throw new RequestError(403, "Only the configured administrator can manage images.");
    }
  } catch (error) {
    if (error instanceof RequestError) throw error;
    throw new RequestError(401, "Your sign-in expired. Please sign in again.");
  }
}

export function getSupabase() {
  if (supabase) return supabase;
  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    throw new RequestError(500, "Media service is not configured.");
  }
  supabase = createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return supabase;
}

export function validateUploadRequest(data) {
  if (!["characters", "stickers"].includes(data?.kind)) {
    throw new RequestError(400, "Choose a valid image type.");
  }
  if (typeof data.ownerId !== "string" || !/^[A-Za-z0-9_-]{1,128}$/.test(data.ownerId)) {
    throw new RequestError(400, "The image owner is invalid.");
  }
  if (typeof data.filename !== "string" || data.filename.length > 255) {
    throw new RequestError(400, "The image filename is invalid.");
  }
  if (typeof data.contentType !== "string" || !data.contentType.startsWith("image/")) {
    throw new RequestError(400, "Only image files can be uploaded.");
  }
  if (!Number.isInteger(data.size) || data.size <= 0 || data.size > MAX_IMAGE_SIZE) {
    throw new RequestError(400, "Images must be no larger than 10 MB.");
  }

  const extension = data.filename.match(/\.([A-Za-z0-9]{1,10})$/)?.[1]?.toLowerCase() || "img";
  return `${data.kind}/${data.ownerId}/${crypto.randomUUID()}.${extension}`;
}

export function validateStoragePaths(paths) {
  if (!Array.isArray(paths) || paths.length > 100) {
    throw new RequestError(400, "Provide no more than 100 image paths.");
  }
  if (paths.some((path) => typeof path !== "string" || !SAFE_STORAGE_PATH.test(path))) {
    throw new RequestError(400, "One or more image paths are invalid.");
  }
  return [...new Set(paths)];
}
