import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Switch,
} from 'react-native';
import { NeumorphicView } from '../ui/NeumorphicView';
import { colors, typography, spacing, cardDimensions } from '../../theme';
import type { SystemCard, IntensityLevel } from '../../types';
import { useDoodaatStore } from '../../store';

interface SystemCardViewProps {
  card: SystemCard;
  onSwipe: () => void;
}

export function SystemCardView({ card, onSwipe }: SystemCardViewProps) {
  switch (card.type) {
    case 'system_welcome':
      return <WelcomeCard onSwipe={onSwipe} />;
    case 'system_wizard':
      return <WizardCard card={card} onSwipe={onSwipe} />;
    case 'system_intensity':
      return <IntensityCard card={card} onSwipe={onSwipe} />;
    case 'system_accountability':
      return <AccountabilityCard onSwipe={onSwipe} />;
    case 'system_completion':
      return <CompletionCard />;
    case 'system_review':
      return <ReviewCard onSwipe={onSwipe} />;
    case 'system_settings':
      return <SettingsCard onSwipe={onSwipe} />;
    case 'system_identity':
      return <IdentityCard onSwipe={onSwipe} />;
    default:
      return null;
  }
}

// ─── Welcome Card ─────────────────────────────────────────────────────────────

function WelcomeCard({ onSwipe }: { onSwipe: () => void }) {
  return (
    <NeumorphicView
      style={[styles.card, { width: cardDimensions.width, height: cardDimensions.height }]}
      variant="system"
    >
      <View style={styles.centeredContent}>
        <Text style={styles.appName}>dodaat</Text>
        <Text style={styles.tagline}>do one day at a time</Text>
        <View style={styles.divider} />
        <Text style={styles.bodyText}>
          This is a daily ritual.{'\n\n'}
          Each day, you receive nine cards.{'\n'}
          Three physical. Three mental. Three spiritual.{'\n\n'}
          Swipe right when you are done.{'\n'}
          Swipe left to skip.{'\n\n'}
          That is all.
        </Text>
        <TouchableOpacity style={styles.primaryButton} onPress={onSwipe}>
          <Text style={styles.primaryButtonText}>Begin →</Text>
        </TouchableOpacity>
      </View>
    </NeumorphicView>
  );
}

// ─── Wizard Cards ─────────────────────────────────────────────────────────────

function WizardCard({ card, onSwipe }: { card: SystemCard; onSwipe: () => void }) {
  const step = (card.payload as Record<string, string>)?.step;
  const { keypair, profile, updateProfile, initializeApp } = useDoodaatStore();

  const handleStart = async () => {
    await updateProfile({ onboardingComplete: true });
    // Rebuild the deck with daily content cards. initializeApp resets currentIndex
    // to 0 and replaces the wizard deck — no need to call onSwipe() afterwards.
    if (keypair) await initializeApp(keypair);
  };

  if (step === 'allset') {
    return (
      <NeumorphicView
        style={[styles.card, { width: cardDimensions.width, height: cardDimensions.height }]}
        variant="system"
      >
        <View style={styles.centeredContent}>
          <Text style={styles.heading}>All set.</Text>
          <Text style={styles.bodyText}>
            Your first deck is ready.{'\n\n'}
            Remember: this is not about perfection.{'\n'}
            It is about showing up, one day at a time.
          </Text>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleStart}
          >
            <Text style={styles.primaryButtonText}>Start →</Text>
          </TouchableOpacity>
        </View>
      </NeumorphicView>
    );
  }

  return (
    <PreferenceWizardCard step={step} onSwipe={onSwipe} />
  );
}

