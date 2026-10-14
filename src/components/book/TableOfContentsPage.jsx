import { forwardRef } from "react";
import PageStickers from "./PageStickers";

const TableOfContentsPage = forwardRef(({
  characters,
  worlds,
  pageNumber,
  pageCount,
  onSelectCharacter,
  pageId,
  stickerProps,
}, ref) => {
  const worldById = Object.fromEntries(worlds.map((w) => [w.id, w]));

  return (
    <div ref={ref} className="page page-paper">
      <PageStickers pageId={pageId} {...stickerProps} />
      <div className="page-content page-content--contents">
        <header className="contents-header">
          <h2>Table of Contents</h2>
          <span className="contents-page-count">
            {String(pageNumber).padStart(2, "0")} / {String(pageCount).padStart(2, "0")}
          </span>
        </header>
        <ul className="contents-list">
          {characters
            .map((c) => {
              const world = c.worldId ? worldById[c.worldId] : null;
              const worldColor = world?.color || world?.colorTag || "var(--ink-brown-soft)";
              return (
                <li className="contents-list__item" key={c.id}>
                  <button
                    onClick={() => onSelectCharacter(c.id)}
                    onMouseDown={(e) => e.stopPropagation()}
                    onTouchStart={(e) => e.stopPropagation()}
                    className="contents-list__button"
                  >
                    <span className="contents-list__name">{c.name}</span>
                    {world && (
                      <span className="world-tag" style={{ "--world-color": worldColor }}>
                        <span className="world-tag__swatch" aria-hidden="true" />
                        {world.name}
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
        </ul>
      </div>
    </div>
  );
});

export default TableOfContentsPage;
