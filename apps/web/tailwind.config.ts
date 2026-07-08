import type { Config } from 'tailwindcss';

// Neumorphic palette — canonical tokens live in AGENTS.md (Theme & Design).
// Edit there first, then mirror here.
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        dodaat: {
          background: '#F5F0E8',
          shadowLight: '#FFFFFF',
          shadowDark: '#C8C0B2',
          physical: '#8B6F5E',
          mental: '#5E7A8B',
          spiritual: '#7A6B8B',
          gold: '#C4A882',
          goldLight: '#EDD9B8',
          goldDark: '#A8875A',
          textPrimary: '#38322C',
          textSecondary: '#7A7068',
          textMuted: '#B0A89E',
          systemCard: '#EDE8DE',
          complete: '#6B9B6B',   // muted sage green — completed card status
          skip: '#B06B6B',       // muted red — skipped card status
        },
      },
      borderRadius: {
        card: '24px',
        button: '16px',
        pill: '9999px',
      },
    },
  },
  plugins: [],
} satisfies Config;
