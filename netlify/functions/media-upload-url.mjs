import {
  getSupabase,
  jsonResponse,
  RequestError,
  requireAdmin,
  validateUploadRequest,
} from "./_shared/media.js";

export default async function handler(request) {
  if (request.method !== "POST") {
    return jsonResponse(405, { error: "Method not allowed." });
  }

  try {
    await requireAdmin(request);
    let body;
    try {
      body = await request.json();
    } catch {
      throw new RequestError(400, "Invalid upload request.");
    }

    const path = validateUploadRequest(body);
    const { data, error } = await getSupabase()
      .storage
      .from("scrapbook-media")
      .createSignedUploadUrl(path, { upsert: false });
    if (error) throw error;

    return jsonResponse(200, { path, token: data.token });
  } catch (error) {
    if (!(error instanceof RequestError)) {
      console.error("Could not create a signed media upload URL:", error);
    }
    return jsonResponse(error.status || 500, {
      error: error instanceof RequestError ? error.message : "Could not prepare the image upload.",
    });
  }
}
