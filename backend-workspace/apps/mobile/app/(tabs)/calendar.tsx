// ============================================
// Antigravity — Calendar Screen
// ============================================

import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GlassmorphicCard } from '../../components/ui/GlassmorphicCard';
import { Button } from '../../components/ui/Button';
import { Colors, Spacing, BorderRadius, Typography } from '../../constants/theme';
import { api } from '../../services/api';

export default function CalendarScreen() {
  const [blocks, setBlocks] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadBlocks();
  }, [selectedDate]);

  const loadBlocks = async () => {
    try {
      const startDate = `${selectedDate}T00:00:00Z`;
      const endDate = `${selectedDate}T23:59:59Z`;
      const response = await api.getCalendarBlocks(startDate, endDate);
      setBlocks(response.data || []);
    } catch (err) {
      console.error('Failed to load blocks:', err);
    }
  };

  const generateSchedule = async () => {
    setIsLoading(true);
    try {
      await api.generateSchedule(selectedDate);
      await loadBlocks();
    } catch (err) {
      console.error('Failed to generate schedule:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const hours = Array.from({ length: 14 }, (_, i) => i + 7); // 7 AM to 8 PM

  const getBlocksForHour = (hour: number) =>
    blocks.filter((b) => {
      const startHour = new Date(b.starts_at).getHours();
      return startHour === hour;
    });

  // Generate weekday headers
  const getWeekDays = () => {
    const today = new Date(selectedDate);
    const monday = new Date(today);
    monday.setDate(today.getDate() - today.getDay() + 1);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      return d;
    });
  };

  const weekDays = getWeekDays();
  const dayNames = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Calendar</Text>
        <Button title="AI Schedule" onPress={generateSchedule} size="sm" loading={isLoading} />
      </View>

      {/* Week selector */}
      <View style={styles.weekRow}>
        {weekDays.map((day, i) => {
          const isSelected = day.toISOString().split('T')[0] === selectedDate;
          const isToday = day.toISOString().split('T')[0] === new Date().toISOString().split('T')[0];
          return (
            <Pressable
              key={i}
              onPress={() => setSelectedDate(day.toISOString().split('T')[0])}
              style={[styles.dayBtn, isSelected && styles.selectedDay]}
            >
              <Text style={[styles.dayName, isToday && styles.todayText]}>{dayNames[i]}</Text>
              <Text style={[styles.dayNum, isSelected && styles.selectedDayNum]}>
                {day.getDate()}
              </Text>
              {isToday && <View style={styles.todayDot} />}
            </Pressable>
          );
        })}
      </View>

      {/* Timeline */}
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.timeline}>
        {hours.map((hour) => {
          const hourBlocks = getBlocksForHour(hour);
          return (
            <View key={hour} style={styles.hourRow}>
              <Text style={styles.hourLabel}>
                {hour > 12 ? `${hour - 12} PM` : hour === 12 ? '12 PM' : `${hour} AM`}
              </Text>
              <View style={styles.hourContent}>
                <View style={styles.hourLine} />
                {hourBlocks.map((block) => (
                  <GlassmorphicCard
                    key={block.id}
                    style={styles.blockCard}
                    padding={Spacing.sm}
                    glowColor={block.is_completed ? Colors.success : Colors.primary}
                  >
                    <Text style={styles.blockTitle} numberOfLines={1}>{block.title}</Text>
                    <Text style={styles.blockTime}>
                      {new Date(block.starts_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -
                      {new Date(block.ends_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                  </GlassmorphicCard>
                ))}
              </View>
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: Spacing.lg, paddingBottom: Spacing.sm,
  },
  title: { ...Typography.heading1, color: Colors.textPrimary },
  weekRow: {
    flexDirection: 'row', justifyContent: 'space-around',
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.md,
  },
  dayBtn: {
    alignItems: 'center', paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.sm, borderRadius: BorderRadius.md, gap: 4,
  },
  selectedDay: { backgroundColor: Colors.primary },
  dayName: { color: Colors.textMuted, fontSize: 11, fontWeight: '600' },
  dayNum: { color: Colors.textSecondary, fontSize: 16, fontWeight: '700' },
  selectedDayNum: { color: Colors.textPrimary },
  todayText: { color: Colors.primary },
  todayDot: {
    width: 4, height: 4, borderRadius: 2,
    backgroundColor: Colors.primary,
  },
  timeline: { padding: Spacing.lg, paddingBottom: 100 },
  hourRow: { flexDirection: 'row', minHeight: 60, marginBottom: Spacing.xs },
  hourLabel: {
    width: 52, color: Colors.textMuted, fontSize: 11,
    fontWeight: '500', paddingTop: 2,
  },
  hourContent: { flex: 1, position: 'relative' },
  hourLine: {
    position: 'absolute', top: 8, left: 0, right: 0,
    height: 1, backgroundColor: Colors.glassBorder,
  },
  blockCard: { marginBottom: Spacing.xs, marginTop: Spacing.xs },
  blockTitle: { color: Colors.textPrimary, fontSize: 13, fontWeight: '600' },
  blockTime: { color: Colors.textMuted, fontSize: 11, marginTop: 2 },
});
