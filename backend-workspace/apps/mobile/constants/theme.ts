// ============================================
// Antigravity — Design System Theme
// Premium dark theme with glassmorphism
// ============================================

export const Colors = {
  // Base
  background: '#0A0A0F',
  surface: '#13131A',
  surfaceLight: '#1C1C27',
  surfaceElevated: '#242432',

  // Primary gradient
  primaryStart: '#7C3AED',   // Violet
  primaryEnd: '#4F46E5',     // Indigo
  primary: '#6D5AE6',        // Midpoint

  // Accent
  accent: '#06B6D4',         // Cyan
  accentLight: '#22D3EE',

  // Semantic
  success: '#10B981',        // Emerald
  successLight: '#34D399',
  warning: '#F59E0B',        // Amber
  warningLight: '#FBBF24',
  danger: '#EF4444',         // Rose
  dangerLight: '#F87171',

  // Text
  textPrimary: '#F8FAFC',
  textSecondary: '#94A3B8',
  textMuted: '#475569',
  textInverse: '#0F172A',

  // Glass
  glassBorder: 'rgba(255, 255, 255, 0.08)',
  glassBackground: 'rgba(255, 255, 255, 0.05)',
  glassBackgroundStrong: 'rgba(255, 255, 255, 0.10)',

  // Token
  tokenGold: '#FFD700',
  tokenGlow: 'rgba(255, 215, 0, 0.3)',

  // Priority colors
  priorityCritical: '#EF4444',
  priorityHigh: '#F97316',
  priorityMedium: '#F59E0B',
  priorityLow: '#3B82F6',
  priorityMinimal: '#6B7280',

  // Streak
  streakFlame: '#FF6B35',
  streakGlow: 'rgba(255, 107, 53, 0.4)',
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
};

export const BorderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

export const Typography = {
  heading1: {
    fontSize: 32,
    fontWeight: '800' as const,
    lineHeight: 40,
    letterSpacing: -0.5,
  },
  heading2: {
    fontSize: 24,
    fontWeight: '700' as const,
    lineHeight: 32,
    letterSpacing: -0.3,
  },
  heading3: {
    fontSize: 20,
    fontWeight: '600' as const,
    lineHeight: 28,
  },
  heading4: {
    fontSize: 18,
    fontWeight: '600' as const,
    lineHeight: 24,
  },
  body: {
    fontSize: 16,
    fontWeight: '400' as const,
    lineHeight: 24,
  },
  bodyMedium: {
    fontSize: 14,
    fontWeight: '500' as const,
    lineHeight: 20,
  },
  caption: {
    fontSize: 12,
    fontWeight: '500' as const,
    lineHeight: 16,
    letterSpacing: 0.3,
  },
  label: {
    fontSize: 11,
    fontWeight: '600' as const,
    lineHeight: 14,
    letterSpacing: 0.5,
    textTransform: 'uppercase' as const,
  },
};

export const Shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  glow: (color: string) => ({
    shadowColor: color,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 12,
    elevation: 6,
  }),
};

export const Gradients = {
  primary: [Colors.primaryStart, Colors.primaryEnd] as const,
  accent: ['#06B6D4', '#0891B2'] as const,
  success: ['#10B981', '#059669'] as const,
  danger: ['#EF4444', '#DC2626'] as const,
  surface: ['#1C1C27', '#13131A'] as const,
  gold: ['#FFD700', '#FFA500'] as const,
  dark: ['rgba(0,0,0,0.8)', 'rgba(0,0,0,0)'] as const,
};
