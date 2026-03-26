import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Alert,
} from 'react-native';
import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';
import { NeumorphicView } from '../ui/NeumorphicView';
import { colors, typography, spacing, cardDimensions } from '../../theme';
import type { GoldCard } from '../../types';

interface GoldCardViewProps {
  card: GoldCard;
  onRespond: (audioUri: string) => Promise<void>;
  onDismiss: () => void;
}

type GoldCardState = 'peek' | 'listening' | 'recording' | 'done';

export function GoldCardView({ card, onRespond, onDismiss }: GoldCardViewProps) {
  const [state, setState] = useState<GoldCardState>('peek');
  const [playbackProgress, setPlaybackProgress] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingUri, setRecordingUri] = useState<string | null>(null);
  const [recordingSeconds, setRecordingSeconds] = useState(0);

  const soundRef = useRef<Audio.Sound | null>(null);
  const recordingRef = useRef<Audio.Recording | null>(null);
  const recordTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const handleExpand = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setState('listening');
    await playVoiceNote();
  };

  const playVoiceNote = async () => {
    try {
      const { sound } = await Audio.Sound.createAsync(
        { uri: card.audioUrl },
        { shouldPlay: true },
        (status) => {
          if (status.isLoaded && status.durationMillis) {
            setPlaybackProgress(
              (status.positionMillis ?? 0) / status.durationMillis
            );
            if (status.didJustFinish) {
              setState('recording');
            }
          }
        }
      );
      soundRef.current = sound;
    } catch {
      setState('recording');
    }
  };

  const startRecording = async () => {
    try {
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      recordingRef.current = recording;
      setIsRecording(true);
      setRecordingSeconds(0);

      recordTimerRef.current = setInterval(() => {
        setRecordingSeconds((s) => {
          if (s >= 29) {
            stopRecording();
            return 30;
          }
          return s + 1;
        });
      }, 1000);
    } catch (e) {
      Alert.alert('Recording Error', 'Could not start recording.');
    }
  };

  const stopRecording = async () => {
    if (recordTimerRef.current) clearInterval(recordTimerRef.current);
    if (!recordingRef.current) return;

    try {
      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();
      setRecordingUri(uri);
      setIsRecording(false);
    } catch {
      setIsRecording(false);
    }
  };

  const handleSubmitResponse = async () => {
    if (!recordingUri) return;
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await onRespond(recordingUri);
    setState('done');
  };

  if (state === 'peek') {
    return (
      <TouchableOpacity onPress={handleExpand} activeOpacity={0.9}>
        <NeumorphicView
          style={[styles.peekCard, { width: cardDimensions.width }]}
          variant="gold"
        >
          <View style={styles.peekContent}>
            <Text style={styles.goldDot}>◆</Text>
            <Text style={styles.peekText}>Someone needs a moment of your time.</Text>
            <Text style={styles.peekHint}>Tap to listen</Text>
          </View>
        </NeumorphicView>
      </TouchableOpacity>
    );
  }

  if (state === 'listening') {
    return (
      <NeumorphicView
        style={[styles.fullCard, { width: cardDimensions.width, height: cardDimensions.height }]}
        variant="gold"
      >
        <View style={styles.fullContent}>
          <Text style={styles.goldDot}>◆</Text>
          <Text style={styles.listeningTitle}>Listening…</Text>
          <Text style={styles.listeningSubtitle}>
            Someone shared something honest with this community.
          </Text>

          {/* Progress bar */}
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${playbackProgress * 100}%` }]} />
          </View>

          <Text style={styles.anonymousNote}>Anonymous · 30 seconds max</Text>
        </View>
      </NeumorphicView>
    );
  }

  if (state === 'recording') {
    return (
      <NeumorphicView
        style={[styles.fullCard, { width: cardDimensions.width, height: cardDimensions.height }]}
        variant="gold"
      >
        <View style={styles.fullContent}>
          <Text style={styles.goldDot}>◆</Text>
          <Text style={styles.listeningTitle}>
            {isRecording ? 'Recording…' : 'Your turn'}
          </Text>
          <Text style={styles.listeningSubtitle}>
            {isRecording
              ? 'Say something kind. You have 30 seconds.'
              : recordingUri
              ? 'Ready to send.'
              : 'Record a 30-second response for this person.'}
          </Text>

          {/* Recording timer */}
          {isRecording ? (
            <View style={styles.timerContainer}>
              <Text style={styles.timerText}>{30 - recordingSeconds}s</Text>
              <View style={[styles.progressTrack, { marginTop: spacing.sm }]}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${(recordingSeconds / 30) * 100}%` },
                  ]}
                />
              </View>
            </View>
          ) : null}

          <View style={styles.recordActions}>
            {!isRecording && !recordingUri ? (
              <TouchableOpacity style={styles.recordButton} onPress={startRecording}>
                <Text style={styles.recordButtonText}>Hold to Record</Text>
              </TouchableOpacity>
            ) : isRecording ? (
              <TouchableOpacity style={styles.stopButton} onPress={stopRecording}>
                <Text style={styles.recordButtonText}>Stop</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.responseActions}>
                <TouchableOpacity style={styles.retryButton} onPress={() => setRecordingUri(null)}>
                  <Text style={styles.retryText}>Redo</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.sendButton} onPress={handleSubmitResponse}>
                  <Text style={styles.sendText}>Send</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          <TouchableOpacity onPress={onDismiss} style={styles.dismissLink}>
            <Text style={styles.dismissText}>Not today</Text>
          </TouchableOpacity>
        </View>
      </NeumorphicView>
    );
  }

  // Done state
  return (
    <NeumorphicView
      style={[styles.fullCard, { width: cardDimensions.width, height: cardDimensions.height }]}
      variant="gold"
    >
      <View style={styles.fullContent}>
        <Text style={styles.goldDot}>◆</Text>
        <Text style={styles.listeningTitle}>Sent.</Text>
        <Text style={styles.listeningSubtitle}>
          Your response is on its way to them. Thank you.
        </Text>
        <Text style={styles.praiseNote}>+1 praise point</Text>
        <TouchableOpacity style={styles.sendButton} onPress={onDismiss}>
          <Text style={styles.sendText}>Done</Text>
        </TouchableOpacity>
      </View>
    </NeumorphicView>
  );
}

