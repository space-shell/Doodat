// ─── Dodaat Neumorphic Design System ─────────────────────────────────────────
// Warm off-white palette with tactile depth

export const colors = {
  // Primary background surface
  background: '#E8E0D8',

  // Neumorphic shadow pair
  shadowLight: '#FFFFFF',
  shadowDark: '#C8BDB5',

  // Domain colour indicators
  physical: '#8B6F5E',    // warm terracotta
  mental: '#5E7A8B',      // slate blue
  spiritual: '#7A6B8B',   // muted violet

  // Gold card treatment
  gold: '#C4A882',
  goldLight: '#E8D5B5',
  goldDark: '#A8875A',

  // Text
  textPrimary: '#3D3530',
  textSecondary: '#7A6F68',
  textMuted: '#A89F98',
  textOnGold: '#5A3E20',

  // System / UI
  white: '#FFFFFF',
  cream: '#F5F0EA',
  border: '#D4C8C0',

  // Completion celebratory
  completionGlow: '#C4A882',

  // Settings / System cards (slightly recessed)
  systemCard: '#E0D8D0',
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
    letterSpacing: -1,
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