function PreferenceWizardCard({
  step,
  onSwipe,
}: {
  step: string;
  onSwipe: () => void;
}) {
  const store = useDoodaatStore();
  const [fastingInterest, setFastingInterest] = useState(false);
  const [writingComfort, setWritingComfort] = useState(true);
  const [traditionProximity, setTraditionProximity] = useState(50);
  const [selectedFocusAreas, setSelectedFocusAreas] = useState<string[]>([]);
  const [selectedChallenges, setSelectedChallenges] = useState<string[]>([]);
  const [selectedTraditions, setSelectedTraditions] = useState<string[]>([]);

  const title =
    step === 'physical'
      ? 'Physical Preferences'
      : step === 'mental'
      ? 'Mental Preferences'
      : 'Spiritual Preferences';

  const handleSave = async () => {
    const currentPrefs = store.profile?.preferences ?? {
      physical: { focusAreas: [], fastingInterest: false, dietaryPreferences: [] },
      mental: { challenges: [], readingPreferences: [], writingComfort: true },
      spiritual: { traditionProximity: 50, traditions: [] },
    };

    if (step === 'physical') {
      await store.updateProfile({
        preferences: {
          ...currentPrefs,
          physical: {
            focusAreas: selectedFocusAreas as any,
            fastingInterest,
            dietaryPreferences: [],
          },
        },
      });
    } else if (step === 'mental') {
      await store.updateProfile({
        preferences: {
          ...currentPrefs,
          mental: {
            challenges: selectedChallenges as any,
            readingPreferences: [],
            writingComfort,
          },
        },
      });
    } else if (step === 'spiritual') {
      await store.updateProfile({
        preferences: {
          ...currentPrefs,
          spiritual: {
            traditionProximity,
            traditions: selectedTraditions,
          },
        },
      });
    }

    onSwipe();
  };

  return (
    <NeumorphicView
      style={[styles.card, { width: cardDimensions.width, height: cardDimensions.height }]}
      variant="system"
    >
      <ScrollView contentContainerStyle={styles.wizardContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.heading}>{title}</Text>

        {step === 'physical' && (
          <>
            <Text style={styles.label}>Focus areas</Text>
            {(['upper_body', 'lower_body', 'full_body', 'flexibility', 'cardio'] as const).map((area) => (
              <ToggleChip
                key={area}
                label={area.replace('_', ' ')}
                selected={selectedFocusAreas.includes(area)}
                onToggle={() =>
                  setSelectedFocusAreas((prev) =>
                    prev.includes(area) ? prev.filter((a) => a !== area) : [...prev, area]
                  )
                }
              />
            ))}
            <View style={styles.toggleRow}>
              <Text style={styles.label}>Interested in fasting?</Text>
              <Switch
                value={fastingInterest}
                onValueChange={setFastingInterest}
                trackColor={{ true: colors.physical }}
              />
            </View>
          </>
        )}

        {step === 'mental' && (
          <>
            <Text style={styles.label}>Areas to work on</Text>
            {(['focus', 'anxiety', 'creativity', 'discipline'] as const).map((c) => (
              <ToggleChip
                key={c}
                label={c}
                selected={selectedChallenges.includes(c)}
                onToggle={() =>
                  setSelectedChallenges((prev) =>
                    prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]
                  )
                }
              />
            ))}
            <View style={styles.toggleRow}>
              <Text style={styles.label}>Comfortable with writing?</Text>
              <Switch
                value={writingComfort}
                onValueChange={setWritingComfort}
                trackColor={{ true: colors.mental }}
              />
            </View>
          </>
        )}

        {step === 'spiritual' && (
          <>
            <Text style={styles.label}>
              Secular ←→ Tradition-specific
            </Text>
            <Text style={styles.proximityValue}>{traditionProximity}%</Text>
            <Text style={styles.bodyText}>
              Drag to set your spiritual orientation
            </Text>
            <Text style={styles.label}>Traditions (optional)</Text>
            {(['Christianity', 'Islam', 'Buddhism', 'Hinduism', 'Taoism', 'Stoicism', 'Judaism', 'Sikhism'] as const).map((t) => (
              <ToggleChip
                key={t}
                label={t}
                selected={selectedTraditions.includes(t)}
                onToggle={() =>
                  setSelectedTraditions((prev) =>
                    prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]
                  )
                }
              />
            ))}
          </>
        )}
      </ScrollView>

      <TouchableOpacity style={styles.primaryButton} onPress={handleSave}>
        <Text style={styles.primaryButtonText}>Confirm →</Text>
      </TouchableOpacity>
    </NeumorphicView>
  );
}

