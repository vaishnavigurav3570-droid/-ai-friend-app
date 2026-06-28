// ============================================
// Antigravity — TaskCard Component
// ============================================

import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GlassmorphicCard } from '../ui/GlassmorphicCard';
import { Colors, Spacing, BorderRadius, Typography } from '../../constants/theme';

interface Props {
  task: {
    id: string;
    title: string;
    status: string;
    priority: number;
    token_reward: number;
    estimated_minutes: number | null;
    deadline: string | null;
    is_micro_task: boolean;
    tags: string[];
  };
  onPress: (id: string) => void;
  onComplete?: (id: string) => void;
}

const PRIORITY_CONFIG: Record<number, { color: string; label: string }> = {
  1: { color: Colors.priorityCritical, label: 'P1' },
  2: { color: Colors.priorityHigh, label: 'P2' },
  3: { color: Colors.priorityMedium, label: 'P3' },
  4: { color: Colors.priorityLow, label: 'P4' },
  5: { color: Colors.priorityMinimal, label: 'P5' },
};

export function TaskCard({ task, onPress, onComplete }: Props) {
  const priority = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG[3];
  const isCompleted = task.status === 'completed';

  const formatDeadline = (deadline: string) => {
    const date = new Date(deadline);
    const now = new Date();
    const diff = date.getTime() - now.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (diff < 0) return { text: 'Overdue', color: Colors.danger };
    if (hours < 24) return { text: `${hours}h left`, color: Colors.warning };
    if (days < 3) return { text: `${days}d left`, color: Colors.warningLight };
    return { text: `${days}d left`, color: Colors.textMuted };
  };

  return (
    <Pressable onPress={() => onPress(task.id)}>
      <GlassmorphicCard
        style={[styles.card, isCompleted && styles.completedCard]}
        padding={Spacing.md}
        glowColor={isCompleted ? Colors.success : undefined}
      >
        <View style={styles.row}>
          {/* Complete checkbox */}
          <Pressable
            onPress={() => onComplete?.(task.id)}
            style={[
              styles.checkbox,
              { borderColor: priority.color },
              isCompleted && { backgroundColor: Colors.success, borderColor: Colors.success },
            ]}
          >
            {isCompleted && <Ionicons name="checkmark" size={14} color={Colors.textPrimary} />}
          </Pressable>

          {/* Content */}
          <View style={styles.content}>
            <View style={styles.titleRow}>
              <Text
                style={[styles.title, isCompleted && styles.completedTitle]}
                numberOfLines={2}
              >
                {task.title}
              </Text>
            </View>

            <View style={styles.metaRow}>
              {/* Priority badge */}
              <View style={[styles.badge, { backgroundColor: `${priority.color}20` }]}>
                <Text style={[styles.badgeText, { color: priority.color }]}>
                  {priority.label}
                </Text>
              </View>

              {/* Estimated time */}
              {task.estimated_minutes && (
                <View style={styles.metaItem}>
                  <Ionicons name="time-outline" size={12} color={Colors.textMuted} />
                  <Text style={styles.metaText}>{task.estimated_minutes}m</Text>
                </View>
              )}

              {/* Deadline */}
              {task.deadline && (
                <View style={styles.metaItem}>
                  <Ionicons name="calendar-outline" size={12} color={formatDeadline(task.deadline).color} />
                  <Text style={[styles.metaText, { color: formatDeadline(task.deadline).color }]}>
                    {formatDeadline(task.deadline).text}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Token reward */}
          <View style={styles.reward}>
            <Text style={styles.rewardIcon}>🪙</Text>
            <Text style={styles.rewardText}>{task.token_reward}</Text>
          </View>
        </View>
      </GlassmorphicCard>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: Spacing.sm,
  },
  completedCard: {
    opacity: 0.6,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: BorderRadius.sm,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    gap: Spacing.xs,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  title: {
    color: Colors.textPrimary,
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
  },
  completedTitle: {
    textDecorationLine: 'line-through',
    color: Colors.textMuted,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  metaText: {
    color: Colors.textMuted,
    fontSize: 11,
    fontWeight: '500',
  },
  reward: {
    alignItems: 'center',
    gap: 2,
  },
  rewardIcon: {
    fontSize: 16,
  },
  rewardText: {
    color: Colors.tokenGold,
    fontSize: 12,
    fontWeight: '700',
  },
});
