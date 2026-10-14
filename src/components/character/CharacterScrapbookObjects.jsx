import StickyNote from "../scrapbook/StickyNote";
import TapedPhoto from "../scrapbook/TapedPhoto";

function belongsOnSide(item, side) {
  return (item.side === "left" ? "left" : "right") === side;
}

export default function CharacterScrapbookObjects({ character, side }) {
  const images = (character.images || [])
    .map((image, index) => ({ image, index }))
    .filter(({ image }) => belongsOnSide(image, side));
  const notes = (character.notes || [])
    .map((note, index) => ({ note, index }))
    .filter(({ note }) => belongsOnSide(note, side));

  if (images.length === 0 && notes.length === 0) return null;

  return (
    <div className="character-scrapbook-objects">
      {images.length > 0 && (
        <div className="character-scrapbook-objects__items">
          {images.map(({ image, index }) => (
            <TapedPhoto
              key={image.id || index}
              id={`${character.id}-img-${index}`}
              url={image.url}
              alt={image.alt || `${character.name} scrapbook photo ${index + 1}`}
              size="small"
            />
          ))}
        </div>
      )}
      {notes.length > 0 && (
        <div className="character-note-position-layer" aria-label={`${character.name} notes`}>
          {notes.map(({ note, index }) => {
            const vertical = ["top", "middle", "bottom"].includes(note.verticalPosition)
              ? note.verticalPosition
              : "bottom";
            const horizontal = ["left", "center", "right"].includes(note.horizontalPosition)
              ? note.horizontalPosition
              : "right";
            return (
              <div
                key={note.id || index}
                className="character-note-position"
                data-vertical={vertical}
                data-horizontal={horizontal}
              >
                <StickyNote
                  id={`${character.id}-note-${index}`}
                  text={note.text}
                />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
