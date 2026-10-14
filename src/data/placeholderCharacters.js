// Placeholder data so the book works end-to-end before Firestore is
// connected. Shape matches the Firestore schema in phase1-design-spec.md §6
// so swapping this out for a real Firestore read later is a drop-in change.

export const worlds = [
  { id: "world-embers", name: "The Ember Court", colorTag: "#8a4b2c", markIcon: "flame" },
  { id: "world-tidewatch", name: "Tidewatch", colorTag: "#2c5f6f", markIcon: "wave" },
];

export const characters = [
  {
    id: "char-1",
    name: "Rowan Ashgale",
    worldId: "world-embers",
    heroImageUrl: "",
    images: [],
    description:
      "A wandering smith exiled from the Ember Court for a crime they didn't commit. Rowan speaks little, works with their hands, and trusts no one who hasn't bled for something.",
    notes: [{ text: "Never removes their left glove in public." }],
    order: 1,
  },
  {
    id: "char-2",
    name: "Isolde Marren",
    worldId: "world-embers",
    heroImageUrl: "",
    images: [],
    description:
      "Court historian and secret keeper of the Ember lineage. Isolde knows exactly which of Rowan's crimes were real — and which were not.",
    notes: [{ text: "Keeps a second, false diary for anyone who searches her study." }],
    order: 2,
  },
  {
    id: "char-3",
    name: "Cassian Vey",
    worldId: "world-tidewatch",
    heroImageUrl: "",
    images: [],
    description: "A lighthouse keeper who may or may not be entirely human anymore.",
    notes: [],
    order: 3,
  },
  {
    id: "char-4",
    name: "Nell Farrow",
    worldId: null,
    heroImageUrl: "",
    images: [],
    description:
      "Standalone concept — not yet tied to a world. A traveling clockmaker with a habit of fixing things that were never broken.",
    notes: [{ text: "Placeholder character — replace or edit in /admin once Firebase is connected." }],
    order: 4,
  },
];
