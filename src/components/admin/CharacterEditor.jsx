import { useState } from "react";
import { saveCharacter } from "../../lib/scrapbookData";

function normalizedCharacter(character) {
  return {
    ...character,
    worldId: character.worldId || "",
    heroImageUrl: character.heroImageUrl || character.heroImage?.url || "",
    heroImagePath: character.heroImagePath || character.heroImage?.storagePath || "",
    images: (character.images || []).map((image) => ({
      ...image,
      side: image.side === "left" ? "left" : "right",
    })),
    notes: (character.notes || []).map((note) => ({
      ...note,
      side: note.side === "left" ? "left" : "right",
      verticalPosition: ["top", "middle", "bottom"].includes(note.verticalPosition)
        ? note.verticalPosition
        : "bottom",
      horizontalPosition: ["left", "center", "right"].includes(note.horizontalPosition)
        ? note.horizontalPosition
        : "right",
    })),
  };
}

function moveItem(items, index, direction) {
  const target = index + direction;
  if (target < 0 || target >= items.length) return items;
  const next = [...items];
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}

function SideSelect({ value, onChange, label }) {
  return (
    <label>
      {label}
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        <option value="left">Left page</option>
        <option value="right">Right page</option>
      </select>
    </label>
  );
}

export default function CharacterEditor({
  character,
  worlds,
  previousCharacter,
  onCancel,
  onSaved,
}) {
  const [form, setForm] = useState(() => normalizedCharacter(character));
  const [heroImageFile, setHeroImageFile] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
    setSaved(false);
  }

  function updateImage(index, field, value) {
    setForm((current) => ({
      ...current,
      images: current.images.map((image, imageIndex) => (
        imageIndex === index ? { ...image, [field]: value } : image
      )),
    }));
    setSaved(false);
  }

  function addImages(event) {
    const added = [...event.target.files].map((file) => ({
      id: crypto.randomUUID(),
      file,
      url: "",
      alt: "",
      side: "right",
    }));
    setForm((current) => ({ ...current, images: [...current.images, ...added] }));
    event.target.value = "";
  }

  function updateNote(index, field, value) {
    setForm((current) => ({
      ...current,
      notes: current.notes.map((note, noteIndex) => (
        noteIndex === index ? { ...note, [field]: value } : note
      )),
    }));
    setSaved(false);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSaved(false);
    setIsSaving(true);
    try {
      const result = await saveCharacter(
        { ...form, heroImageFile, order: form.order || 1 },
        previousCharacter,
      );
      setForm(normalizedCharacter(result.character));
      setHeroImageFile(null);
      setSaved(true);
      onSaved(
        result.id,
        result.cleanupWarnings.length
          ? `Saved, but ${result.cleanupWarnings.join(" ")}`
          : "",
      );
    } catch (saveError) {
      setError(`Could not save ${form.name || "character"}: ${saveError.message}`);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form className="admin-editor" onSubmit={handleSubmit}>
      <h3>{character.id ? "Edit character" : "New character"}</h3>
      <label>
        Name
        <input
          required
          maxLength={100}
          value={form.name}
          onChange={(event) => updateField("name", event.target.value)}
        />
      </label>
      <label>
        Biography
        <textarea
          rows={8}
          value={form.description}
          onChange={(event) => updateField("description", event.target.value)}
        />
      </label>
      <label>
        World
        <select value={form.worldId} onChange={(event) => updateField("worldId", event.target.value)}>
          <option value="">No world</option>
          {worlds.map((world) => <option key={world.id} value={world.id}>{world.name}</option>)}
        </select>
      </label>

      <fieldset className="admin-fieldset">
        <legend>Featured portrait</legend>
        {form.heroImageUrl && !heroImageFile && (
          <img className="admin-image-preview" src={form.heroImageUrl} alt={`Current portrait of ${form.name}`} />
        )}
        {heroImageFile && <p className="admin-file-name">{heroImageFile.name}</p>}
        <label>
          Upload or replace portrait
          <input
            type="file"
            accept="image/*"
            onChange={(event) => {
              setHeroImageFile(event.target.files?.[0] || null);
              setSaved(false);
            }}
          />
        </label>
        {(form.heroImageUrl || heroImageFile) && (
          <button
            type="button"
            className="admin-button admin-button--quiet"
            onClick={() => {
              updateField("heroImageUrl", "");
              updateField("heroImagePath", "");
              setHeroImageFile(null);
            }}
          >
            Remove portrait
          </button>
        )}
      </fieldset>

      <fieldset className="admin-fieldset">
        <legend>Extra photos</legend>
        <label>
          Add photos
          <input type="file" accept="image/*" multiple onChange={addImages} />
        </label>
        {form.images.map((image, index) => (
          <div className="admin-object-row" key={image.id || index}>
            <div className="admin-object-info">
              {image.url && <img className="admin-object-preview" src={image.url} alt="" />}
              {image.file && <span>{image.file.name}</span>}
              <label>
                Image description
                <input
                  value={image.alt || ""}
                  maxLength={200}
                  onChange={(event) => updateImage(index, "alt", event.target.value)}
                  placeholder="Describe the photo"
                />
              </label>
              <SideSelect
                label="Page"
                value={image.side}
                onChange={(value) => updateImage(index, "side", value)}
              />
            </div>
            <div className="admin-object-actions">
              <button type="button" aria-label="Move photo up" disabled={index === 0} onClick={() => {
                updateField("images", moveItem(form.images, index, -1));
              }}>↑</button>
              <button type="button" aria-label="Move photo down" disabled={index === form.images.length - 1} onClick={() => {
                updateField("images", moveItem(form.images, index, 1));
              }}>↓</button>
              <button
                type="button"
                className="admin-button admin-button--danger"
                onClick={() => updateField("images", form.images.filter((_, imageIndex) => imageIndex !== index))}
              >Remove</button>
            </div>
          </div>
        ))}
      </fieldset>

      <fieldset className="admin-fieldset">
        <legend>Notes</legend>
        <p className="admin-help">
          Notes float over their page. Choose an anchor that does not cover important text or another note.
        </p>
        {form.notes.map((note, index) => (
          <div className="admin-object-row" key={note.id || index}>
            <div className="admin-object-info">
              <label>
                Note text
                <textarea
                  rows={3}
                  maxLength={1000}
                  value={note.text}
                  onChange={(event) => updateNote(index, "text", event.target.value)}
                />
              </label>
              <SideSelect
                label="Page"
                value={note.side}
                onChange={(value) => updateNote(index, "side", value)}
              />
              <div className="admin-note-position-controls">
                <label>
                  Vertical position
                  <select
                    value={note.verticalPosition}
                    onChange={(event) => updateNote(index, "verticalPosition", event.target.value)}
                  >
                    <option value="top">Top</option>
                    <option value="middle">Middle</option>
                    <option value="bottom">Bottom</option>
                  </select>
                </label>
                <label>
                  Horizontal position
                  <select
                    value={note.horizontalPosition}
                    onChange={(event) => updateNote(index, "horizontalPosition", event.target.value)}
                  >
                    <option value="left">Left</option>
                    <option value="center">Center</option>
                    <option value="right">Right</option>
                  </select>
                </label>
              </div>
            </div>
            <div className="admin-object-actions">
              <button type="button" aria-label="Move note up" disabled={index === 0} onClick={() => {
                updateField("notes", moveItem(form.notes, index, -1));
              }}>↑</button>
              <button type="button" aria-label="Move note down" disabled={index === form.notes.length - 1} onClick={() => {
                updateField("notes", moveItem(form.notes, index, 1));
              }}>↓</button>
              <button
                type="button"
                className="admin-button admin-button--danger"
                onClick={() => updateField("notes", form.notes.filter((_, noteIndex) => noteIndex !== index))}
              >Remove</button>
            </div>
          </div>
        ))}
        <button
          type="button"
          className="admin-button admin-button--quiet"
          onClick={() => updateField("notes", [...form.notes, {
            id: crypto.randomUUID(),
            text: "",
            side: "right",
            verticalPosition: "bottom",
            horizontalPosition: "right",
          }])}
        >
          Add note
        </button>
      </fieldset>

      {error && <p className="admin-message admin-message--error" role="alert">{error}</p>}
      {saved && <p className="admin-message admin-message--success" role="status">Saved and published.</p>}
      <div className="admin-form-actions">
        <button type="submit" className="admin-button" disabled={isSaving}>
          {isSaving ? "Saving..." : "Save character"}
        </button>
        <button type="button" className="admin-button admin-button--quiet" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
}
