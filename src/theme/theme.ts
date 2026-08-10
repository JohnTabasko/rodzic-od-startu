// Design tokens — motyw ciepły/spokojny, kontrast zgodny z WCAG 2.1 AA
export const colors = {
  bg: '#FFF8F3',
  surface: '#FFFFFF',
  surfaceAlt: '#FDEFE7',
  primary: '#C24E3B',      // terakota — kontrast na białym > 4.5:1
  primaryDark: '#9E3B2B',
  accent: '#2E7D6E',       // teal (akcenty taty)
  text: '#33272A',
  textMuted: '#6B5E60',
  border: '#EBDCD2',
  success: '#2E7D32',
  warning: '#9A5B00', // 4.24:1 → poprawione do ≥4.5:1 (audyt WCAG AA)
  danger: '#B3261E',
};

export const spacing = (n: number) => n * 8;

// Skalowanie tekstu — wsparcie powiększania (WCAG 1.4.4)
export const makeType = (scale: number = 1) => ({
  h1: { fontSize: Math.round(28 * scale), fontWeight: '700' as const, color: colors.text },
  h2: { fontSize: Math.round(22 * scale), fontWeight: '700' as const, color: colors.text },
  h3: { fontSize: Math.round(17 * scale), fontWeight: '600' as const, color: colors.text },
  body: { fontSize: Math.round(16 * scale), lineHeight: Math.round(24 * scale), color: colors.text },
  small: { fontSize: Math.round(13 * scale), lineHeight: Math.round(18 * scale), color: colors.textMuted },
});

export const MIN_TOUCH = 44; // min. obszar dotyku 44x44
export const radius = { card: 16, chip: 20, button: 12 };
