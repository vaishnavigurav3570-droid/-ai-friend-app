// ============================================
// Antigravity — Vault Screen
// ============================================

import React, { useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, Pressable, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GlassmorphicCard } from '../../components/ui/GlassmorphicCard';
import { useVaultStore } from '../../store/useVaultStore';
import { useTokenStore } from '../../store/useTokenStore';
import { Colors, Spacing, BorderRadius, Typography, Gradients } from '../../constants/theme';

export default function VaultScreen() {
  const { lockedApps, activeSessions, fetchApps, fetchSessions, toggleApp, endSession } = useVaultStore();
  const { balance } = useTokenStore();

  useEffect(() => {
    fetchApps();
    fetchSessions();
  }, []);

  const getTimeRemaining = (expiresAt: string) => {
    const diff = new Date(expiresAt).getTime() - Date.now();
    if (diff <= 0) return 'Expired';
    const mins = Math.floor(diff / 60000);
    const secs = Math.floor((diff % 60000) / 1000);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>The Vault</Text>
          <Text style={styles.subtitle}>Apps locked for focus</Text>
        </View>
        <Ionicons name="shield-checkmark" size={28} color={Colors.primary} />
      </View>

      {/* Active Sessions */}
      {activeSessions.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔓 Active Sessions</Text>
          {activeSessions.map((session) => (
            <GlassmorphicCard key={session.id} style={styles.sessionCard} padding={Spacing.md} glowColor={Colors.success}>
              <View style={styles.sessionRow}>
                <View>
                  <Text style={styles.sessionApp}>{session.locked_apps?.app_label || 'App'}</Text>
                  <Text style={styles.sessionTime}>{getTimeRemaining(session.expires_at)} remaining</Text>
                </View>
                <Pressable
                  onPress={() => endSession(session.id)}
                  style={styles.endBtn}
                >
                  <Text style={styles.endBtnText}>End Early</Text>
                </Pressable>
              </View>
            </GlassmorphicCard>
          ))}
        </View>
      )}

      {/* Locked Apps */}
      <Text style={[styles.sectionTitle, { paddingHorizontal: Spacing.lg }]}>🔒 Locked Apps</Text>
      <FlatList
        data={lockedApps}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <GlassmorphicCard style={styles.appCard} padding={Spacing.md}>
            <View style={styles.appRow}>
              <View style={styles.appIcon}>
                <Text style={{ fontSize: 24 }}>📱</Text>
              </View>
              <View style={styles.appInfo}>
                <Text style={styles.appName}>{item.app_label}</Text>
                <Text style={styles.appPackage}>{item.package_name}</Text>
                <View style={styles.appMeta}>
                  <Text style={styles.costText}>🪙 {item.unlock_cost}/15min</Text>
                  <Text style={styles.usageText}>
                    {item.today_usage_minutes || 0}/{item.daily_limit_minutes}min today
                  </Text>
                </View>
              </View>
              <Switch
                value={item.is_active}
                onValueChange={(v) => toggleApp(item.id, v)}
                trackColor={{ false: Colors.surfaceLight, true: `${Colors.primary}80` }}
                thumbColor={item.is_active ? Colors.primary : Colors.textMuted}
              />
            </View>
          </GlassmorphicCard>
        )}
        ListEmptyComponent={
          <GlassmorphicCard padding={Spacing.xl}>
            <View style={styles.empty}>
              <Ionicons name="shield-outline" size={48} color={Colors.textMuted} />
              <Text style={styles.emptyText}>No apps locked</Text>
              <Text style={styles.emptySubtext}>Add distracting apps to start building focus</Text>
            </View>
          </GlassmorphicCard>
        }
      />

      {/* Add app FAB */}
      <Pressable style={styles.fab}>
        <LinearGradient colors={[...Gradients.danger]} style={styles.fabGradient}>
          <Ionicons name="add" size={28} color={Colors.textPrimary} />
        </LinearGradient>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  title: { ...Typography.heading1, color: Colors.textPrimary },
  subtitle: { ...Typography.bodyMedium, color: Colors.textSecondary, marginTop: 2 },
  section: { paddingHorizontal: Spacing.lg, marginBottom: Spacing.md },
  sectionTitle: { ...Typography.heading4, color: Colors.textPrimary, marginBottom: Spacing.sm },
  sessionCard: { marginBottom: Spacing.sm },
  sessionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sessionApp: { color: Colors.textPrimary, fontSize: 16, fontWeight: '600' },
  sessionTime: { color: Colors.success, fontSize: 13, fontWeight: '700', marginTop: 2 },
  endBtn: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.danger,
  },
  endBtnText: { color: Colors.danger, fontSize: 12, fontWeight: '600' },
  list: { padding: Spacing.lg, paddingBottom: 120 },
  appCard: { marginBottom: Spacing.sm },
  appRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  appIcon: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appInfo: { flex: 1 },
  appName: { color: Colors.textPrimary, fontSize: 15, fontWeight: '600' },
  appPackage: { color: Colors.textMuted, fontSize: 11, marginTop: 1 },
  appMeta: { flexDirection: 'row', gap: Spacing.md, marginTop: 4 },
  costText: { color: Colors.tokenGold, fontSize: 11, fontWeight: '600' },
  usageText: { color: Colors.textMuted, fontSize: 11 },
  empty: { alignItems: 'center', gap: Spacing.sm },
  emptyText: { ...Typography.heading3, color: Colors.textPrimary },
  emptySubtext: { color: Colors.textSecondary, fontSize: 14, textAlign: 'center' },
  fab: { position: 'absolute', bottom: 24, right: 24 },
  fabGradient: {
    width: 60, height: 60, borderRadius: 30,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: Colors.danger, shadowOpacity: 0.5, shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 }, elevation: 8,
  },
});
