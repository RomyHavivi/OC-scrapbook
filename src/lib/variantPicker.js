// Deterministically picks a "look" variant (rotation, tape style, etc.)
// for a given character/note/image ID, so the same character always
// renders the same way, but different characters get visual variety
// without any hand-authored per-character styling.
// See phase1-design-spec.md §9.

function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export function pickVariant(id, variantCount) {
  return hashString(id) % variantCount;
}