// ─── Intensity Card ───────────────────────────────────────────────────────────

function IntensityCard({ card, onSwipe }: { card: SystemCard; onSwipe: () => void }) {
  const { setWeeklyIntensity } = useDoodaatStore();
  const [selected, setSelected] = useState<IntensityLevel>('medium');

  const handleConfirm = async () => {
    await setWeeklyIntensity(selected);
    onSwipe();
  };

  const levels: Array<{
    id: IntensityLevel;
    label: string;
    description: string;
  }> = [
    {
      id: 'low',
      label: 'Low',
      description: 'Minimum viable. Short durations, gentle effort, entry-level engagement.',
    },
    {
      id: 'medium',
      label: 'Medium',
      description: 'Moderate effort. Standard durations and engagement depth.',
    },
    {
      id: 'high',
      label: 'High',
      description: 'Maximum effort. Extended durations, deeper engagement, greater challenge.',
    },
  ];

  return (
    <NeumorphicView
      style={[styles.card, { width: cardDimensions.width, height: cardDimensions.height }]}
      variant="system"
    >
      <View style={styles.centeredContent}>
        <Text style={styles.heading}>This week's intensity</Text>
        <Text style={styles.subheading}>Choose how hard to push this week.</Text>

        {levels.map(({ id, label, description }) => (
          <TouchableOpacity
            key={id}
            style={[styles.intensityOption, selected === id && styles.intensitySelected]}
            onPress={() => setSelected(id)}
            activeOpacity={0.8}
          >
            <Text style={[styles.intensityLabel, selected === id && styles.intensityLabelSelected]}>
              {label}
            </Text>
            <Text style={styles.intensityDescription}>{description}</Text>
          </TouchableOpacity>
        ))}

        <TouchableOpacity style={styles.primaryButton} onPress={handleConfirm}>
          <Text style={styles.primaryButtonText}>Confirm →</Text>
        </TouchableOpacity>
      </View>
    </NeumorphicView>
  );
}

// ─── Accountability Card ──────────────────────────────────────────────────────

function AccountabilityCard({ onSwipe }: { onSwipe: () => void }) {
  return (
    <NeumorphicView
      style={[styles.card, { width: cardDimensions.width, height: cardDimensions.height }]}
      variant="system"
    >
      <View style={styles.centeredContent}>
        <Text style={styles.heading}>A moment of honesty.</Text>
        <Text style={styles.bodyText}>
          Today has been hard. That is okay.{'\n\n'}
          Record a 30-second voice note — just for this community. Say whatever is true.
          No one will know it is you.
        </Text>
        <TouchableOpacity style={styles.primaryButton} onPress={onSwipe}>
          <Text style={styles.primaryButtonText}>Record →</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.skipLink} onPress={onSwipe}>
          <Text style={styles.skipLinkText}>Not today</Text>
        </TouchableOpacity>
      </View>
    </NeumorphicView>
  );
}

// ─── Completion Card ──────────────────────────────────────────────────────────

function CompletionCard() {
  const { getWeeklyStats, profile } = useDoodaatStore();
  const stats = getWeeklyStats();

  return (
    <NeumorphicView
      style={[styles.card, { width: cardDimensions.width, height: cardDimensions.height }]}
      variant="completion"
    >
      <View style={styles.centeredContent}>
        <Text style={styles.heading}>Today's deck, done.</Text>
        <View style={styles.statsRow}>
          <StatItem label="Completed" value={String(stats.completed)} />
          <StatItem label="Skipped" value={String(stats.skipped)} />
        </View>
        <View style={styles.domainBreakdown}>
          {Object.entries(stats.breakdown).map(([domain, count]) => (
            <Text key={domain} style={styles.breakdownText}>
              {domain}: {count} card{count !== 1 ? 's' : ''}
            </Text>
          ))}
        </View>
        <Text style={styles.bodyText}>
          Come back tomorrow.{'\n'}One day at a time.
        </Text>
        <Text style={styles.praisePoints}>
          ◆ {profile?.praisePoints ?? 0} praise points
        </Text>
      </View>
    </NeumorphicView>
  );
}

