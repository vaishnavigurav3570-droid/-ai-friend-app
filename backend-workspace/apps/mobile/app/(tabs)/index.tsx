// ============================================
// Antigravity — Dashboard / Home Screen
// ============================================

import React, { useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GlassmorphicCard } from '../../components/ui/GlassmorphicCard';
import { TokenBadge } from '../../components/ui/TokenBadge';
import { ProgressRing } from '../../components/ui/ProgressRing';
import { StreakFlame } from '../../components/dashboard/StreakFlame';
import { useUserStore } from '../../store/useUserStore';
import { useTaskStore } from '../../store/useTaskStore';
import { useTokenStore } from '../../store/useTokenStore';
import { Colors, Spacing, BorderRadius, Typography, Gradients } from '../../constants/theme';

export default function DashboardScreen() {
  const { profile } = useUserStore();
  const { tasks, fetchTasks } = useTaskStore();
  const { balance, streakDays, fetchBalance } = useTokenStore();

  useEffect(() => {
    fetchTasks();
    fetchBalance();
  }, []);

  const completedToday = tasks.filter((t) => t.status === 'completed').length;
  const totalTasks = tasks.length;
  const dailyProgress = totalTasks > 0 ? Math.round((completedToday / totalTasks) * 100) : 0;
  const pendingTasks = tasks.filter((t) => t.status === 'pending').slice(0, 3);

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{greeting()},</Text>
            <Text style={styles.name}>{profile?.display_name || 'Explorer'}</Text>
          </View>
          <TokenBadge balance={balance} />
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          {/* Streak */}
          <GlassmorphicCard style={styles.statCard} padding={Spacing.md}>
            <StreakFlame days={streakDays} size="sm" />
          </GlassmorphicCard>

          {/* Daily Progress */}
          <GlassmorphicCard style={styles.statCardWide} padding={Spacing.md}>
            <View style={styles.progressRow}>
              <ProgressRing progress={dailyProgress} size={64} strokeWidth={6} />
              <View style={styles.progressInfo}>
                <Text style={styles.progressTitle}>Today's Progress</Text>
                <Text style={styles.progressSub}>
                  {completedToday}/{totalTasks} tasks
                </Text>
              </View>
            </View>
          </GlassmorphicCard>
        </View>

        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsRow}>
          <Pressable
            style={styles.actionBtn}
            onPress={() => router.push('/voice-dump')}
          >
            <LinearGradient colors={[...Gradients.accent]} style={styles.actionIcon}>
              <Ionicons name="mic" size={22} color={Colors.textPrimary} />
            </LinearGradient>
            <Text style={styles.actionLabel}>Voice Dump</Text>
          </Pressable>

          <Pressable
            style={styles.actionBtn}
            onPress={() => router.push('/(tabs)/tasks')}
          >
            <LinearGradient colors={[...Gradients.primary]} style={styles.actionIcon}>
              <Ionicons name="add" size={22} color={Colors.textPrimary} />
            </LinearGradient>
            <Text style={styles.actionLabel}>New Task</Text>
          </Pressable>

          <Pressable
            style={styles.actionBtn}
            onPress={() => router.push('/shop')}
          >
            <LinearGradient colors={[...Gradients.gold]} style={styles.actionIcon}>
              <Ionicons name="storefront" size={22} color={Colors.textInverse} />
            </LinearGradient>
            <Text style={styles.actionLabel}>Shop</Text>
          </Pressable>

          <Pressable
            style={styles.actionBtn}
            onPress={() => router.push('/(tabs)/vault')}
          >
            <LinearGradient colors={[...Gradients.danger]} style={styles.actionIcon}>
              <Ionicons name="lock-closed" size={22} color={Colors.textPrimary} />
            </LinearGradient>
            <Text style={styles.actionLabel}>Vault</Text>
          </Pressable>
        </View>

        {/* Pending Tasks */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Up Next</Text>
          <Pressable onPress={() => router.push('/(tabs)/tasks')}>
            <Text style={styles.seeAll}>See all →</Text>
          </Pressable>
        </View>

        {pendingTasks.length === 0 ? (
          <GlassmorphicCard padding={Spacing.xl}>
            <View style={styles.emptyState}>
              <Text style={styles.emptyEmoji}>🎉</Text>
              <Text style={styles.emptyTitle}>All caught up!</Text>
              <Text style={styles.emptySubtitle}>No pending tasks. Great work!</Text>
            </View>
          </GlassmorphicCard>
        ) : (
          pendingTasks.map((task) => (
            <Pressable
              key={task.id}
              onPress={() => router.push(`/task/${task.id}`)}
            >
              <GlassmorphicCard style={styles.taskCard} padding={Spacing.md}>
                <View style={styles.taskRow}>
                  <View style={[styles.priorityDot, { backgroundColor: getPriorityColor(task.priority) }]} />
                  <View style={styles.taskContent}>
                    <Text style={styles.taskTitle} numberOfLines={1}>{task.title}</Text>
                    <Text style={styles.taskMeta}>
                      {task.estimated_minutes ? `${task.estimated_minutes}m` : ''} • 🪙 {task.token_reward}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
                </View>
              </GlassmorphicCard>
            </Pressable>
          ))
        )}

        {/* Motivational footer */}
        <GlassmorphicCard style={styles.motivationCard} padding={Spacing.lg} glowColor={Colors.primaryStart}>
          <Text style={styles.motivationEmoji}>🚀</Text>
          <Text style={styles.motivationText}>
            Every micro-task you crush breaks the gravity of procrastination.
          </Text>
        </GlassmorphicCard>
      </ScrollView>
    </SafeAreaView>
  );
}

