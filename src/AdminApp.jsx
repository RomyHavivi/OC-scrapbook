import { useEffect, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { Link } from "react-router-dom";
import AdminLogin from "./components/admin/AdminLogin";
import CharacterEditor from "./components/admin/CharacterEditor";
import StickerManager from "./components/admin/StickerManager";
import WorldManager from "./components/admin/WorldManager";
import BookContainer from "./components/book/BookContainer";
import { firebaseConfigurationError, firebaseReady } from "./lib/firebase";
import { auth } from "./lib/firebaseAdmin";
import {
  subscribeToCharacters,
  subscribeToStickerPlacements,
  subscribeToStickers,
  subscribeToWorlds,
} from "./lib/publishedData";
import {
  deleteCharacter,
  reorderCharacters,
} from "./lib/scrapbookData";
import {
  deleteStickerPlacement,
  saveStickerPlacement,
} from "./lib/stickersData";

export default function AdminApp() {
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [characters, setCharacters] = useState([]);
  const [worlds, setWorlds] = useState([]);
  const [stickers, setStickers] = useState([]);
  const [stickerPlacements, setStickerPlacements] = useState([]);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [loadError, setLoadError] = useState(firebaseConfigurationError);
  const [actionError, setActionError] = useState("");
  const [actionNotice, setActionNotice] = useState("");
  const [selectedCharacterId, setSelectedCharacterId] = useState(null);
  const [creatingCharacter, setCreatingCharacter] = useState(false);
  const [placingStickers, setPlacingStickers] = useState(false);
  const [selectedStickerId, setSelectedStickerId] = useState("");

  useEffect(() => {
    if (!firebaseReady) {
      setAuthChecked(true);
      return undefined;
    }
    return onAuthStateChanged(
      auth,
      (nextUser) => {
        setUser(nextUser);
        setAuthChecked(true);
      },
      (error) => {
        setLoadError(`Could not check the admin sign-in state: ${error.message}`);
        setAuthChecked(true);
      },
    );
  }, []);

  useEffect(() => {
    if (!user) {
      setDataLoaded(false);
      return undefined;
    }

    let characterLoaded = false;
    let worldLoaded = false;
    let stickersLoaded = false;
    let stickerPlacementsLoaded = false;
    const handleLoadError = (error) => {
      setLoadError(`Could not load scrapbook data: ${error.message}`);
    };
    const updateLoaded = () => {
      if (characterLoaded && worldLoaded && stickersLoaded && stickerPlacementsLoaded) {
        setDataLoaded(true);
      }
    };

    const unsubscribeCharacters = subscribeToCharacters((data) => {
      setCharacters(data);
      characterLoaded = true;
      updateLoaded();
    }, handleLoadError);
    const unsubscribeWorlds = subscribeToWorlds((data) => {
      setWorlds(data);
      worldLoaded = true;
      updateLoaded();
    }, handleLoadError);
    const unsubscribeStickers = subscribeToStickers((data) => {
      setStickers(data);
      stickersLoaded = true;
      updateLoaded();
    }, handleLoadError);
    const unsubscribeStickerPlacements = subscribeToStickerPlacements((data) => {
      setStickerPlacements(data);
      stickerPlacementsLoaded = true;
      updateLoaded();
    }, handleLoadError);

    return () => {
      unsubscribeCharacters();
      unsubscribeWorlds();
      unsubscribeStickers();
      unsubscribeStickerPlacements();
    };
  }, [user]);

  async function handleDeleteCharacter(character) {
    if (!window.confirm(`Delete ${character.name}? This cannot be undone.`)) return;
    setActionError("");
    setActionNotice("");
    try {
      const cleanupWarnings = await deleteCharacter(character);
      if (selectedCharacterId === character.id) setSelectedCharacterId(null);
      if (cleanupWarnings.length) {
        setActionError(`Character deleted, but ${cleanupWarnings.join(" ")}`);
      }
    } catch (error) {
      setActionError(`Could not delete ${character.name}: ${error.message}`);
    }
  }

  async function moveCharacter(index, direction) {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= characters.length) return;
    const reordered = [...characters];
    [reordered[index], reordered[targetIndex]] = [reordered[targetIndex], reordered[index]];
    setActionError("");
    setActionNotice("");
    try {
      await reorderCharacters(reordered);
    } catch (error) {
      setActionError(`Could not save the character order: ${error.message}`);
    }
  }

  async function handleSignOut() {
    setActionError("");
    setActionNotice("");
    try {
      await signOut(auth);
      setSelectedCharacterId(null);
      setCreatingCharacter(false);
    } catch (error) {
      setActionError(`Could not sign out: ${error.message}`);
    }
  }

  async function handlePlaceSticker(placement) {
    setActionError("");
    setActionNotice("");
    try {
      await saveStickerPlacement(placement);
      setActionNotice("Sticker placed on the page.");
    } catch (error) {
      setActionError(`Could not place the sticker: ${error.message}`);
    }
  }

  async function handleMoveSticker(placement) {
    setActionError("");
    setActionNotice("");
    try {
      await saveStickerPlacement(placement);
      setActionNotice("Sticker position saved.");
    } catch (error) {
      setActionError(`Could not save the sticker position: ${error.message}`);
    }
  }

  async function handleDeleteStickerPlacement(placementId) {
    setActionError("");
    setActionNotice("");
    try {
      await deleteStickerPlacement(placementId);
      setActionNotice("Sticker removed from the page.");
    } catch (error) {
      setActionError(`Could not remove the sticker: ${error.message}`);
    }
  }

  if (!authChecked) {
    return (
      <main className="admin-shell">
        <Link className="admin-button admin-button--quiet admin-return-link" to="/">View book</Link>
        <p>Checking administrator access...</p>
      </main>
    );
  }
  if (!user) {
    return (
      <main className="admin-shell">
        <Link className="admin-button admin-button--quiet admin-return-link" to="/">View book</Link>
        {loadError && <p className="admin-message admin-message--error" role="alert">{loadError}</p>}
        <AdminLogin onSuccess={() => setLoadError("")} />
      </main>
    );
  }
  if (!dataLoaded && !loadError) {
    return (
      <main className="admin-shell">
        <Link className="admin-button admin-button--quiet admin-return-link" to="/">View book</Link>
        <p>Loading scrapbook data...</p>
      </main>
    );
  }

  const selectedCharacter = characters.find(({ id }) => id === selectedCharacterId);
  const initialCharacter = creatingCharacter
    ? { name: "", description: "", worldId: "", heroImageUrl: "", images: [], notes: [], order: characters.length + 1 }
    : selectedCharacter;

  if (placingStickers) {
    return (
      <main className="sticker-placement-shell">
        <header className="sticker-placement-header">
          <div>
            <h1>Place stickers</h1>
            <p>Select a sticker, click a page to place it, or drag an existing one to move it.</p>
          </div>
          <div className="sticker-placement-actions">
            <Link className="admin-button admin-button--quiet" to="/">Done</Link>
            <button
              type="button"
              className="admin-button"
              onClick={() => setPlacingStickers(false)}
            >
              Back to admin
            </button>
          </div>
        </header>
        {actionError && <p className="admin-message admin-message--error" role="alert">{actionError}</p>}
        {actionNotice && <p className="admin-message admin-message--success" role="status">{actionNotice}</p>}
        <div className="sticker-placement-library" aria-label="Choose a sticker">
          {stickers.map((sticker) => (
            <button
              type="button"
              key={sticker.id}
              className="sticker-placement-choice"
              aria-pressed={selectedStickerId === sticker.id}
              onClick={() => setSelectedStickerId(sticker.id)}
            >
              <img src={sticker.url} alt="" />
              <span>{sticker.name}</span>
            </button>
          ))}
        </div>
        <div className="book-stage book-stage--placement">
          <BookContainer
            characters={characters}
            worlds={worlds}
            stickers={stickers}
            stickerPlacements={stickerPlacements}
            placementMode
            selectedStickerId={selectedStickerId}
            onPlaceSticker={handlePlaceSticker}
            onMoveSticker={handleMoveSticker}
            onDeletePlacement={handleDeleteStickerPlacement}
          />
        </div>
      </main>
    );
  }

  return (
    <main className="admin-shell">
      <header className="admin-header">
        <div>
          <h1>Scrapbook admin</h1>
          <p>Changes publish to the book as soon as they are saved.</p>
        </div>
        <div className="admin-header-actions">
          <Link className="admin-button admin-button--quiet" to="/">View book</Link>
          <button type="button" className="admin-button admin-button--quiet" onClick={handleSignOut}>
            Log out
          </button>
        </div>
      </header>

      {loadError && <p className="admin-message admin-message--error" role="alert">{loadError}</p>}
      {actionError && <p className="admin-message admin-message--error" role="alert">{actionError}</p>}
      {actionNotice && <p className="admin-message admin-message--success" role="status">{actionNotice}</p>}

      <div className="admin-layout">
        <section className="admin-card">
          <div className="admin-section-heading">
            <h2>Characters</h2>
            <button
              type="button"
              className="admin-button"
              onClick={() => {
                setActionError("");
                setActionNotice("");
                setSelectedCharacterId(null);
                setCreatingCharacter(true);
              }}
            >
              Add character
            </button>
          </div>
          {characters.length === 0 && <p>No characters yet. Add one to publish it in the book.</p>}
          <ol className="admin-record-list">
            {characters.map((character, index) => (
              <li key={character.id}>
                <span className="admin-reorder-controls">
                  <button
                    type="button"
                    aria-label={`Move ${character.name} up`}
                    disabled={index === 0}
                    onClick={() => moveCharacter(index, -1)}
                  >↑</button>
                  <button
                    type="button"
                    aria-label={`Move ${character.name} down`}
                    disabled={index === characters.length - 1}
                    onClick={() => moveCharacter(index, 1)}
                  >↓</button>
                </span>
                <button
                  type="button"
                  className="admin-record-select"
                  aria-current={selectedCharacterId === character.id ? "true" : undefined}
                  onClick={() => {
                    setActionError("");
                    setActionNotice("");
                    setCreatingCharacter(false);
                    setSelectedCharacterId(character.id);
                  }}
                >
                  <span>{character.name}</span>
                  <small>{worlds.find(({ id }) => id === character.worldId)?.name || "No world"}</small>
                </button>
                <button
                  type="button"
                  className="admin-button admin-button--danger"
                  onClick={() => handleDeleteCharacter(character)}
                >
                  Delete
                </button>
              </li>
            ))}
          </ol>

          {initialCharacter && (
            <CharacterEditor
              key={creatingCharacter ? "new-character" : selectedCharacter.id}
              character={initialCharacter}
              worlds={worlds}
              previousCharacter={creatingCharacter ? null : selectedCharacter}
              onCancel={() => {
                setCreatingCharacter(false);
                setSelectedCharacterId(null);
              }}
              onSaved={(id, warning) => {
                setCreatingCharacter(false);
                setSelectedCharacterId(id);
                setActionError(warning || "");
                setActionNotice(creatingCharacter && !warning ? "Character saved and published." : "");
              }}
            />
          )}
        </section>

        <WorldManager worlds={worlds} characters={characters} onError={setActionError} />
      </div>
      <StickerManager
        stickers={stickers}
        placements={stickerPlacements}
        onStartPlacement={(stickerId) => {
          setActionError("");
          setActionNotice("");
          setSelectedStickerId(stickerId);
          setPlacingStickers(true);
        }}
        onError={setActionError}
        onNotice={setActionNotice}
      />
    </main>
  );
}
