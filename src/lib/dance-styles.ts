// Shared dance styles used across registration, battle creation, profiles
export const DANCE_STYLES = [
  "Salsa",
  "Bachata",
  "Hip-Hop",
  "K-Pop",
] as const;

export type DanceStyle = (typeof DANCE_STYLES)[number];
