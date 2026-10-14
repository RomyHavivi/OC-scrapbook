import {
  getSupabase,
  jsonResponse,
  RequestError,
  requireAdmin,
  validateStoragePaths,
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
      throw new RequestError(400, "Invalid image deletion request.");
    }

    const paths = validateStoragePaths(body?.paths);
    if (paths.length === 0) return jsonResponse(200, { deleted: [] });

    const { data, error } = await getSupabase()
      .storage
      .from("scrapbook-media")
      .remove(paths);
    if (error) throw error;

    return jsonResponse(200, { deleted: data.map(({ name }) => name) });
  } catch (error) {
    if (!(error instanceof RequestError)) {
      console.error("Could not delete scrapbook media:", error);
    }
    return jsonResponse(error.status || 500, {
      error: error instanceof RequestError ? error.message : "Could not delete the stored images.",
    });
  }
}
