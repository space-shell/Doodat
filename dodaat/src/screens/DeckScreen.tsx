import React, { useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { DeckStack } from '../components/deck/DeckStack';
import { colors, typography, spacing } from '../theme';
import { useDoodaatStore } from '../store';

export function DeckScreen() {
  const { profile, initialized, injectSystemCard } = useDoodaatStore();

  const handleSettingsPress = () => {
    injectSystemCard({ id: 'sys-settings-' + Date.now(), type: 'system_settings' }, 0);
  };

  if (!initialized) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.textMuted} />
        <Text style={styles.loadingText}>dodaat</Text>
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.appNameSmall}>dodaat</Text>
          <TouchableOpacity
            style={styles.settingsButton}
            onPress={handleSettingsPress}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Text style={styles.settingsIcon}>⚙</Text>
          </TouchableOpacity>
        </View>

        {/* Deck */}
        <View style={styles.deckContainer}>
          <DeckStack />
        </View>

        {/* Footer — intensity indicator */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            {profile?.currentIntensity ?? 'medium'} intensity this week
          </Text>
        </View>
      </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
  },
  loadingText: {
    ...typography.tagline,
    fontSize: 18,
    letterSpacing: 2,
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl + 24, // safe area
    paddingBottom: spacing.lg,
  },
  appNameSmall: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },
  settingsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.systemCard,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.shadowDark,
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
    borderWidth: 1,
    borderColor: colors.shadowLight,
  },
  settingsIcon: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  deckContainer: {
    flex: 1,
  },
  footer: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xl + 16, // safe area
    alignItems: 'center',
  },
  footerText: {
    ...typography.tagline,
    textTransform: 'capitalize',
  },
});