function getPriorityColor(priority: number): string {
  const colors: Record<number, string> = {
    1: Colors.priorityCritical,
    2: Colors.priorityHigh,
    3: Colors.priorityMedium,
    4: Colors.priorityLow,
    5: Colors.priorityMinimal,
  };
  return colors[priority] || Colors.priorityMedium;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: Spacing.lg, paddingBottom: 100 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  greeting: { ...Typography.bodyMedium, color: Colors.textSecondary },
  name: { ...Typography.heading2, color: Colors.textPrimary },
  statsRow: { flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.lg },
  statCard: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  statCardWide: { flex: 2 },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  progressInfo: { flex: 1 },
  progressTitle: { color: Colors.textPrimary, fontSize: 14, fontWeight: '600' },
  progressSub: { color: Colors.textSecondary, fontSize: 12, marginTop: 2 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    ...Typography.heading4,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  seeAll: { color: Colors.primary, fontSize: 14, fontWeight: '600' },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.xl,
    gap: Spacing.sm,
  },
  actionBtn: { alignItems: 'center', gap: Spacing.xs, flex: 1 },
  actionIcon: {
    width: 52,
    height: 52,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionLabel: { color: Colors.textSecondary, fontSize: 11, fontWeight: '600' },
  taskCard: { marginBottom: Spacing.sm },
  taskRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  priorityDot: { width: 8, height: 8, borderRadius: 4 },
  taskContent: { flex: 1 },
  taskTitle: { color: Colors.textPrimary, fontSize: 14, fontWeight: '600' },
  taskMeta: { color: Colors.textMuted, fontSize: 11, marginTop: 2 },
  emptyState: { alignItems: 'center', gap: Spacing.sm },
  emptyEmoji: { fontSize: 48 },
  emptyTitle: { ...Typography.heading3, color: Colors.textPrimary },
  emptySubtitle: { color: Colors.textSecondary, fontSize: 14 },
  motivationCard: { marginTop: Spacing.lg, alignItems: 'center', gap: Spacing.sm },
  motivationEmoji: { fontSize: 36 },
  motivationText: {
    color: Colors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    fontStyle: 'italic',
    lineHeight: 22,
  },
});
