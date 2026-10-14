import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import HTMLFlipBook from "react-pageflip";
import CoverPage from "./CoverPage";
import BlankPage from "./BlankPage";
import TableOfContentsPage from "./TableOfContentsPage";
import CharacterLeftPage from "../character/CharacterLeftPage";
import CharacterRightPage from "../character/CharacterRightPage";
import CharacterOverflowPage from "../character/CharacterOverflowPage";
import { paginateCharacters, paginateTextAcrossPages } from "../../lib/pagination";

const PAGE_WIDTH = 420;
const PAGE_HEIGHT = 560;
const MIN_PAGE_WIDTH = 280;
const MIN_PAGE_HEIGHT = (MIN_PAGE_WIDTH / PAGE_WIDTH) * PAGE_HEIGHT;
const CONTENTS_START_PAGE = 2;

export default function BookContainer({
  characters,
  worlds,
  stickers = [],
  stickerPlacements = [],
  placementMode = false,
  selectedStickerId = "",
  onPlaceSticker,
  onMoveSticker,
  onDeletePlacement,
}) {
  const bookRef = useRef();
  const bookShellRef = useRef(null);
  const descriptionRefs = useRef(new Map());
  const [isOpen, setIsOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const [descriptionPages, setDescriptionPages] = useState({});
  const [measuredCharactersKey, setMeasuredCharactersKey] = useState("");
  const [measurementPageSize, setMeasurementPageSize] = useState(null);
  const [flipBookInitialized, setFlipBookInitialized] = useState(false);

  const sortedCharacters = useMemo(
    () => characters.slice().sort((a, b) => a.order - b.order),
    [characters],
  );
  const worldsById = useMemo(
    () => new Map(worlds.map((world) => [world.id, world])),
    [worlds],
  );
  const stickersById = useMemo(
    () => new Map(stickers.map((sticker) => [sticker.id, sticker])),
    [stickers],
  );
  const placementsByPageId = useMemo(() => {
    const byPage = new Map();
    for (const placement of stickerPlacements) {
      const pagePlacements = byPage.get(placement.pageId) || [];
      pagePlacements.push(placement);
      byPage.set(placement.pageId, pagePlacements);
    }
    return byPage;
  }, [stickerPlacements]);
  const getStickerProps = useCallback((pageId) => ({
    placements: placementsByPageId.get(pageId) || [],
    stickersById,
    placementMode,
    selectedStickerId,
    onPlaceSticker,
    onMoveSticker,
    onDeletePlacement,
  }), [
    onDeletePlacement,
    onMoveSticker,
    onPlaceSticker,
    placementMode,
    placementsByPageId,
    selectedStickerId,
    stickersById,
  ]);
  const contentsPages = useMemo(() => paginateCharacters(sortedCharacters), [sortedCharacters]);
  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updatePreference = () => setPrefersReducedMotion(preference.matches);
    updatePreference();
    if (preference.addEventListener) {
      preference.addEventListener("change", updatePreference);
      return () => preference.removeEventListener("change", updatePreference);
    }
    preference.addListener(updatePreference);
    return () => preference.removeListener(updatePreference);
  }, []);
  const charactersKey = JSON.stringify(
    sortedCharacters.map((character) => [character.id, character.description || ""]),
  );
  const nextPageAfterContents = CONTENTS_START_PAGE + contentsPages.length;
  const needsCharacterAlignmentPage = nextPageAfterContents % 2 === 0;

  const syncMeasurementPageSize = useCallback(() => {
    const page = [...(bookShellRef.current?.querySelectorAll(".stf__wrapper .page") || [])]
      .find((candidate) => candidate.getBoundingClientRect().width > 0);
    if (!page) return;

    const { width, height } = page.getBoundingClientRect();
    setMeasurementPageSize((current) => (
      current?.width === width && current?.height === height
        ? current
        : { width, height }
    ));
  }, []);

  const handleBookInit = useCallback(() => {
    setFlipBookInitialized(true);
    const flip = bookRef.current?.pageFlip();
    if (placementMode) {
      flip?.turnToPage(1);
    } else if (currentPage > 0 && flip) {
      const targetPage = Math.min(currentPage, flip.getPageCount() - 1);
      flip.turnToPage(targetPage);
      setCurrentPage(targetPage);
      setIsOpen(targetPage > 0);
    }
  }, [currentPage, placementMode]);

  const descriptionRefCallbacks = useMemo(
    () => new Map(sortedCharacters.map((character) => {
      const setRef = (slot) => (element) => {
        const refs = descriptionRefs.current.get(character.id) || {};
        if (element) refs[slot] = element;
        else delete refs[slot];
        descriptionRefs.current.set(character.id, refs);
      };

      return [character.id, {
        left: setRef("left"),
        right: setRef("right"),
        rightContent: setRef("rightContent"),
      }];
    })),
    [sortedCharacters],
  );

  useLayoutEffect(() => {
    let active = true;

    function measureDescriptions() {
      if (!active) return;

      const nextPages = {};
      for (const character of sortedCharacters) {
        const refs = descriptionRefs.current.get(character.id);
        const pages = paginateTextAcrossPages(
          character.description || "",
          refs?.left,
          refs?.right,
          refs?.rightContent,
        );
        if (pages) nextPages[character.id] = pages;
      }

      if (Object.keys(nextPages).length !== sortedCharacters.length) return;

      setDescriptionPages((current) => {
        const unchanged = Object.keys(nextPages).length === Object.keys(current).length
          && Object.entries(nextPages).every(([id, pages]) => (
            current[id]?.length === pages.length
            && current[id].every((page, index) => page === pages[index])
          ));
        return unchanged ? current : nextPages;
      });
      setMeasuredCharactersKey(charactersKey);
    }

    const observer = new ResizeObserver(measureDescriptions);
    for (const character of sortedCharacters) {
      const refs = descriptionRefs.current.get(character.id);
      if (refs?.left) observer.observe(refs.left);
      if (refs?.right) observer.observe(refs.right);
      if (refs?.rightContent) observer.observe(refs.rightContent);
    }
    measureDescriptions();
    document.fonts?.ready.then(measureDescriptions);

    return () => {
      active = false;
      observer.disconnect();
    };
  }, [
    charactersKey,
    measurementPageSize?.height,
    measurementPageSize?.width,
    sortedCharacters,
  ]);

  const characterGroups = useMemo(() => (
    sortedCharacters.map((character) => {
      const textPages = descriptionPages[character.id] || [character.description || ""];
      const totalPages = Math.max(2, Math.ceil(textPages.length / 2) * 2);
      return { character, textPages, totalPages };
    })
  ), [descriptionPages, sortedCharacters]);

  const characterStarts = useMemo(() => {
    const starts = new Map();
    let pageIndex = nextPageAfterContents + Number(needsCharacterAlignmentPage);
    for (const { character, totalPages } of characterGroups) {
      starts.set(character.id, pageIndex);
      pageIndex += totalPages;
    }
    return starts;
  }, [characterGroups, needsCharacterAlignmentPage, nextPageAfterContents]);

  const goToCharacter = useCallback((characterId) => {
    const targetPage = characterStarts.get(characterId);
    if (targetPage === undefined) return;

    const flip = bookRef.current?.pageFlip();
    if (!flip) return;

    const current = flip.getCurrentPageIndex();
    if (current === targetPage) return;
    if (Math.abs(targetPage - current) <= 2) flip.flip(targetPage);
    else flip.turnToPage(targetPage);
  }, [characterStarts]);

  const goToContents = useCallback(() => {
    const flip = bookRef.current?.pageFlip();
    if (!flip) return;

    const current = flip.getCurrentPageIndex();
    if (Math.abs(CONTENTS_START_PAGE - current) <= 2) flip.flip(CONTENTS_START_PAGE);
    else flip.turnToPage(CONTENTS_START_PAGE);
  }, []);

  const closeBook = useCallback(() => {
    bookRef.current?.pageFlip().turnToPage(0);
    setIsOpen(false);
  }, []);

  const turnPage = useCallback((direction) => {
    const flip = bookRef.current?.pageFlip();
    if (!flip) return;
    if (direction === "next") flip.flipNext();
    else flip.flipPrev();
  }, []);

  const handleBookKeyDown = useCallback((event) => {
    if (event.target.closest("input, textarea, select, [contenteditable='true']")) return;
    if (event.key === "Escape") {
      if (isOpen) {
        event.preventDefault();
        closeBook();
      }
      return;
    }
    if (event.target.closest("button")) return;
    if (event.key === "ArrowRight") {
      event.preventDefault();
      turnPage("next");
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      turnPage("previous");
    }
  }, [closeBook, isOpen, turnPage]);

  const bookPages = useMemo(() => [
    <CoverPage key="cover" stickerProps={getStickerProps("cover")} />,
    <BlankPage key="inside-cover" pageId="inside-cover" stickerProps={getStickerProps("inside-cover")} />,
    ...contentsPages.map((pageCharacters, index) => (
      <TableOfContentsPage
        key={`contents-${index}`}
        pageId={`contents:${index}`}
        stickerProps={getStickerProps(`contents:${index}`)}
        characters={pageCharacters}
        worlds={worlds}
        pageNumber={index + 1}
        pageCount={contentsPages.length}
        onSelectCharacter={goToCharacter}
      />
    )),
    ...(needsCharacterAlignmentPage ? [
      <BlankPage
        key="character-alignment"
        pageId="character-alignment"
        stickerProps={getStickerProps("character-alignment")}
      />,
    ] : []),
    ...characterGroups.flatMap(({ character, textPages, totalPages }) => {
      return Array.from({ length: totalPages }, (_, pageIndex) => {
        if (pageIndex === 0) {
          return (
            <CharacterLeftPage
              key={`${character.id}-left`}
              pageId={`character:${character.id}:0`}
              stickerProps={getStickerProps(`character:${character.id}:0`)}
              character={character}
              world={worldsById.get(character.worldId)}
              descriptionText={textPages[0] ?? ""}
            />
          );
        }
        if (pageIndex === 1) {
          return (
            <CharacterRightPage
              key={`${character.id}-right`}
              pageId={`character:${character.id}:1`}
              stickerProps={getStickerProps(`character:${character.id}:1`)}
              character={character}
              descriptionText={textPages[1] ?? ""}
            />
          );
        }
        if (pageIndex < textPages.length) {
          return (
            <CharacterOverflowPage
              key={`${character.id}-continuation-${pageIndex}`}
              pageId={`character:${character.id}:${pageIndex}`}
              stickerProps={getStickerProps(`character:${character.id}:${pageIndex}`)}
              text={textPages[pageIndex]}
            />
          );
        }
        const pageId = `character:${character.id}:${pageIndex}`;
        return (
          <BlankPage
            key={`${character.id}-alignment-${pageIndex}`}
            pageId={pageId}
            stickerProps={getStickerProps(pageId)}
          />
        );
      });
    }),
  ], [
    characterGroups,
    contentsPages,
    goToCharacter,
    getStickerProps,
    needsCharacterAlignmentPage,
    worlds,
    worldsById,
  ]);
  const measurementPages = useMemo(() => sortedCharacters.flatMap((character) => {
    const refs = descriptionRefCallbacks.get(character.id);
    return [
      <CharacterLeftPage
        key={`${character.id}-measure-left`}
        character={character}
        world={worldsById.get(character.worldId)}
        descriptionText={character.description || ""}
        onDescriptionRef={refs.left}
      />,
      <CharacterRightPage
        key={`${character.id}-measure-right`}
        character={character}
        descriptionText={character.description || ""}
        onDescriptionRef={refs.right}
        onContentRef={refs.rightContent}
      />,
    ];
  }), [descriptionRefCallbacks, sortedCharacters, worldsById]);
  const pageTopologyKey = characterGroups
    .map(({ character, totalPages }) => `${character.id}:${totalPages}`)
    .join("|");

  useEffect(() => {
    if (!flipBookInitialized) return undefined;
    const wrapper = bookShellRef.current?.querySelector(".stf__wrapper");
    if (!wrapper) return undefined;

    const observer = new ResizeObserver(() => {
      if (currentPage > 0) syncMeasurementPageSize();
    });
    observer.observe(wrapper);
    return () => observer.disconnect();
  }, [currentPage, flipBookInitialized, pageTopologyKey, syncMeasurementPageSize]);

  return (
    <div
      ref={bookShellRef}
      className="book-shell"
      role="region"
      aria-label="Interactive character scrapbook"
      tabIndex={0}
      onKeyDown={handleBookKeyDown}
      style={{ position: "relative", width: PAGE_WIDTH * 2, maxWidth: "100vw", paddingTop: "3.25rem" }}
    >
      {isOpen && (
        <nav className="book-navigation" aria-label="Book navigation">
          <button type="button" onClick={goToContents}>Contents</button>
          <button type="button" onClick={() => turnPage("previous")}>Previous page</button>
          <button type="button" onClick={() => turnPage("next")}>Next page</button>
          <button type="button" onClick={closeBook}>Close book</button>
          <span className="visually-hidden" aria-live="polite">
            Page {currentPage + 1} of {bookPages.length}
          </span>
        </nav>
      )}
      {measuredCharactersKey === charactersKey && <HTMLFlipBook
        key={pageTopologyKey}
        width={PAGE_WIDTH}
        height={PAGE_HEIGHT}
        size="stretch"
        minWidth={MIN_PAGE_WIDTH}
        maxWidth={PAGE_WIDTH}
        minHeight={MIN_PAGE_HEIGHT}
        maxHeight={PAGE_HEIGHT}
        showCover={true}
        clickEventForward={placementMode}
        usePortrait={true}
        flippingTime={prefersReducedMotion ? 1 : 450}
        onFlip={(event) => {
          setCurrentPage(event.data);
          setIsOpen(event.data !== 0);
          if (event.data > 0) syncMeasurementPageSize();
        }}
        onInit={handleBookInit}
        ref={bookRef}
      >
        {bookPages}
      </HTMLFlipBook>}
      <div
        className="character-measurement-pages"
        aria-hidden="true"
        style={measurementPageSize ? {
          "--measurement-page-width": `${measurementPageSize.width}px`,
          "--measurement-page-height": `${measurementPageSize.height}px`,
        } : undefined}
      >
        {measurementPages}
      </div>
    </div>
  );
}