// ─── Review Card ─────────────────────────────────────────────────────────────

function ReviewCard({ onSwipe }: { onSwipe: () => void }) {
  const { getWeeklyStats, profile } = useDoodaatStore();
  const stats = getWeeklyStats();

  return (
    <NeumorphicView
      style={[styles.card, { width: cardDimensions.width, height: cardDimensions.height }]}
      variant="system"
    >
      <View style={styles.centeredContent}>
        <Text style={styles.heading}>This week.</Text>
        <StatItem label="Cards completed" value={String(stats.completed)} />
        {Object.entries(stats.breakdown).map(([domain, count]) => (
          <StatItem key={domain} label={domain} value={String(count)} />
        ))}
        <StatItem label="Praise points" value={String(profile?.praisePoints ?? 0)} />
        {(profile?.prestigeBadges?.length ?? 0) > 0 && (
          <View style={styles.badgeRow}>
            {profile!.prestigeBadges.map((badge) => (
              <Text key={badge.year} style={styles.badge}>
                ◆{badge.year}
              </Text>
            ))}
          </View>
        )}
        <TouchableOpacity style={styles.primaryButton} onPress={onSwipe}>
          <Text style={styles.primaryButtonText}>Continue →</Text>
        </TouchableOpacity>
      </View>
    </NeumorphicView>
  );
}

// ─── Settings Card ────────────────────────────────────────────────────────────

function SettingsCard({ onSwipe }: { onSwipe: () => void }) {
  const { injectSystemCard } = useDoodaatStore();

  const openIdentity = () => {
    injectSystemCard({ id: 'sys-identity', type: 'system_identity' }, 0);
  };

  return (
    <NeumorphicView
      style={[styles.card, { width: cardDimensions.width, height: cardDimensions.height }]}
      variant="system"
    >
      <View style={styles.centeredContent}>
        <Text style={styles.heading}>Settings</Text>

        <SettingsOption label="Identity & Keys" onPress={openIdentity} />
        <SettingsOption label="Notification Time" onPress={() => {}} />
        <SettingsOption label="Preferences" onPress={() => {}} />

        <TouchableOpacity style={styles.skipLink} onPress={onSwipe}>
          <Text style={styles.primaryButtonText}>Done →</Text>
        </TouchableOpacity>
      </View>
    </NeumorphicView>
  );
}

// ─── Identity Card ────────────────────────────────────────────────────────────

function IdentityCard({ onSwipe }: { onSwipe: () => void }) {
  const { keypair } = useDoodaatStore();

  return (
    <NeumorphicView
      style={[styles.card, { width: cardDimensions.width, height: cardDimensions.height }]}
      variant="system"
    >
      <View style={styles.centeredContent}>
        <Text style={styles.heading}>Your Identity</Text>
        <Text style={styles.bodyText}>
          You are identified by a Nostr keypair generated on your device.
          No email. No name. No account.
        </Text>
        <View style={styles.keyContainer}>
          <Text style={styles.keyLabel}>Public Key</Text>
          <Text style={styles.keyValue} numberOfLines={2} selectable>
            {keypair?.publicKey ?? '—'}
          </Text>
        </View>
        <Text style={styles.bodyText}>
          Back up your private key from the settings to restore your identity on a new device.
        </Text>
        <TouchableOpacity style={styles.primaryButton} onPress={onSwipe}>
          <Text style={styles.primaryButtonText}>Done →</Text>
        </TouchableOpacity>
      </View>
    </NeumorphicView>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ToggleChip({
  label,
  selected,
  onToggle,
}: {
  label: string;
  selected: boolean;
  onToggle: () => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.chip, selected && styles.chipSelected]}
      onPress={onToggle}
      activeOpacity={0.8}
    >
      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{label}</Text>
    </TouchableOpacity>
  );
}

