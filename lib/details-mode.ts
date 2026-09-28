// How the "Tell us about you" step behaves on the customer review page
export const DETAILS_MODES = ["required", "optional", "hidden"] as const;
export type DetailsMode = (typeof DETAILS_MODES)[number];

export const detailsMode = (l: { detailsOptional: boolean; detailsHidden: boolean }): DetailsMode =>
  l.detailsHidden ? "hidden" : l.detailsOptional ? "optional" : "required";

export const detailsFlags = (mode: DetailsMode) => ({ detailsOptional: mode === "optional", detailsHidden: mode === "hidden" });
