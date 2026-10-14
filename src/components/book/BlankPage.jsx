import { forwardRef } from "react";
import PageStickers from "./PageStickers";

const BlankPage = forwardRef(({ pageId, stickerProps }, ref) => (
  <div ref={ref} className="page page-paper">
    <PageStickers pageId={pageId} {...stickerProps} />
  </div>
));

export default BlankPage;