const spacing_local = spacing;

const styles = StyleSheet.create({
  peekCard: {
    borderRadius: 24,
    paddingVertical: spacing.lg,
  },
  peekContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
  },
  goldDot: {
    color: colors.gold,
    fontSize: 18,
  },
  peekText: {
    flex: 1,
    ...typography.cardBody,
    color: colors.textOnGold,
    fontSize: 15,
  },
  peekHint: {
    ...typography.tagline,
    color: colors.goldDark,
    fontSize: 12,
  },
  fullCard: {
    borderRadius: 24,
    overflow: 'hidden',
  },
  fullContent: {
    flex: 1,
    padding: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
  },
  listeningTitle: {
    ...typography.heading,
    color: colors.textOnGold,
    fontSize: 28,
    textAlign: 'center',
  },
  listeningSubtitle: {
    ...typography.cardBody,
    color: colors.textOnGold,
    textAlign: 'center',
    opacity: 0.8,
  },
  progressTrack: {
    width: '100%',
    height: 4,
    backgroundColor: colors.goldDark + '30',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.gold,
    borderRadius: 2,
  },
  anonymousNote: {
    ...typography.tagline,
    color: colors.textOnGold,
    opacity: 0.5,
  },
  timerContainer: {
    width: '100%',
    alignItems: 'center',
  },
  timerText: {
    fontSize: 48,
    fontWeight: '300' as const,
    color: colors.textOnGold,
  },
  recordActions: {
    width: '100%',
    alignItems: 'center',
  },
  recordButton: {
    backgroundColor: colors.gold,
    borderRadius: 50,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  stopButton: {
    backgroundColor: colors.goldDark,
    borderRadius: 50,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  recordButtonText: {
    ...typography.cardBody,
    color: colors.white,
    fontWeight: '600' as const,
  },
  responseActions: {
    flexDirection: 'row',
    gap: spacing.lg,
  },
  retryButton: {
    borderWidth: 1,
    borderColor: colors.goldDark,
    borderRadius: 50,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  retryText: {
    ...typography.cardBody,
    color: colors.textOnGold,
  },
  sendButton: {
    backgroundColor: colors.gold,
    borderRadius: 50,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  sendText: {
    ...typography.cardBody,
    color: colors.white,
    fontWeight: '600' as const,
  },
  praiseNote: {
    ...typography.tagline,
    color: colors.goldDark,
    fontWeight: '600' as const,
  },
  dismissLink: {
    marginTop: spacing.sm,
  },
  dismissText: {
    ...typography.tagline,
    color: colors.textOnGold,
    opacity: 0.5,
    textDecorationLine: 'underline',
  },
});
