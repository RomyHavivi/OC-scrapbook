import { useState } from "react";
import { deleteSticker, uploadSticker } from "../../lib/stickersData";

export default function StickerManager({
  stickers,
  placements,
  onStartPlacement,
  onError,
  onNotice,
}) {
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState("");

  async function handleUpload(event) {
    const input = event.currentTarget;
    const file = input.files?.[0];
    if (!file) return;
    setUploading(true);
    onError("");
    onNotice("");
    try {
      await uploadSticker(file);
      onNotice(`Uploaded "${file.name}".`);
    } catch (error) {
      onError(`Could not upload "${file.name}": ${error.message}`);
    } finally {
      setUploading(false);
      input.value = "";
    }
  }

  async function handleDelete(sticker) {
    const placementCount = placements.filter(({ stickerId }) => stickerId === sticker.id).length;
    const detail = placementCount
      ? ` This also removes ${placementCount} placement${placementCount === 1 ? "" : "s"} from the book.`
      : "";
    if (!window.confirm(`Delete "${sticker.name}"?${detail} This cannot be undone.`)) return;

    setDeletingId(sticker.id);
    onError("");
    onNotice("");
    try {
      await deleteSticker(sticker);
      onNotice(`Deleted "${sticker.name}".`);
    } catch (error) {
      onError(`Could not fully delete "${sticker.name}": ${error.message}`);
    } finally {
      setDeletingId("");
    }
  }

  return (
    <section className="admin-card sticker-manager">
      <div className="admin-section-heading">
        <div>
          <h2>Stickers</h2>
          <p className="admin-help">Upload images, then place them on the cover or any page.</p>
        </div>
      </div>
      <label className="sticker-upload">
        Add sticker image
        <input
          type="file"
          accept="image/*"
          disabled={uploading}
          onChange={handleUpload}
        />
      </label>
      {uploading && <p role="status">Uploading sticker...</p>}
      {stickers.length === 0 ? (
        <p>No stickers uploaded yet.</p>
      ) : (
        <ul className="sticker-library">
          {stickers.map((sticker) => (
            <li className="sticker-library__item" key={sticker.id}>
              <img src={sticker.url} alt="" />
              <span className="sticker-library__name" title={sticker.name}>{sticker.name}</span>
              <button
                type="button"
                className="admin-button"
                onClick={() => onStartPlacement(sticker.id)}
              >
                Place
              </button>
              <button
                type="button"
                className="admin-button admin-button--danger"
                disabled={deletingId === sticker.id}
                onClick={() => handleDelete(sticker)}
              >
                {deletingId === sticker.id ? "Deleting..." : "Delete"}
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
