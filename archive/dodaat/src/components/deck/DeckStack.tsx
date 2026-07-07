import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useAnimatedStyle,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { SwipeableCard } from './SwipeableCard';
import { ContentCardView } from '../cards/ContentCardView';
import { SystemCardView } from '../cards/SystemCardView';
import { GoldCardView } from '../cards/GoldCardView';
import { colors, cardDimensions, spacing } from '../../theme';
import { useDoodaatStore } from '../../store';
import type { DeckCard, SwipeDirection } from '../../types';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Number of cards visible behind the top card
const VISIBLE_STACK_DEPTH = 3;
const CARD_OFFSET_Y = 12; // vertical offset per card in stack
const CARD_SCALE_FACTOR = 0.03; // scale reduction per card depth

interface DeckStackProps {
  onAccountabilityRecord?: () => void;
}

export function DeckStack({ onAccountabilityRecord }: DeckStackProps) {
  const { deck, currentIndex, profile, goldCard, swipeCard, respondToGoldCard, setGoldCard } =
    useDoodaatStore();

  const visibleCards = deck.slice(currentIndex, currentIndex + VISIBLE_STACK_DEPTH);

  const handleSwipe = async (direction: SwipeDirection) => {
    await swipeCard(direction);
  };

  const handleSystemSwipe = async () => {
    const card = deck[currentIndex];
    if (!card) return;
    // For system cards, swipe right (forward) on the action button tap
    await swipeCard('complete');
  };

  const handleGoldRespond = async (audioUri: string) => {
    // In a real implementation, upload to Blossom and send via Nostr
    await respondToGoldCard();
  };

  const handleGoldDismiss = async () => {
    await setGoldCard(null);
  };

  const intensity = profile?.currentIntensity ?? 'medium';
  const allDone = currentIndex >= deck.length;

  return (
    <View style={styles.container}>
      {/* Gold card — peeks from beneath, always accessible */}
      {goldCard && (
        <View style={styles.goldCardContainer}>
          <GoldCardView
            card={goldCard}
            onRespond={handleGoldRespond}
            onDismiss={handleGoldDismiss}
          />
        </View>
      )}

      {/* Deck stack — rendered back to front */}
      {!allDone && (
        <View style={styles.deckArea}>
          {/* Behind cards (depth > 0, not interactive) */}
          {visibleCards
            .slice(1)
            .reverse()
            .map((card, reverseIndex) => {
              const depth = visibleCards.length - 1 - reverseIndex;
              const scale = 1 - depth * CARD_SCALE_FACTOR;
              const offsetY = depth * CARD_OFFSET_Y;
              return (
                <View
                  key={card.id}
                  style={[
                    styles.stackedCard,
                    {
                      transform: [{ scale }, { translateY: -offsetY }],
                      zIndex: 10 - depth,
                      opacity: 1 - depth * 0.08,
                      pointerEvents: 'none',
                    },
                  ]}
                >
                  {renderCardContent(card, intensity)}
                </View>
              );
            })}

          {/* Top card (interactive) */}
          {visibleCards[0] ? (
            <SwipeableCard
              key={visibleCards[0].id}
              onSwipe={handleSwipe}
              enabled={visibleCards[0].type !== 'system_completion'}
            >
              <View style={{ zIndex: 20 }}>
                {visibleCards[0].type === 'content' ? (
                  renderCardContent(visibleCards[0], intensity)
                ) : visibleCards[0].type === 'gold' ? null : (
                  <SystemCardView
                    card={visibleCards[0] as any}
                    onSwipe={handleSystemSwipe}
                  />
                )}
              </View>
            </SwipeableCard>
          ) : null}
        </View>
      )}
    </View>
  );
}

function renderCardContent(card: DeckCard, intensity: string) {
  if (card.type === 'content') {
    return (
      <ContentCardView
        card={card}
        intensity={intensity as any}
      />
    );
  }
  if (card.type === 'gold') return null;
  return null; // System cards rendered separately
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  goldCardContainer: {
    position: 'absolute',
    bottom: 0,
    left: (SCREEN_WIDTH - cardDimensions.width) / 2,
    zIndex: 5,
    // Peek: only show top portion
  },
  deckArea: {
    width: cardDimensions.width,
    height: cardDimensions.height,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stackedCard: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
});
