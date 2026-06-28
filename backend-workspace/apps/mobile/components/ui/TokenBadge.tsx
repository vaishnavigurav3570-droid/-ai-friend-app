// ============================================
// Antigravity — TokenBadge Component
// Pill showing token count with coin icon
// ============================================

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, BorderRadius, Spacing, Shadows } from '../../constants/theme';

interface Props {
  balance: number;
  size?: 'sm' | 'md' | 'lg';
  showGlow?: boolean;
}

export function TokenBadge({ balance, size = 'md', showGlow = true }: Props) {
  const sizes = {
    sm: { height: 28, fontSize: 12, iconSize: 14, px: 10 },
    md: { height: 36, fontSize: 15, iconSize: 18, px: 14 },
    lg: { height: 44, fontSize: 18, iconSize: 22, px: 18 },
  };

  const s = sizes[size];

  return (
    <View
      style={[
        styles.container,
        {
          height: s.height,
          paddingHorizontal: s.px,
          borderRadius: s.height / 2,
        },
        showGlow && Shadows.glow(Colors.tokenGold),
      ]}
    >
      <Text style={[styles.icon, { fontSize: s.iconSize }]}>🪙</Text>
      <Text style={[styles.balance, { fontSize: s.fontSize }]}>
        {balance.toLocaleString()}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.25)',
    gap: 6,
  },
  icon: {
    // emoji acts as icon
  },
  balance: {
    color: Colors.tokenGold,
    fontWeight: '700',
  },
});
