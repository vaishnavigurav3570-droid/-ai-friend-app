// ============================================
// Antigravity — GlassmorphicCard Component
// Premium frosted glass card with glow effects
// ============================================

import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, BorderRadius, Spacing } from '../../constants/theme';

interface Props {
  children: React.ReactNode;
  style?: ViewStyle;
  intensity?: 'light' | 'medium' | 'strong';
  glowColor?: string;
  padding?: number;
}

export function GlassmorphicCard({
  children,
  style,
  intensity = 'medium',
  glowColor,
  padding = Spacing.lg,
}: Props) {
  const bgOpacity = intensity === 'light' ? 0.03 : intensity === 'strong' ? 0.12 : 0.06;
  const borderOpacity = intensity === 'light' ? 0.05 : intensity === 'strong' ? 0.15 : 0.08;

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: `rgba(255, 255, 255, ${bgOpacity})`,
          borderColor: `rgba(255, 255, 255, ${borderOpacity})`,
          padding,
        },
        glowColor && {
          shadowColor: glowColor,
          shadowOpacity: 0.3,
          shadowRadius: 16,
          shadowOffset: { width: 0, height: 0 },
          elevation: 6,
        },
        style,
      ]}
    >
      {/* Top highlight shimmer */}
      <LinearGradient
        colors={[`rgba(255, 255, 255, ${borderOpacity})`, 'transparent']}
        style={styles.shimmer}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
  },
  shimmer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
  },
});
