/** The card a top level component sits in. */
export const CARD =
  "bg-ink-700 px-3 md:px-4 py-3 mb-3 rounded-xl border border-white/5 shadow-card";

/** The same card, for components that hold a list of their own. */
export const PADDED =
  "bg-ink-700 p-3 rounded-xl border border-white/5 shadow-card";

/** A nested child inside a container or section. */
export const NESTED_CARD = `${CARD} border-white/10`;

/** Card with a colored left accent border; smaller radius so the accent
    doesn't wrap around the corners. */
export const ACCENT_CARD = "bg-ink-700 p-3 rounded-md border-l-4 shadow-card";
