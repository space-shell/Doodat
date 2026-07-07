import React from 'react';
import { Platform, View, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { colors, borderRadius } from '../../theme';

/**
 * Core neumorphic container. Achieves the dual-shadow extrusion effect.
 *
 * Web: CSS box-shadow with two values (light top-left + dark bottom-right)
 *      for true neumorphism. RN shadow* props are suppressed on web to avoid
 *      the "shadow* props deprecated" warning.
 *
 * Native: single RN shadow (bottom-right) + directional border trick for the
 *         light top-left highlight edge.
 */

// ─── Web CSS shadows ──────────────────────────────────────────────────────────

const webShadow = Platform.OS === 'web' ? {
  raised:     { boxShadow: '-8px -8px 16px rgba(255,255,255,0.92), 8px 8px 18px rgba(200,192,178,0.55)' },
  flat:       { boxShadow: '-3px -3px 7px rgba(255,255,255,0.85), 3px 3px 7px rgba(200,192,178,0.32)' },
  inset:      { boxShadow: 'inset 3px 3px 7px rgba(200,192,178,0.45), inset -3px -3px 7px rgba(255,255,255,0.9)' },
  gold:       { boxShadow: '-8px -8px 16px rgba(237,217,184,0.88), 8px 8px 18px rgba(168,135,90,0.58)' },
  completion: { boxShadow: '-10px -10px 22px rgba(237,217,184,0.92), 10px 10px 22px rgba(168,135,90,0.68)' },
  system:     { boxShadow: '-5px -5px 11px rgba(255,255,255,0.92), 5px 5px 11px rgba(200,192,178,0.42)' },
} as Record<string, object> : null;

// ─── Native RN shadow styles (not used on web) ────────────────────────────────

const nativeShadow = Platform.OS !== 'web' ? StyleSheet.create({
  raised: {
    shadowColor: colors.shadowDark,
    shadowOffset: { width: 8, height: 8 },
    shadowOpacity: 0.55,
    shadowRadius: 14,
    elevation: 8,
    borderWidth: 1,
    borderColor: colors.shadowLight,
    borderTopColor: colors.shadowLight,
    borderLeftColor: colors.shadowLight,
    borderRightColor: colors.shadowDark,
    borderBottomColor: colors.shadowDark,
  },
  flat: {
    shadowColor: colors.shadowDark,
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 2,
  },
  inset: {
    shadowColor: colors.shadowDark,
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 1,
    borderWidth: 1,
    borderColor: colors.shadowDark,
    borderTopColor: colors.shadowDark,
    borderLeftColor: colors.shadowDark,
    borderRightColor: colors.shadowLight,
    borderBottomColor: colors.shadowLight,
  },
  gold: {
    shadowColor: colors.goldDark,
    shadowOffset: { width: 8, height: 8 },
    shadowOpacity: 0.6,
    shadowRadius: 16,
    elevation: 12,
    borderWidth: 1,
    borderColor: colors.gold,
    borderTopColor: colors.goldLight,
    borderLeftColor: colors.goldLight,
    borderRightColor: colors.goldDark,
    borderBottomColor: colors.goldDark,
  },
  completion: {
    shadowColor: colors.goldDark,
    shadowOffset: { width: 10, height: 10 },
    shadowOpacity: 0.7,
    shadowRadius: 20,
    elevation: 16,
    borderWidth: 1.5,
    borderColor: colors.gold,
    borderTopColor: colors.goldLight,
    borderLeftColor: colors.goldLight,
    borderRightColor: colors.goldDark,
    borderBottomColor: colors.goldDark,
  },
  system: {
    shadowColor: colors.shadowDark,
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: colors.border,
  },
}) : null;

// ─── Web border styles (directional light/dark edge cues) ─────────────────────

const webBorder = Platform.OS === 'web' ? StyleSheet.create({
  raised: {
    borderWidth: 1,
    borderTopColor: colors.shadowLight,
    borderLeftColor: colors.shadowLight,
    borderRightColor: colors.shadowDark,
    borderBottomColor: colors.shadowDark,
  },
  flat:       {},
  inset: {
    borderWidth: 1,
    borderTopColor: colors.shadowDark,
    borderLeftColor: colors.shadowDark,
    borderRightColor: colors.shadowLight,
    borderBottomColor: colors.shadowLight,
  },
  gold: {
    borderWidth: 1,
    borderTopColor: colors.goldLight,
    borderLeftColor: colors.goldLight,
    borderRightColor: colors.goldDark,
    borderBottomColor: colors.goldDark,
  },
  completion: {
    borderWidth: 1.5,
    borderTopColor: colors.goldLight,
    borderLeftColor: colors.goldLight,
    borderRightColor: colors.goldDark,
    borderBottomColor: colors.goldDark,
  },
  system: {
    borderWidth: 1,
    borderColor: colors.border,
  },
}) : null;

// ─── Base styles (platform-independent) ──────────────────────────────────────

const base = StyleSheet.create({
  view: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.card,
  },
  inset: { backgroundColor: colors.systemCard },
  gold:  { backgroundColor: colors.goldLight },
  system:{ backgroundColor: colors.systemCard },
});

// ─── Component ────────────────────────────────────────────────────────────────

interface NeumorphicViewProps {
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  variant?: 'raised' | 'flat' | 'inset' | 'gold' | 'completion' | 'system';
  radius?: number;
}

export function NeumorphicView({
  children,
  style,
  variant = 'raised',
  radius,
}: NeumorphicViewProps) {
  const bgOverride = (base as any)[variant] ?? null;
  const shadow = Platform.OS === 'web'
    ? (webShadow as any)?.[variant]
    : (nativeShadow as any)?.[variant];
  const border = Platform.OS === 'web' ? (webBorder as any)?.[variant] : null;

  return (
    <View
      style={[
        base.view,
        bgOverride,
        border,
        shadow as StyleProp<ViewStyle>,
        radius ? { borderRadius: radius } : null,
        style,
      ]}
    >
      {children}
    </View>
  );
}
