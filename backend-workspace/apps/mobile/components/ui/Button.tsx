// ============================================
// Antigravity — Button Component
// Gradient button with haptic feedback & animations
// ============================================

import React from 'react';
import { Text, Pressable, StyleSheet, ActivityIndicator, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { Colors, BorderRadius, Spacing, Typography, Gradients } from '../../constants/theme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'success';

interface Props {
  title: string;
  onPress: () => void;
  variant?: Variant;
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle;
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  icon,
  style,
  size = 'md',
  fullWidth = false,
}: Props) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = async () => {
    if (disabled || loading) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPress();
  };

  const heights = { sm: 36, md: 48, lg: 56 };
  const fontSizes = { sm: 13, md: 15, lg: 17 };

  const inner = (
    <Animated.View
      style={[
        styles.inner,
        { height: heights[size], paddingHorizontal: size === 'sm' ? Spacing.md : Spacing.lg },
        variant === 'secondary' && styles.secondaryInner,
        variant === 'ghost' && styles.ghostInner,
        (disabled || loading) && styles.disabled,
        fullWidth && styles.fullWidth,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={Colors.textPrimary} size="small" />
      ) : (
        <>
          {icon}
          <Text
            style={[
              styles.text,
              { fontSize: fontSizes[size] },
              variant === 'ghost' && styles.ghostText,
              variant === 'secondary' && styles.secondaryText,
            ]}
          >
            {title}
          </Text>
        </>
      )}
    </Animated.View>
  );

  if (variant === 'primary' || variant === 'danger' || variant === 'success') {
    const gradients = {
      primary: Gradients.primary,
      danger: Gradients.danger,
      success: Gradients.success,
    };

    return (
      <AnimatedPressable
        onPress={handlePress}
        onPressIn={() => { scale.value = withSpring(0.96); }}
        onPressOut={() => { scale.value = withSpring(1); }}
        style={[animatedStyle, style]}
        disabled={disabled || loading}
      >
        <LinearGradient
          colors={[...gradients[variant]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.gradient, { height: heights[size], borderRadius: BorderRadius.md }, fullWidth && styles.fullWidth]}
        >
          {loading ? (
            <ActivityIndicator color={Colors.textPrimary} size="small" />
          ) : (
            <>
              {icon}
              <Text style={[styles.text, { fontSize: fontSizes[size] }]}>{title}</Text>
            </>
          )}
        </LinearGradient>
      </AnimatedPressable>
    );
  }

  return (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={() => { scale.value = withSpring(0.96); }}
      onPressOut={() => { scale.value = withSpring(1); }}
      style={[animatedStyle, style]}
      disabled={disabled || loading}
    >
      {inner}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
  },
  secondaryInner: {
    backgroundColor: Colors.glassBackgroundStrong,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
  },
  ghostInner: {
    backgroundColor: 'transparent',
  },
  text: {
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  secondaryText: {
    color: Colors.textSecondary,
  },
  ghostText: {
    color: Colors.primary,
  },
  disabled: {
    opacity: 0.5,
  },
  fullWidth: {
    width: '100%',
  },
});
