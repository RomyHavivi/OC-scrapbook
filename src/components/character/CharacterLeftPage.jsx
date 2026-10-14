import { forwardRef } from "react";
import TapedPhoto from "../scrapbook/TapedPhoto";
import CharacterScrapbookObjects from "./CharacterScrapbookObjects";
import PageStickers from "../book/PageStickers";

const CharacterLeftPage = forwardRef(({
  character,
  world,
  descriptionText,
  onDescriptionRef,
  pageId,
  stickerProps,
}, ref) => {
  return (
    <div ref={ref} className="page page-paper">
      <PageStickers pageId={pageId} {...stickerProps} />
      <div className="page-content page-content--character-left">
        <TapedPhoto id={character.id} url={character.heroImageUrl} alt={character.name} />
        <h2 className="character-name">{character.name}</h2>
        {world && (
          <span
            className="world-tag character-world-tag"
            style={{ "--world-color": world.color || world.colorTag || "var(--ink-brown-soft)" }}
          >
            <span className="world-tag__swatch" aria-hidden="true" />
            {world.name}
          </span>
        )}
        <CharacterScrapbookObjects character={character} side="left" />
        <p
          ref={onDescriptionRef}
          className="character-description"
          style={{ fontFamily: "var(--font-body)", lineHeight: 1.6, color: "var(--ink-brown)" }}
        >
          {descriptionText}
        </p>
      </div>
    </div>
  );
});

export default CharacterLeftPage;
