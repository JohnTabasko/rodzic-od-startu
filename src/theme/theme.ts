// Rodzic od Startu design tokens — warm, calm, natural, WCAG-oriented.
export const colors = {
  // Base surfaces
  bg: '#FBF7F1',
  surface: '#FFFFFF',
  surfaceAlt: '#F7F1E8',
  line: '#EADFD2',
  border: '#EADFD2',

  // Typography
  text: '#2E2926',
  textMuted: '#716861',
  textFaint: '#A99B8C',

  // Primary / terracotta
  primary: '#B4533A',
  primaryLight: '#D96C4F',
  primaryDark: '#8E3A26',
  primarySoft: '#F6E3DB',

  // Sage — done, safe, health
  sage: '#7C9A7B',
  sageDeep: '#5F7C5E',
  sageSoft: '#E6EDE3',

  // Blue — information and partner/tata context
  accent: '#5A7E9B',
  accentLight: '#7C9DB8',
  accentSoft: '#E4EDF4',
  blue: '#7C9DB8',
  blueDeep: '#5A7E9B',
  blueSoft: '#E4EDF4',

  // Gold — attention without alarm
  gold: '#E3AE54',
  goldDeep: '#B98A2F',
  goldSoft: '#F8EDD6',

  // Lavender — privacy and community
  lavender: '#A793C4',
  lavenderDeep: '#7C66A3',
  lavenderSoft: '#ECE6F4',

  // Semantic states
  success: '#5E8C61',
  warning: '#B98A2F',
  danger: '#C2554E',
  dangerSoft: '#F6E1DF',
};

export const spacing = (units: number) => units * 8;

export const makeType = (scale = 1) => ({
  h1: {
    fontSize: Math.round(25 * scale),
    lineHeight: Math.round(30 * scale),
    fontWeight: '800' as const,
    letterSpacing: -0.4,
    color: colors.text,
  },
  h2: {
    fontSize: Math.round(20 * scale),
    lineHeight: Math.round(26 * scale),
    fontWeight: '800' as const,
    letterSpacing: -0.2,
    color: colors.text,
  },
  h3: {
    fontSize: Math.round(15.5 * scale),
    lineHeight: Math.round(21 * scale),
    fontWeight: '800' as const,
    color: colors.text,
  },
  body: {
    fontSize: Math.round(15 * scale),
    lineHeight: Math.round(22 * scale),
    color: colors.text,
  },
  small: {
    fontSize: Math.round(12.5 * scale),
    lineHeight: Math.round(18 * scale),
    color: colors.textMuted,
  },
  kicker: {
    fontSize: Math.round(11 * scale),
    lineHeight: Math.round(15 * scale),
    fontWeight: '800' as const,
    letterSpacing: 1,
    textTransform: 'uppercase' as const,
    color: colors.primary,
  },
});

export const MIN_TOUCH = 48;
export const radius = {
  card: 22,
  control: 16,
  button: 16,
  chip: 99,
  small: 12,
};

export const shadows = {
  card: {
    shadowColor: '#2E2926',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 2,
  },
  pop: {
    shadowColor: '#2E2926',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.16,
    shadowRadius: 24,
    elevation: 6,
  },
};
