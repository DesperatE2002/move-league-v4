// Shared dance styles used across registration, battle creation, profiles
export const DANCE_STYLES = [
  "Salsa",
  "Bachata",
  "Hip-Hop",
  "K-Pop",
  "Contemporary",
  "Breaking",
  "Latin",
  "Tango",
  "Swing",
  "Reggaeton",
  "Popping",
  "Locking",
  "Waacking",
  "Vogue",
  "Jazz",
  "Belly Dance",
] as const;

export type DanceStyle = (typeof DANCE_STYLES)[number];
