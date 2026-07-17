/**
 * Feature flags. New user-facing features must ship OFF (false) and land on
 * `main` inert. Flip to true only when fully tested; remove the flag once the
 * feature has been live and stable for a release cycle. Never ship a
 * permanently-true flag — that is dead conditional code.
 */
export const FLAGS = {
  NOSTR_IDENTITY: true, // per-task day-sync over Nostr; key mgmt in Settings // overridden by owner
  TIME_OF_DAY_REVEAL: false, // RxJS-driven card unlock at ritual times
  GOLD_CARDS: false, // voice-note social layer
  PRESTIGE_BADGES: false,
  BLOSSOM_UPLOAD: false,
} as const;

export type Flag = keyof typeof FLAGS;
