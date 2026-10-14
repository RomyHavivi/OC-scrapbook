import { forwardRef } from "react";
import PageStickers from "../book/PageStickers";

const CharacterOverflowPage = forwardRef(({ text, pageId, stickerProps }, ref) => (
  <div ref={ref} className="page page-paper">
    <PageStickers pageId={pageId} {...stickerProps} />
    <div className="page-content page-content--character-overflow">
      <p className="character-description character-description--continued">{text}</p>
    </div>
  </div>
));

export default CharacterOverflowPage;
