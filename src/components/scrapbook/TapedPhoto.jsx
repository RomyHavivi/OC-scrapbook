import { pickVariant } from "../../lib/variantPicker";

const ROTATIONS = [-3, -1, 1, 3];

export default function TapedPhoto({ id, url, alt, size = "large" }) {
  const rotation = ROTATIONS[pickVariant(id, ROTATIONS.length)];

  return (
    <div
      className={`taped-photo ${size === "small" ? "taped-photo--small" : ""}`}
      style={{ position: "relative", display: "inline-block" }}
    >
      <div
        className="taped-photo__mount"
        style={{ "--photo-rotation": `${rotation}deg` }}
      >
        {url ? (
          <img
            className="taped-photo-image"
            src={url}
            alt={alt}
            style={{ objectFit: "cover", display: "block" }}
          />
        ) : (
          <div
            className="taped-photo-placeholder"
            style={{
              background: "var(--paper-cream-dark)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--ink-brown-soft)",
              fontFamily: "var(--font-hand)",
              fontSize: "1rem",
            }}
          >
            no image yet
          </div>
        )}
        <div className="taped-photo__tape" />
      </div>
    </div>
  );
}
