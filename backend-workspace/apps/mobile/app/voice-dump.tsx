// ============================================
// Antigravity — Voice Dump Screen
// ============================================

import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GlassmorphicCard } from '../components/ui/GlassmorphicCard';
import { Button } from '../components/ui/Button';
import { Colors, Spacing, BorderRadius, Typography } from '../constants/theme';
import { api } from '../services/api';

export default function VoiceDumpScreen() {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [parsedTasks, setParsedTasks] = useState<any[]>([]);
  const [isParsing, setIsParsing] = useState(false);

  const pulseScale = useSharedValue(1);
  const pulseOpacity = useSharedValue(0.4);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
    opacity: pulseOpacity.value,
  }));

  const startRecording = async () => {
    setIsRecording(true);
    pulseScale.value = withRepeat(withTiming(1.3, { duration: 1000 }), -1, true);
    pulseOpacity.value = withRepeat(withTiming(0.1, { duration: 1000 }), -1, true);
    // TODO: integrate expo-av Audio.Recording here
  };

  const stopRecording = async () => {
    setIsRecording(false);
    pulseScale.value = 1;
    pulseOpacity.value = 0.4;
    // TODO: stop recording, get audio URI, transcribe
    // For demo, use sample transcript:
    setTranscript(
      'I need to finish my math homework by Friday. Also I should study for the physics test next week. ' +
      'Oh and I need to email Professor Smith about the research project. ' +
      'Maybe I should also go for a run today.'
    );
  };

  const parseTranscript = async () => {
    if (!transcript) return;
    setIsParsing(true);
    try {
      const response = await api.parseVoice(transcript);
      setParsedTasks(response.data);
    } catch (err) {
      console.error('Parse failed:', err);
    } finally {
      setIsParsing(false);
    }
  };

  const saveTasks = async () => {
    try {
      for (const task of parsedTasks) {
        await api.createTask(task);
      }
      router.back();
    } catch (err) {
      console.error('Save failed:', err);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.content}>
        {/* Recording area */}
        <View style={styles.recordArea}>
          {isRecording && (
            <Animated.View style={[styles.pulse, pulseStyle]} />
          )}
          <Pressable
            style={[styles.recordBtn, isRecording && styles.recordBtnActive]}
            onPress={isRecording ? stopRecording : startRecording}
          >
            <Ionicons
              name={isRecording ? 'stop' : 'mic'}
              size={40}
              color={Colors.textPrimary}
            />
          </Pressable>
          <Text style={styles.recordLabel}>
            {isRecording ? 'Tap to stop' : 'Tap to start recording'}
          </Text>
          <Text style={styles.hint}>
            Talk freely about everything on your mind — tasks, ideas, deadlines.
            {'\n'}AI will extract the action items.
          </Text>
        </View>

        {/* Transcript */}
        {transcript && (
          <GlassmorphicCard padding={Spacing.md}>
            <Text style={styles.transcriptLabel}>📝 Transcript</Text>
            <Text style={styles.transcript}>{transcript}</Text>
            {parsedTasks.length === 0 && (
              <Button
                title="🧠 Parse with AI"
                onPress={parseTranscript}
                loading={isParsing}
                fullWidth
                style={{ marginTop: Spacing.md }}
              />
            )}
          </GlassmorphicCard>
        )}

        {/* Parsed tasks */}
        {parsedTasks.length > 0 && (
          <GlassmorphicCard padding={Spacing.md} glowColor={Colors.success}>
            <Text style={styles.parsedLabel}>
              ✅ {parsedTasks.length} tasks extracted
            </Text>
            {parsedTasks.map((task: any, i: number) => (
              <View key={i} style={styles.parsedTask}>
                <View style={[styles.dot, { backgroundColor: Colors.success }]} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.parsedTitle}>{task.title}</Text>
                  <Text style={styles.parsedMeta}>
                    P{task.priority} • {task.estimated_minutes}m
                    {task.tags?.length > 0 ? ` • ${task.tags.join(', ')}` : ''}
                  </Text>
                </View>
              </View>
            ))}
            <Button
              title="Save All Tasks"
              variant="success"
              onPress={saveTasks}
              fullWidth
              size="lg"
              style={{ marginTop: Spacing.md }}
            />
          </GlassmorphicCard>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { flex: 1, padding: Spacing.lg, gap: Spacing.lg },
  recordArea: { alignItems: 'center', paddingVertical: Spacing.xxl, position: 'relative' },
  pulse: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: Colors.danger,
    top: Spacing.xxl + 10,
  },
  recordBtn: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: Colors.glassBorder,
    zIndex: 1,
  },
  recordBtnActive: {
    backgroundColor: Colors.danger,
    borderColor: Colors.dangerLight,
  },
  recordLabel: { color: Colors.textPrimary, fontSize: 16, fontWeight: '600', marginTop: Spacing.lg },
  hint: { color: Colors.textMuted, fontSize: 13, textAlign: 'center', marginTop: Spacing.sm, lineHeight: 20 },
  transcriptLabel: { ...Typography.heading4, color: Colors.textPrimary, marginBottom: Spacing.sm },
  transcript: { color: Colors.textSecondary, fontSize: 14, lineHeight: 22, fontStyle: 'italic' },
  parsedLabel: { ...Typography.heading4, color: Colors.success, marginBottom: Spacing.md },
  parsedTask: {
    flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  dot: { width: 8, height: 8, borderRadius: 4, marginTop: 5 },
  parsedTitle: { color: Colors.textPrimary, fontSize: 14, fontWeight: '600' },
  parsedMeta: { color: Colors.textMuted, fontSize: 11, marginTop: 2 },
});
