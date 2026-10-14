import { forwardRef } from "react";
import CharacterScrapbookObjects from "./CharacterScrapbookObjects";
import PageStickers from "../book/PageStickers";

const CharacterRightPage = forwardRef(
  ({
    character,
    descriptionText,
    onDescriptionRef,
    onContentRef,
    pageId,
    stickerProps,
  }, ref) => {
    return (
      <div ref={ref} className="page page-paper">
        <PageStickers pageId={pageId} {...stickerProps} />
        <div ref={onContentRef} className="page-content page-content--character-right">
          <p
            ref={onDescriptionRef}
            className="character-description character-description--continued"
          >
            {descriptionText}
          </p>
          <CharacterScrapbookObjects character={character} side="right" />
        </div>
      </div>
    );
  },
);

export default CharacterRightPage;
