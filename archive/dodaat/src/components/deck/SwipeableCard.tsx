import React from 'react';
import { StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  runOnJS,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import {
  Gesture,
  GestureDetector,
} from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';
import type { DeckCard, SwipeDirection } from '../../types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.35;
const ROTATION_FACTOR = 15; // degrees at full swipe

interface SwipeableCardProps {
  children: React.ReactNode;
  onSwipe: (direction: SwipeDirection) => void;
  enabled?: boolean;
}

export function SwipeableCard({ children, onSwipe, enabled = true }: SwipeableCardProps) {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const isActive = useSharedValue(false);

  const triggerHaptic = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const triggerCompletionHaptic = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const flyOut = (direction: SwipeDirection) => {
    const toX = direction === 'complete' ? SCREEN_WIDTH * 1.5 : -SCREEN_WIDTH * 1.5;
    translateX.value = withTiming(toX, { duration: 250 }, () => {
      runOnJS(onSwipe)(direction);
    });
  };

  const pan = Gesture.Pan()
    .enabled(enabled)
    .onBegin(() => {
      isActive.value = true;
    })
    .onUpdate((e) => {
      translateX.value = e.translationX;
      translateY.value = e.translationY * 0.2; // vertical drag dampened
    })
    .onEnd((e) => {
      isActive.value = false;
      const velocity = e.velocityX;
      const displacement = e.translationX;

      if (displacement > SWIPE_THRESHOLD || velocity > 800) {
        // Complete
        runOnJS(triggerCompletionHaptic)();
        flyOut('complete');
      } else if (displacement < -SWIPE_THRESHOLD || velocity < -800) {
        // Skip
        runOnJS(triggerHaptic)();
        flyOut('skip');
      } else {
        // Snap back
        translateX.value = withSpring(0, { damping: 20, stiffness: 300 });
        translateY.value = withSpring(0, { damping: 20, stiffness: 300 });
      }
    });

  const animatedStyle = useAnimatedStyle(() => {
    const rotation = interpolate(
      translateX.value,
      [-SCREEN_WIDTH, 0, SCREEN_WIDTH],
      [-ROTATION_FACTOR, 0, ROTATION_FACTOR],
      Extrapolation.CLAMP
    );

    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { rotate: `${rotation}deg` },
      ],
    };
  });

  return (
    <GestureDetector gesture={pan}>
      <Animated.View style={[styles.container, animatedStyle]}>
        {children}
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
  },
});
