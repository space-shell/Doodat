import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { NeumorphicView } from '../ui/NeumorphicView';
import { colors, typography, spacing, cardDimensions, getDomainColor } from '../../theme';
import { getCardTask } from '../../utils/deck';
import type { ContentCard, IntensityLevel } from '../../types';

interface ContentCardViewProps {
  card: ContentCard;
  intensity: IntensityLevel;
  /** Swipe progress 0–1 for animating domain indicator. */
  dragProgress?: number;
}

const DOMAIN_LABELS: Record<string, string> = {
  physical: 'Physical',
  mental: 'Mental',
  spiritual: 'Spiritual',
};

const INTENSITY_LABELS: Record<IntensityLevel, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
};

export function ContentCardView({ card, intensity }: ContentCardViewProps) {
  const domainColor = getDomainColor(card.domain);
  const task = getCardTask(card, intensity);

  return (
    <NeumorphicView
      style={[styles.card, { width: cardDimensions.width, height: cardDimensions.height }]}
      variant="raised"
    >
      {/* Domain colour bar */}
      <View style={[styles.domainBar, { backgroundColor: domainColor }]} />

      <View style={styles.content}>
        {/* Header row */}
        <View style={styles.headerRow}>
          <View style={[styles.domainPill, { backgroundColor: domainColor + '20' }]}>
            <Text style={[styles.domainLabel, { color: domainColor }]}>
              {DOMAIN_LABELS[card.domain]}
            </Text>
          </View>
          <View style={[styles.intensityPill, { borderColor: domainColor + '40' }]}>
            <Text style={[styles.intensityLabel, { color: colors.textMuted }]}>
              {INTENSITY_LABELS[intensity]}
            </Text>
          </View>
        </View>

        {/* Task */}
        <View style={styles.taskContainer}>
          <Text style={styles.taskText}>{task}</Text>
        </View>

        {/* Context / why */}
        {card.context ? (
          <View style={styles.contextContainer}>
            <View style={[styles.contextDivider, { backgroundColor: domainColor + '30' }]} />
            <Text style={styles.contextText}>{card.context}</Text>
          </View>
        ) : null}

        {/* Tradition / passage ref for spiritual cards */}
        {card.tradition ? (
          <View style={styles.traditionContainer}>
            <Text style={styles.traditionText}>
              {card.tradition}
              {card.passage_ref ? ` · ${card.passage_ref}` : ''}
            </Text>
          </View>
        ) : null}
      </View>

      {/* Swipe hints */}
      <View style={styles.swipeHints}>
        <Text style={styles.swipeHintText}>← skip</Text>
        <Text style={styles.swipeHintText}>done →</Text>
      </View>
    </NeumorphicView>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 24,
    overflow: 'hidden',
  },
  domainBar: {
    height: 4,
    width: '100%',
    opacity: 0.7,
  },
  content: {
    flex: 1,
    padding: spacing.xl,
    justifyContent: 'flex-start',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  domainPill: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 50,
  },
  domainLabel: {
    ...typography.domainLabel,
  },
  intensityPill: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 50,
    borderWidth: 1,
  },
  intensityLabel: {
    ...typography.intensityBadge,
  },
  taskContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  taskText: {
    ...typography.cardBody,
    fontSize: 18,
    lineHeight: 28,
    color: colors.textPrimary,
  },
  contextContainer: {
    marginTop: spacing.lg,
  },
  contextDivider: {
    height: 1,
    width: 40,
    marginBottom: spacing.md,
    borderRadius: 1,
  },
  contextText: {
    ...typography.cardContext,
  },
  traditionContainer: {
    marginTop: spacing.sm,
  },
  traditionText: {
    ...typography.tagline,
    fontSize: 12,
  },
  swipeHints: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.lg,
  },
  swipeHintText: {
    ...typography.tagline,
    fontSize: 11,
  },
});
