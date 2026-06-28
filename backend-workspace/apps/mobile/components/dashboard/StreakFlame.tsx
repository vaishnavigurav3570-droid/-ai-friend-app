// ============================================
// Antigravity — StreakFlame Component
// Animated flame showing streak count
// ============================================

import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { Colors, Spacing } from '../../constants/theme';

interface Props {
  days: number;
  size?: 'sm' | 'md' | 'lg';
}

export function StreakFlame({ days, size = 'md' }: Props) {
  const flicker = useSharedValue(1);
  const glow = useSharedValue(0.3);

  useEffect(() => {
    // Flame flicker animation
    flicker.value = withRepeat(
      withSequence(
        withTiming(1.1, { duration: 300, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.95, { duration: 200, easing: Easing.inOut(Easing.ease) }),
        withTiming(1.05, { duration: 250, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 200, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );

    // Glow pulse
    glow.value = withRepeat(
      withSequence(
        withTiming(0.6, { duration: 1000 }),
        withTiming(0.3, { duration: 1000 })
      ),
      -1,
      true
    );
  }, []);

  const animatedFlame = useAnimatedStyle(() => ({
    transform: [{ scale: flicker.value }],
  }));

  const animatedGlow = useAnimatedStyle(() => ({
    opacity: glow.value,
  }));

  const sizes = {
    sm: { flame: 28, count: 14, label: 10 },
    md: { flame: 40, count: 20, label: 12 },
    lg: { flame: 56, count: 28, label: 14 },
  };

  const s = sizes[size];
  const isActive = days > 0;

  return (
    <View style={styles.container}>
      {/* Glow behind flame */}
      {isActive && (
        <Animated.View
          style={[
            styles.glow,
            animatedGlow,
            { width: s.flame * 2, height: s.flame * 2, borderRadius: s.flame },
          ]}
        />
      )}

      <Animated.Text
        style={[
          { fontSize: s.flame },
          isActive && animatedFlame,
          !isActive && styles.inactive,
        ]}
      >
        🔥
      </Animated.Text>

      <Text style={[styles.count, { fontSize: s.count }, !isActive && styles.inactiveText]}>
        {days}
      </Text>
      <Text style={[styles.label, { fontSize: s.label }]}>
        {days === 1 ? 'day' : 'days'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  glow: {
    position: 'absolute',
    backgroundColor: Colors.streakGlow,
  },
  count: {
    color: Colors.streakFlame,
    fontWeight: '800',
    marginTop: -4,
  },
  label: {
    color: Colors.textMuted,
    fontWeight: '500',
  },
  inactive: {
    opacity: 0.3,
  },
  inactiveText: {
    color: Colors.textMuted,
  },
});
