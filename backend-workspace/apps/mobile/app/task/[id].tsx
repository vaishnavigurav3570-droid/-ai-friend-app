// ============================================
// Antigravity — Task Detail Screen
// ============================================

import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Alert } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GlassmorphicCard } from '../../components/ui/GlassmorphicCard';
import { Button } from '../../components/ui/Button';
import { TaskCard } from '../../components/tasks/TaskCard';
import { useTaskStore } from '../../store/useTaskStore';
import { Colors, Spacing, BorderRadius, Typography, Gradients } from '../../constants/theme';

const PRIORITY_LABELS: Record<number, { label: string; color: string }> = {
  1: { label: 'Critical', color: Colors.priorityCritical },
  2: { label: 'High', color: Colors.priorityHigh },
  3: { label: 'Medium', color: Colors.priorityMedium },
  4: { label: 'Low', color: Colors.priorityLow },
  5: { label: 'Minimal', color: Colors.priorityMinimal },
};

export default function TaskDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { currentTask, isLoading, fetchTask, completeTask, breakdownTask, deleteTask } = useTaskStore();
  const [isBreaking, setIsBreaking] = useState(false);

  useEffect(() => {
    if (id) fetchTask(id);
  }, [id]);

  const handleComplete = async () => {
    if (!id) return;
    try {
      const result = await completeTask(id);
      Alert.alert('🎉 Task Completed!', `You earned ${result.total_earned} tokens!`);
      router.back();
    } catch (err: any) {
      Alert.alert('Error', err.message);
    }
  };

  const handleBreakdown = async () => {
    if (!id) return;
    setIsBreaking(true);
    try {
      const subtasks = await breakdownTask(id);
      Alert.alert('🧠 AI Breakdown', `Created ${subtasks.length} micro-tasks!`);
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setIsBreaking(false);
    }
  };

  const handleDelete = () => {
    Alert.alert('Delete Task', 'Are you sure? This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          if (!id) return;
          await deleteTask(id);
          router.back();
        },
      },
    ]);
  };

  if (!currentTask) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.loading}>Loading...</Text>
      </SafeAreaView>
    );
  }

  const priority = PRIORITY_LABELS[currentTask.priority] || PRIORITY_LABELS[3];
  const hasSubtasks = currentTask.subtasks && currentTask.subtasks.length > 0;
  const completedSubtasks = currentTask.subtasks?.filter((s) => s.status === 'completed').length || 0;

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Status bar */}
        <View style={styles.statusRow}>
          <View style={[styles.statusBadge, { backgroundColor: `${priority.color}20` }]}>
            <Text style={[styles.statusText, { color: priority.color }]}>
              P{currentTask.priority} • {priority.label}
            </Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: `${Colors.success}20` }]}>
            <Text style={[styles.statusText, { color: Colors.success }]}>
              {currentTask.status.replace('_', ' ').toUpperCase()}
            </Text>
          </View>
        </View>

        {/* Title */}
        <Text style={styles.title}>{currentTask.title}</Text>

        {currentTask.description && (
          <Text style={styles.description}>{currentTask.description}</Text>
        )}

        {/* Meta cards */}
        <View style={styles.metaRow}>
          <GlassmorphicCard style={styles.metaCard} padding={Spacing.md}>
            <Ionicons name="time-outline" size={20} color={Colors.textSecondary} />
            <Text style={styles.metaValue}>{currentTask.estimated_minutes || '—'}</Text>
            <Text style={styles.metaLabel}>minutes</Text>
          </GlassmorphicCard>

          <GlassmorphicCard style={styles.metaCard} padding={Spacing.md} glowColor={Colors.tokenGold}>
            <Text style={{ fontSize: 20 }}>🪙</Text>
            <Text style={[styles.metaValue, { color: Colors.tokenGold }]}>
              {currentTask.token_reward}
            </Text>
            <Text style={styles.metaLabel}>reward</Text>
          </GlassmorphicCard>

          {currentTask.deadline && (
            <GlassmorphicCard style={styles.metaCard} padding={Spacing.md}>
              <Ionicons name="calendar-outline" size={20} color={Colors.textSecondary} />
              <Text style={styles.metaValue}>
                {new Date(currentTask.deadline).toLocaleDateString()}
              </Text>
              <Text style={styles.metaLabel}>deadline</Text>
            </GlassmorphicCard>
          )}
        </View>

        {/* Tags */}
        {currentTask.tags?.length > 0 && (
          <View style={styles.tagsRow}>
            {currentTask.tags.map((tag: string) => (
              <View key={tag} style={styles.tag}>
                <Text style={styles.tagText}>#{tag}</Text>
              </View>
            ))}
          </View>
        )}

        {/* AI Breakdown button */}
        {!hasSubtasks && currentTask.status !== 'completed' && (
          <GlassmorphicCard style={styles.aiCard} padding={Spacing.lg} glowColor={Colors.primaryStart}>
            <View style={styles.aiHeader}>
              <Text style={{ fontSize: 24 }}>🧠</Text>
              <View>
                <Text style={styles.aiTitle}>AI Breakdown</Text>
                <Text style={styles.aiSubtitle}>Split into 5-15 min micro-tasks</Text>
              </View>
            </View>
            <Button
              title="Break Down with AI"
              onPress={handleBreakdown}
              loading={isBreaking}
              fullWidth
            />
          </GlassmorphicCard>
        )}

        {/* Subtasks */}
        {hasSubtasks && (
          <View style={styles.subtaskSection}>
            <View style={styles.subtaskHeader}>
              <Text style={styles.sectionTitle}>
                Micro-tasks ({completedSubtasks}/{currentTask.subtasks!.length})
              </Text>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${(completedSubtasks / currentTask.subtasks!.length) * 100}%` },
                  ]}
                />
              </View>
            </View>
            {currentTask.subtasks!.map((subtask) => (
              <TaskCard
                key={subtask.id}
                task={subtask}
                onPress={(subId) => router.push(`/task/${subId}`)}
                onComplete={(subId) => completeTask(subId)}
              />
            ))}
          </View>
        )}

        {/* Actions */}
        <View style={styles.actions}>
          {currentTask.status !== 'completed' && (
            <Button
              title="✅ Mark Complete"
              variant="success"
              onPress={handleComplete}
              fullWidth
              size="lg"
            />
          )}
          <Button
            title="🗑️ Delete Task"
            variant="danger"
            onPress={handleDelete}
            fullWidth
            size="md"
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: Spacing.lg, paddingBottom: 100 },
  loading: { color: Colors.textSecondary, textAlign: 'center', marginTop: 100 },
  statusRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md },
  statusBadge: {
    paddingHorizontal: Spacing.md, paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  statusText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
  title: { ...Typography.heading1, color: Colors.textPrimary, marginBottom: Spacing.sm },
  description: { color: Colors.textSecondary, fontSize: 15, lineHeight: 24, marginBottom: Spacing.lg },
  metaRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.lg },
  metaCard: { flex: 1, alignItems: 'center', gap: 4 },
  metaValue: { color: Colors.textPrimary, fontSize: 18, fontWeight: '700' },
  metaLabel: { color: Colors.textMuted, fontSize: 10, fontWeight: '600', textTransform: 'uppercase' },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.lg },
  tag: {
    backgroundColor: Colors.surface, paddingHorizontal: Spacing.sm, paddingVertical: 4,
    borderRadius: BorderRadius.full, borderWidth: 1, borderColor: Colors.glassBorder,
  },
  tagText: { color: Colors.textSecondary, fontSize: 12, fontWeight: '500' },
  aiCard: { gap: Spacing.md, marginBottom: Spacing.lg },
  aiHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  aiTitle: { ...Typography.heading4, color: Colors.textPrimary },
  aiSubtitle: { color: Colors.textSecondary, fontSize: 12 },
  subtaskSection: { marginBottom: Spacing.lg },
  subtaskHeader: { marginBottom: Spacing.md },
  sectionTitle: { ...Typography.heading4, color: Colors.textPrimary, marginBottom: Spacing.sm },
  progressBar: {
    height: 4, backgroundColor: Colors.surfaceLight,
    borderRadius: 2, overflow: 'hidden',
  },
  progressFill: { height: '100%', backgroundColor: Colors.success, borderRadius: 2 },
  actions: { gap: Spacing.md, marginTop: Spacing.lg },
});
