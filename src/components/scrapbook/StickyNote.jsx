import { pickVariant } from "../../lib/variantPicker";

// Warm, varied note colors (not restricted to kraft/tan) with a few
// rotation variants, per Phase 3 decision.
const ROTATIONS = [-4, -2, 0, 2, 4];
const COLORS = [
  "var(--note-yellow)",
  "var(--note-peach)",
  "var(--note-rose)",
  "var(--note-sage)",
  "var(--note-sky)",
];

export default function StickyNote({ id, text }) {
  const rotation = ROTATIONS[pickVariant(id, ROTATIONS.length)];
  const color = COLORS[pickVariant(id + "-color", COLORS.length)];

  return (
    <div
      className="sticky-note"
      style={{
        transform: `rotate(${rotation}deg)`,
        "--note-color": color,
      }}
    >
      {text}
    </div>
  );
}
