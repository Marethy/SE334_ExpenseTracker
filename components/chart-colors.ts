export const CHART_PALETTES = {
  default: ["#0062FF", "#12C6FF", "#FF647F", "#FF9354"],
  pastel: ["#A0E7E5", "#B4F8C8", "#FFAEBC", "#FBE7C6"],
  warm: ["#FF6B6B", "#FF9F43", "#FFC75F", "#F9F871"],
} as const;

export type PaletteName = keyof typeof CHART_PALETTES;

export const DEFAULT_CHART_COLORS = CHART_PALETTES.default;
