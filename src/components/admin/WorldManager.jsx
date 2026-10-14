import { useState } from "react";
import { deleteWorld, saveWorld } from "../../lib/scrapbookData";

const DEFAULT_COLOR = "#8a4b2c";

export default function WorldManager({ worlds, characters, onError }) {
  const [editingId, setEditingId] = useState(null);
  const [name, setName] = useState("");
  const [color, setColor] = useState(DEFAULT_COLOR);
  const [saving, setSaving] = useState(false);
  const [localError, setLocalError] = useState("");
  const [saved, setSaved] = useState(false);

  function editWorld(world) {
    setEditingId(world.id);
    setName(world.name);
    setColor(world.color || world.colorTag || DEFAULT_COLOR);
    setLocalError("");
    setSaved(false);
  }

  function reset() {
    setEditingId(null);
    setName("");
    setColor(DEFAULT_COLOR);
    setLocalError("");
    setSaved(false);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setLocalError("");
    setSaved(false);
    setSaving(true);
    try {
      await saveWorld({ id: editingId, name, color });
      setSaved(true);
      setEditingId(null);
      setName("");
      setColor(DEFAULT_COLOR);
    } catch (error) {
      setLocalError(`Could not save world: ${error.message}`);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(world) {
    if (!window.confirm(`Delete the world "${world.name}"?`)) return;
    onError("");
    try {
      await deleteWorld(world.id);
      if (editingId === world.id) reset();
    } catch (error) {
      onError(`Could not delete "${world.name}": ${error.message}`);
    }
  }

  return (
    <section className="admin-card">
      <h2>Worlds</h2>
      <p className="admin-help">World tags group characters in the book's contents.</p>
      <ul className="admin-world-list">
        {worlds.map((world) => {
          const characterCount = characters.filter((character) => character.worldId === world.id).length;
          return (
            <li key={world.id}>
              <span className="admin-world-swatch" style={{ backgroundColor: world.color || world.colorTag || DEFAULT_COLOR }} />
              <span className="admin-world-name">
                <strong>{world.name}</strong>
                <small>{characterCount} {characterCount === 1 ? "character" : "characters"}</small>
              </span>
              <button type="button" className="admin-button admin-button--quiet" onClick={() => editWorld(world)}>
                Edit
              </button>
              <button type="button" className="admin-button admin-button--danger" onClick={() => handleDelete(world)}>
                Delete
              </button>
            </li>
          );
        })}
      </ul>

      <form className="admin-editor admin-world-editor" onSubmit={handleSubmit}>
        <h3>{editingId ? "Edit world" : "Add world"}</h3>
        <label>
          World name
          <input
            required
            maxLength={80}
            value={name}
            onChange={(event) => {
              setName(event.target.value);
              setSaved(false);
            }}
          />
        </label>
        <label>
          Tag color
          <span className="admin-color-input">
            <input
              type="color"
              value={color}
              onChange={(event) => {
                setColor(event.target.value);
                setSaved(false);
              }}
            />
            <span>{color}</span>
          </span>
        </label>
        {localError && <p className="admin-message admin-message--error" role="alert">{localError}</p>}
        {saved && <p className="admin-message admin-message--success" role="status">World saved and published.</p>}
        <div className="admin-form-actions">
          <button className="admin-button" type="submit" disabled={saving}>
            {saving ? "Saving..." : editingId ? "Save world" : "Add world"}
          </button>
          {editingId && (
            <button className="admin-button admin-button--quiet" type="button" onClick={reset}>Cancel</button>
          )}
        </div>
      </form>
    </section>
  );
}
