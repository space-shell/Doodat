// ─── Domain Types ────────────────────────────────────────────────────────────

export type Domain = 'physical' | 'mental' | 'spiritual';

export type IntensityLevel = 'low' | 'medium' | 'high';

export type SwipeDirection = 'complete' | 'skip';

// ─── Card Types ───────────────────────────────────────────────────────────────

export type CardType =
  | 'content'
  | 'system_welcome'
  | 'system_wizard'
  | 'system_intensity'
  | 'system_accountability'
  | 'system_review'
  | 'system_settings'
  | 'system_identity'
  | 'system_preferences'
  | 'system_prestige'
  | 'system_completion'
  | 'gold';

export interface ContentCard {
  id: string;
  type: 'content';
  domain: Domain;
  category: string;
  intensity_low: string;
  intensity_medium: string;
  intensity_high: string;
  context?: string;
  tradition?: string;
  passage_ref?: string;
  expanded_link?: string;
  cross_tradition_pair?: string;
  agnostic_interpretation?: string;
  tags: string[];
  created_at: number;
}

export interface SystemCard {
  id: string;
  type: Exclude<CardType, 'content' | 'gold'>;
  payload?: Record<string, unknown>;
}

export interface GoldCard {
  id: string;
  type: 'gold';
  voiceNoteId: string;
  audioUrl: string;
  nostrEventId: string;
  senderPubkey: string; // never shown to user
  receivedAt: number;
  heard: boolean;
  responded: boolean;
}

export type DeckCard = ContentCard | SystemCard | GoldCard;

// ─── Onboarding Preferences ───────────────────────────────────────────────────

export interface PhysicalPreferences {
  focusAreas: ('upper_body' | 'lower_body' | 'full_body' | 'flexibility' | 'cardio')[];
  fastingInterest: boolean;
  dietaryPreferences: string[];
}

export interface MentalPreferences {
  challenges: ('focus' | 'anxiety' | 'creativity' | 'discipline')[];
  readingPreferences: string[];
  writingComfort: boolean;
}

export interface SpiritualPreferences {
  // 0 = secular, 100 = tradition-specific
  traditionProximity: number;
  traditions: string[];
}

export interface UserPreferences {
  physical: PhysicalPreferences;
  mental: MentalPreferences;
  spiritual: SpiritualPreferences;
}

// ─── User Profile ─────────────────────────────────────────────────────────────

export interface PrestigeBadge {
  year: number;
  earnedAt: number;
}

export interface UserProfile {
  pubkey: string;
  praisePoints: number;
  prestigeBadges: PrestigeBadge[];
  currentIntensity: IntensityLevel;
  intensitySetAt: number; // timestamp of last weekly intensity selection
  preferences?: UserPreferences;
  onboardingComplete: boolean;
  notificationTime: 'morning' | 'midday' | 'evening';
}

// ─── Daily State ──────────────────────────────────────────────────────────────

export interface CardOutcome {
  cardId: string;
  domain: Domain;
  swipeDirection: SwipeDirection;
  intensity: IntensityLevel;
  timestamp: number;
}

export interface DailyState {
  date: string; // YYYY-MM-DD
  outcomes: CardOutcome[];
  voiceNoteSubmitted: boolean;
  goldCardResponded: boolean;
}

// ─── Nostr ────────────────────────────────────────────────────────────────────

export interface NostrKeypair {
  privateKey: string; // hex
  publicKey: string;  // hex
}

// ─── Voice Notes ──────────────────────────────────────────────────────────────

export interface VoiceNote {
  id: string;
  audioUrl: string;
  duration: number;
  nostrEventId: string;
  timestamp: number;
}

export interface IncomingVoiceNote extends VoiceNote {
  heard: boolean;
  responded: boolean;
}
