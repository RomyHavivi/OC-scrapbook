import { useRef, useState } from "react";

const STICKER_WIDTH = 0.23;
const STICKER_HEIGHT_LIMIT = 0.32;

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export default function PageStickers({
  pageId,
  placements = [],
  stickersById,
  placementMode = false,
  selectedStickerId = "",
  onPlaceSticker,
  onMoveSticker,
  onDeletePlacement,
}) {
  const pageRef = useRef(null);
  const dragRef = useRef(null);
  const [dragPosition, setDragPosition] = useState(null);
  const visiblePlacements = placements.filter((placement) => stickersById.has(placement.stickerId));

  function getPosition(event, centered = false) {
    const bounds = pageRef.current.getBoundingClientRect();
    const x = (event.clientX - bounds.left) / bounds.width;
    const y = (event.clientY - bounds.top) / bounds.height;
    return {
      x: clamp(x - (centered ? STICKER_WIDTH / 2 : 0), 0, 1 - STICKER_WIDTH),
      y: clamp(y - (centered ? STICKER_HEIGHT_LIMIT / 2 : 0), 0, 1 - STICKER_HEIGHT_LIMIT),
    };
  }

  function startDrag(event, placement) {
    if (!placementMode) return;
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = {
      placement,
      startX: event.clientX,
      startY: event.clientY,
      position: { x: placement.x, y: placement.y },
      moved: false,
    };
    setDragPosition({ id: placement.id, x: placement.x, y: placement.y });
  }

  function moveDrag(event) {
    const drag = dragRef.current;
    if (!drag) return;
    event.preventDefault();
    event.stopPropagation();
    const position = getPosition(event);
    drag.position = position;
    drag.moved ||= Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY) > 3;
    setDragPosition({ id: drag.placement.id, ...position });
  }

  function finishDrag(event) {
    const drag = dragRef.current;
    if (!drag) return;
    event.stopPropagation();
    dragRef.current = null;
    setDragPosition(null);
    if (drag.moved) onMoveSticker?.({ ...drag.placement, ...drag.position });
  }

  function placeSticker(event) {
    if (!placementMode || !selectedStickerId) return;
    event.preventDefault();
    event.stopPropagation();
    onPlaceSticker?.({
      stickerId: selectedStickerId,
      pageId,
      ...getPosition(event, true),
    });
  }

  return (
    <div ref={pageRef} className="book-sticker-layer">
      {placementMode && (
        <button
          type="button"
          className="book-sticker-target"
          aria-label={`Place selected sticker on ${pageId}`}
          onClick={placeSticker}
          onMouseDown={(event) => event.stopPropagation()}
          onTouchStart={(event) => event.stopPropagation()}
          disabled={!selectedStickerId}
        />
      )}
      {visiblePlacements.map((placement) => {
        const sticker = stickersById.get(placement.stickerId);
        const position = dragPosition?.id === placement.id ? dragPosition : placement;
        return (
          <div
            key={placement.id}
            className={`book-sticker${placementMode ? " book-sticker--editable" : ""}`}
            style={{ left: `${position.x * 100}%`, top: `${position.y * 100}%` }}
          >
            <button
              type="button"
              className="book-sticker__image"
              aria-label={placementMode ? `Move ${sticker.name}` : sticker.name}
              onPointerDown={(event) => startDrag(event, placement)}
              onPointerMove={moveDrag}
              onPointerUp={finishDrag}
              onPointerCancel={finishDrag}
              onClick={(event) => event.stopPropagation()}
            >
              <img src={sticker.url} alt={placementMode ? "" : sticker.name} draggable="false" />
            </button>
            {placementMode && (
              <button
                type="button"
                className="book-sticker__remove"
                aria-label={`Remove ${sticker.name} from this page`}
                onClick={(event) => {
                  event.stopPropagation();
                  onDeletePlacement?.(placement.id);
                }}
                onMouseDown={(event) => event.stopPropagation()}
                onTouchStart={(event) => event.stopPropagation()}
              >
                ×
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
