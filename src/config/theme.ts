/**
 * Theme tokens. Mirror of CSS custom properties for use inside r3f
 * (where we can't read CSS vars synchronously).
 */
export const theme = {
  ink: '#0a0a0a',
  paper: '#f6f3ee',
  bone: '#e8e3da',
  blood: '#d30000',
  rust: '#8a1a0a',
  smoke: '#2a2522',
} as const;

export type ThemeKey = keyof typeof theme;
