// ─── Dodaat Neumorphic Design System ─────────────────────────────────────────
// Light beige palette with tactile neumorphic depth

export const colors = {
  // Primary background surface — light beige
  background: '#F5F0E8',

  // Neumorphic shadow pair (calibrated to the new base)
  shadowLight: '#FFFFFF',
  shadowDark: '#C8C0B2',

  // Domain colour indicators
  physical: '#8B6F5E',    // warm terracotta
  mental: '#5E7A8B',      // slate blue
  spiritual: '#7A6B8B',   // muted violet

  // Gold card treatment
  gold: '#C4A882',
  goldLight: '#EDD9B8',
  goldDark: '#A8875A',

  // Text
  textPrimary: '#38322C',
  textSecondary: '#7A7068',
  textMuted: '#B0A89E',
  textOnGold: '#5A3E20',

  // System / UI
  white: '#FFFFFF',
  cream: '#FDFAF5',
  border: '#DDD8CE',

  // Completion celebratory
  completionGlow: '#C4A882',

  // Settings / System cards (slightly recessed)
  systemCard: '#EDE8DE',
} as const;

export const shadows = {
  // Standard neumorphic card extrusion
  card: {
    shadowColor: colors.shadowDark,
    shadowOffset: { width: 6, height: 6 },
    shadowOpacity: 0.6,
    shadowRadius: 12,
    elevation: 8,
  },
  // Light side (achieved via a second View overlay or LinearGradient border)
  cardLight: {
    shadowColor: colors.shadowLight,
    shadowOffset: { width: -6, height: -6 },
    shadowOpacity: 0.9,
    shadowRadius: 12,
    elevation: 0,
  },
  // Pressed / recessed (inset effect)
  inset: {
    shadowColor: colors.shadowDark,
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 2,
  },
  // Gold card elevated treatment
  gold: {
    shadowColor: colors.goldDark,
    shadowOffset: { width: 6, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 14,
    elevation: 10,
  },
  // Completion card — highest perceived depth
  completion: {
    shadowColor: colors.goldDark,
    shadowOffset: { width: 8, height: 8 },
    shadowOpacity: 0.7,
    shadowRadius: 18,
    elevation: 14,
  },
} as const;

export const borderRadius = {
  card: 24,
  button: 16,
  pill: 50,
  small: 8,
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const typography = {
  // Card title
  cardTitle: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: colors.textPrimary,
    letterSpacing: -0.3,
  },
  // Card body
  cardBody: {
    fontSize: 16,
    fontWeight: '400' as const,
    color: colors.textSecondary,
    lineHeight: 24,
  },
  // Card context / why
  cardContext: {
    fontSize: 14,
    fontWeight: '400' as const,
    color: colors.textMuted,
    lineHeight: 20,
    fontStyle: 'italic' as const,
  },
  // Intensity badge
  intensityBadge: {
    fontSize: 11,
    fontWeight: '600' as const,
    letterSpacing: 0.8,
    textTransform: 'uppercase' as const,
  },
  // Domain label
  domainLabel: {
    fontSize: 12,
    fontWeight: '600' as const,
    letterSpacing: 1.2,
    textTransform: 'uppercase' as const,
  },
  // Tagline / system
  tagline: {
    fontSize: 13,
    fontWeight: '400' as const,
    color: colors.textMuted,
    letterSpacing: 0.3,
  },
  // Heading (onboarding wizard cards)
  heading: {
    fontSize: 26,
    fontWeight: '700' as const,
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },
  // App name
  appName: {
    fontSize: 32,
    fontWeight: '800' as const,
    color: colors.textPrimary,
    letterSpacing: 1,
  },
} as const;

export const cardDimensions = {
  width: 340,
  height: 500,
  peekHeight: 60, // Gold card peek amount
} as const;

// Domain colour helper
export function getDomainColor(domain: 'physical' | 'mental' | 'spiritual'): string {
  return colors[domain];
}
