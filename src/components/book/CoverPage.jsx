import { forwardRef } from "react";
import PageStickers from "./PageStickers";

const CoverPage = forwardRef(({ stickerProps }, ref) => (
  <div
    ref={ref}
    className="page page-cover"
    data-density="hard"
  >
    <PageStickers pageId="cover" {...stickerProps} />
    <div className="cover-scrapbook">
      <span className="cover-decoration cover-decoration--sparkle" aria-hidden="true">✦</span>
      <span className="cover-decoration cover-decoration--heart" aria-hidden="true">♥</span>
      <span className="cover-decoration cover-decoration--flower" aria-hidden="true">✿</span>
      <span className="cover-decoration cover-decoration--star" aria-hidden="true">★</span>
      <span className="cover-washi cover-washi--top" aria-hidden="true" />
      <span className="cover-washi cover-washi--side" aria-hidden="true" />
      <div className="cover-title-frame">
        <span className="cover-label">A book of little wonders</span>
        <span className="cover-title">
          Character
          <br />
          Scrapbook
        </span>
        <div className="cover-rule"><span aria-hidden="true">✿</span></div>
        <span className="cover-hint">click to open</span>
      </div>
      <span className="cover-seal" aria-hidden="true">♥</span>
    </div>
  </div>
));

export default CoverPage;
