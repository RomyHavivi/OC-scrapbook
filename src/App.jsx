import { lazy, Suspense, useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import BookContainer from "./components/book/BookContainer";
import { characters, worlds } from "./data/placeholderCharacters";
import { firebaseConfigurationError, firebaseReady } from "./lib/firebase";
import {
  subscribeToCharacters,
  subscribeToStickerPlacements,
  subscribeToStickers,
  subscribeToWorlds,
} from "./lib/publishedData";

const AdminApp = lazy(() => import("./AdminApp"));

function BookPage() {
  const [bookData, setBookData] = useState({
    characters: firebaseReady ? [] : characters,
    worlds: firebaseReady ? [] : worlds,
    stickers: [],
    stickerPlacements: [],
    loading: firebaseReady,
    error: firebaseConfigurationError,
  });

  useEffect(() => {
    if (!firebaseReady) return undefined;
    let charactersLoaded = false;
    let worldsLoaded = false;
    let stickersLoaded = false;
    let stickerPlacementsLoaded = false;
    const updateLoading = () => {
      if (charactersLoaded && worldsLoaded && stickersLoaded && stickerPlacementsLoaded) {
        setBookData((current) => ({ ...current, loading: false }));
      }
    };
    const handleError = (error) => {
      setBookData((current) => ({
        ...current,
        loading: false,
        error: `Could not load the published scrapbook: ${error.message}`,
      }));
    };
    const unsubscribeCharacters = subscribeToCharacters((nextCharacters) => {
      charactersLoaded = true;
      setBookData((current) => ({ ...current, characters: nextCharacters }));
      updateLoading();
    }, handleError);
    const unsubscribeWorlds = subscribeToWorlds((nextWorlds) => {
      worldsLoaded = true;
      setBookData((current) => ({ ...current, worlds: nextWorlds }));
      updateLoading();
    }, handleError);
    const unsubscribeStickers = subscribeToStickers((nextStickers) => {
      stickersLoaded = true;
      setBookData((current) => ({ ...current, stickers: nextStickers }));
      updateLoading();
    }, handleError);
    const unsubscribeStickerPlacements = subscribeToStickerPlacements((nextPlacements) => {
      stickerPlacementsLoaded = true;
      setBookData((current) => ({ ...current, stickerPlacements: nextPlacements }));
      updateLoading();
    }, handleError);
    return () => {
      unsubscribeCharacters();
      unsubscribeWorlds();
      unsubscribeStickers();
      unsubscribeStickerPlacements();
    };
  }, []);

  if (bookData.loading || bookData.error) {
    return (
      <div className="book-data-status" role={bookData.error ? "alert" : "status"}>
        {bookData.error || "Loading the scrapbook..."}
      </div>
    );
  }

  return (
    <div className="book-stage">
      <BookContainer
        characters={bookData.characters}
        worlds={bookData.worlds}
        stickers={bookData.stickers}
        stickerPlacements={bookData.stickerPlacements}
      />
      <Link className="admin-entry-link" to="/admin">
        Admin
      </Link>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<BookPage />} />
        <Route
          path="/admin"
          element={(
            <Suspense fallback={<div className="book-data-status">Loading admin...</div>}>
              <AdminApp />
            </Suspense>
          )}
        />
      </Routes>
    </BrowserRouter>
  );
}