function StatItem({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statItem}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

function SettingsOption({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.settingsOption} onPress={onPress} activeOpacity={0.7}>
      <Text style={styles.settingsOptionText}>{label}</Text>
      <Text style={styles.settingsArrow}>›</Text>
    </TouchableOpacity>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  card: {
    borderRadius: 24,
    overflow: 'hidden',
  },
  centeredContent: {
    flex: 1,
    padding: spacing.xl,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.md,
  },
  wizardContent: {
    padding: spacing.xl,
    gap: spacing.md,
    paddingBottom: spacing.xxl,
  },
  appName: {
    ...typography.appName,
    textAlign: 'center',
  },
  tagline: {
    ...typography.tagline,
    textAlign: 'center',
    fontSize: 15,
  },
  heading: {
    ...typography.heading,
    textAlign: 'center',
  },
  subheading: {
    ...typography.cardBody,
    textAlign: 'center',
    color: colors.textSecondary,
  },
  bodyText: {
    ...typography.cardBody,
    textAlign: 'center',
  },
  divider: {
    height: 1,
    width: 40,
    backgroundColor: colors.border,
    marginVertical: spacing.sm,
  },
  primaryButton: {
    backgroundColor: colors.textPrimary,
    borderRadius: 50,
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.md,
    marginTop: spacing.md,
  },
  primaryButtonText: {
    color: colors.white,
    fontWeight: '600' as const,
    fontSize: 16,
    textAlign: 'center',
  },
  skipLink: {
    marginTop: spacing.sm,
  },
  skipLinkText: {
    ...typography.tagline,
    textDecorationLine: 'underline',
  },
  // Intensity selector
  intensityOption: {
    width: '100%',
    padding: spacing.md,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm,
  },
  intensitySelected: {
    borderColor: colors.textPrimary,
    backgroundColor: colors.textPrimary + '08',
  },
  intensityLabel: {
    ...typography.cardTitle,
    fontSize: 16,
  },
  intensityLabelSelected: {
    color: colors.textPrimary,
  },
  intensityDescription: {
    ...typography.cardContext,
    marginTop: spacing.xs,
    fontStyle: 'normal',
  },
  // Completion
  statsRow: {
    flexDirection: 'row',
    gap: spacing.xl,
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    ...typography.tagline,
  },
  statValue: {
    ...typography.cardTitle,
    fontSize: 28,
  },
  domainBreakdown: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  breakdownText: {
    ...typography.cardBody,
    fontSize: 14,
    textTransform: 'capitalize',
  },
  praisePoints: {
    ...typography.tagline,
    color: colors.gold,
    fontWeight: '600' as const,
    fontSize: 14,
  },
  // Review
  badgeRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  badge: {
    color: colors.gold,
    fontSize: 18,
    fontWeight: '700' as const,
  },
  // Wizard chips
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 50,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.xs,
  },
  chipSelected: {
    borderColor: colors.textPrimary,
    backgroundColor: colors.textPrimary + '10',
  },
  chipText: {
    ...typography.cardBody,
    fontSize: 14,
    textTransform: 'capitalize',
  },
  chipTextSelected: {
    color: colors.textPrimary,
    fontWeight: '600' as const,
  },
  label: {
    ...typography.domainLabel,
    marginTop: spacing.md,
    alignSelf: 'flex-start',
  },
  proximityValue: {
    ...typography.cardTitle,
    fontSize: 32,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginTop: spacing.md,
  },
  // Settings
  settingsOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  settingsOptionText: {
    ...typography.cardBody,
  },
  settingsArrow: {
    fontSize: 20,
    color: colors.textMuted,
  },
  // Identity
  keyContainer: {
    width: '100%',
    padding: spacing.md,
    backgroundColor: colors.systemCard,
    borderRadius: 12,
  },
  keyLabel: {
    ...typography.domainLabel,
    marginBottom: spacing.xs,
  },
  keyValue: {
    ...typography.tagline,
    fontSize: 11,
    fontFamily: 'monospace',
    color: colors.textSecondary,
  },
});
