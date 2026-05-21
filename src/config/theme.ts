/**
 * Visual theme for Studio Panic Attack.
 *
 * Light editorial palette. Cream paper bg, deep ink foreground, warm
 * accent. Designed to feel like an art-school zine reprinted on textured
 * stock — dark elements (numbers, sculpture, particles) read as ink
 * against the page.
 */

export const theme = {
  bg: '#f5efe4',
  bgDeep: '#ebe3d3',
  bgPanel: '#ffffff',
  fg: '#1a1814',
  fgMuted: '#5a5450',
  fgDim: '#8e8780',
  accent: '#c97e3a', // warm rust / burnt orange
  ink: '#0d0c0a',
} as const;

export const fonts = {
  serif: '"Times New Roman", Georgia, serif',
  sans: '"Helvetica Neue", Helvetica, Arial, sans-serif',
} as const;
