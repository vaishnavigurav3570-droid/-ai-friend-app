// ============================================
// Antigravity — App Intercept Overlay Screen
// Full-screen overlay when user tries to open a locked app
// ============================================

import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn, SlideInDown } from 'react-native-reanimated';
import { GlassmorphicCard } from '../../components/ui/GlassmorphicCard';
import { TokenBadge } from '../../components/ui/TokenBadge';
import { Button } from '../../components/ui/Button';
import { useTokenStore } from '../../store/useTokenStore';
import { Colors, Spacing, BorderRadius, Typography, Gradients } from '../../constants/theme';

export default function InterceptScreen() {
  const { balance, unlockApp } = useTokenStore();
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [selectedDuration, setSelectedDuration] = useState(15);

  // In production, this comes from the native module event
  const blockedApp = {
    id: 'demo-id',
    label: 'Instagram',
    packageName: 'com.instagram.android',
    unlockCost: 50,
  };

  const microTask = {
    title: 'Review 3 flashcards for tomorrow\'s quiz',
    estimatedMinutes: 5,
    tokenReward: 15,
  };

  const unlockCost = Math.ceil(blockedApp.unlockCost * (selectedDuration / 15));

  const handleUnlock = async () => {
    setIsUnlocking(true);
    try {
      await unlockApp(blockedApp.id, selectedDuration);
      // Native module would dismiss overlay and allow app
    } catch (err) {
      console.error('Unlock failed:', err);
    } finally {
      setIsUnlocking(false);
    }
  };

  const durations = [
    { minutes: 15, label: '15 min' },
    { minutes: 30, label: '30 min' },
    { minutes: 60, label: '1 hour' },
  ];

  return (
    <LinearGradient
      colors={['rgba(10, 10, 15, 0.98)', 'rgba(10, 10, 15, 0.95)']}
      style={styles.container}
    >
      {/* Blocked app header */}
      <Animated.View entering={FadeIn.duration(400)} style={styles.blockedHeader}>
        <View style={styles.blockedIcon}>
          <Ionicons name="lock-closed" size={32} color={Colors.danger} />
        </View>
        <Text style={styles.blockedTitle}>{blockedApp.label} is Locked</Text>
        <Text style={styles.blockedSubtitle}>
          Complete a task to earn tokens, or spend tokens to unlock
        </Text>
      </Animated.View>

      {/* Micro-task challenge */}
      <Animated.View entering={SlideInDown.delay(200).duration(500)}>
        <GlassmorphicCard style={styles.taskCard} padding={Spacing.lg} glowColor={Colors.primaryStart}>
          <View style={styles.taskBadge}>
            <Text style={styles.taskBadgeText}>⚡ QUICK TASK</Text>
          </View>
          <Text style={styles.taskTitle}>{microTask.title}</Text>
          <View style={styles.taskMeta}>
            <View style={styles.metaItem}>
              <Ionicons name="time-outline" size={14} color={Colors.textSecondary} />
              <Text style={styles.metaText}>{microTask.estimatedMinutes} min</Text>
            </View>
            <View style={styles.metaItem}>
              <Text style={styles.metaText}>🪙 {microTask.tokenReward} tokens</Text>
            </View>
          </View>
          <Button
            title={`Complete & Earn ${microTask.tokenReward} Tokens`}
            variant="success"
            onPress={() => {/* Complete task flow */}}
            fullWidth
            size="lg"
          />
        </GlassmorphicCard>
      </Animated.View>

      {/* Divider */}
      <View style={styles.divider}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>OR</Text>
        <View style={styles.dividerLine} />
      </View>

      {/* Unlock with tokens */}
      <Animated.View entering={SlideInDown.delay(400).duration(500)}>
        <GlassmorphicCard padding={Spacing.lg}>
          <Text style={styles.unlockTitle}>Spend Tokens to Unlock</Text>

          {/* Duration selector */}
          <View style={styles.durationRow}>
            {durations.map((d) => (
              <Pressable
                key={d.minutes}
                onPress={() => setSelectedDuration(d.minutes)}
                style={[
                  styles.durationBtn,
                  selectedDuration === d.minutes && styles.selectedDuration,
                ]}
              >
                <Text
                  style={[
                    styles.durationLabel,
                    selectedDuration === d.minutes && styles.selectedDurationLabel,
                  ]}
                >
                  {d.label}
                </Text>
                <Text style={styles.durationCost}>
                  🪙 {Math.ceil(blockedApp.unlockCost * (d.minutes / 15))}
                </Text>
              </Pressable>
            ))}
          </View>

          <View style={styles.balanceRow}>
            <Text style={styles.balanceLabel}>Your balance:</Text>
            <TokenBadge balance={balance} size="sm" />
          </View>

          <Button
            title={`Unlock for ${selectedDuration} min (${unlockCost} tokens)`}
            variant="primary"
            onPress={handleUnlock}
            loading={isUnlocking}
            disabled={balance < unlockCost}
            fullWidth
            size="lg"
          />

          {balance < unlockCost && (
            <Text style={styles.insufficientText}>
              Not enough tokens! Complete the task above to earn more.
            </Text>
          )}
        </GlassmorphicCard>
      </Animated.View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: Spacing.lg,
    justifyContent: 'center',
    gap: Spacing.md,
  },
  blockedHeader: { alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.md },
  blockedIcon: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: `${Colors.danger}20`, alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: `${Colors.danger}40`,
  },
  blockedTitle: { ...Typography.heading2, color: Colors.textPrimary },
  blockedSubtitle: { color: Colors.textSecondary, fontSize: 14, textAlign: 'center', lineHeight: 20 },
  taskCard: { gap: Spacing.md },
  taskBadge: {
    backgroundColor: `${Colors.primary}20`,
    paddingHorizontal: Spacing.sm, paddingVertical: 3,
    borderRadius: BorderRadius.sm, alignSelf: 'flex-start',
  },
  taskBadgeText: { color: Colors.primary, fontSize: 11, fontWeight: '700', letterSpacing: 1 },
  taskTitle: { ...Typography.heading3, color: Colors.textPrimary, lineHeight: 28 },
  taskMeta: { flexDirection: 'row', gap: Spacing.lg },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { color: Colors.textSecondary, fontSize: 13, fontWeight: '500' },
  divider: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  dividerLine: { flex: 1, height: 1, backgroundColor: Colors.glassBorder },
  dividerText: { color: Colors.textMuted, fontSize: 12, fontWeight: '600' },
  unlockTitle: { ...Typography.heading4, color: Colors.textPrimary, marginBottom: Spacing.md },
  durationRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md },
  durationBtn: {
    flex: 1, alignItems: 'center', padding: Spacing.md,
    borderRadius: BorderRadius.md, borderWidth: 1,
    borderColor: Colors.glassBorder, backgroundColor: Colors.surface,
    gap: 4,
  },
  selectedDuration: { borderColor: Colors.primary, backgroundColor: `${Colors.primary}15` },
  durationLabel: { color: Colors.textSecondary, fontSize: 13, fontWeight: '600' },
  selectedDurationLabel: { color: Colors.primary },
  durationCost: { color: Colors.tokenGold, fontSize: 12, fontWeight: '700' },
  balanceRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: Spacing.md,
  },
  balanceLabel: { color: Colors.textSecondary, fontSize: 13 },
  insufficientText: {
    color: Colors.danger, fontSize: 12, textAlign: 'center',
    marginTop: Spacing.sm, fontWeight: '500',
  },
});
