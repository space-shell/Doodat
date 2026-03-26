import React from 'react';
import { View, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { colors, borderRadius } from '../../theme';

interface NeumorphicViewProps {
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  variant?: 'raised' | 'flat' | 'inset' | 'gold' | 'completion' | 'system';
  radius?: number;
}

/**
 * Core neumorphic container. Achieves the dual-shadow extrusion effect
 * by layering two sibling shadows (light top-left, dark bottom-right).
 *
 * On React Native, true inset shadows aren't available, so we simulate
 * neumorphic depth through the elevation/shadowColor/shadowOffset API,
 * plus a subtle border trick for the light edge.
 */
export function NeumorphicView({
  children,
  style,
  variant = 'raised',
  radius,
}: NeumorphicViewProps) {
  return (
    <View style={[styles.base, styles[variant], radius ? { borderRadius: radius } : null, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.card,
    // React Native only supports one shadow direction,
    // so we use a slightly elevated card + border to simulate the neumorphic look.
  },
  raised: {
    // Primary dark shadow (bottom-right)
    shadowColor: colors.shadowDark,
    shadowOffset: { width: 8, height: 8 },
    shadowOpacity: 0.55,
    shadowRadius: 14,
    elevation: 8,
    // Simulate light top-left edge via border
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
    // Recessed appearance for system cards
    backgroundColor: colors.systemCard,
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
    backgroundColor: colors.goldLight,
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
    backgroundColor: colors.systemCard,
    shadowColor: colors.shadowDark,
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: colors.border,
  },
});
