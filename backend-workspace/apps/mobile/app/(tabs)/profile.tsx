// ============================================
// Antigravity — Profile Screen
// ============================================

import React from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GlassmorphicCard } from '../../components/ui/GlassmorphicCard';
import { ProgressRing } from '../../components/ui/ProgressRing';
import { StreakFlame } from '../../components/dashboard/StreakFlame';
import { TokenBadge } from '../../components/ui/TokenBadge';
import { Button } from '../../components/ui/Button';
import { useUserStore } from '../../store/useUserStore';
import { useTokenStore } from '../../store/useTokenStore';
import { Colors, Spacing, Typography, BorderRadius } from '../../constants/theme';

export default function ProfileScreen() {
  const { profile, logout } = useUserStore();
  const { balance, streakDays } = useTokenStore();

  const stats = [
    { label: 'Total Tokens', value: balance.toLocaleString(), icon: '🪙' },
    { label: 'Best Streak', value: `${profile?.longest_streak || 0} days`, icon: '🏆' },
    { label: 'Current Streak', value: `${streakDays} days`, icon: '🔥' },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Profile</Text>

        {/* Avatar & Name */}
        <GlassmorphicCard style={styles.profileCard} padding={Spacing.xl} glowColor={Colors.primaryStart}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {(profile?.display_name || 'U')[0].toUpperCase()}
              </Text>
            </View>
            <StreakFlame days={streakDays} size="sm" />
          </View>
          <Text style={styles.name}>{profile?.display_name || 'User'}</Text>
          <TokenBadge balance={balance} size="lg" />
        </GlassmorphicCard>

        {/* Stats */}
        <View style={styles.statsRow}>
          {stats.map((stat) => (
            <GlassmorphicCard key={stat.label} style={styles.statCard} padding={Spacing.md}>
              <Text style={styles.statIcon}>{stat.icon}</Text>
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </GlassmorphicCard>
          ))}
        </View>

        {/* Settings */}
        <Text style={styles.sectionTitle}>Settings</Text>
        {[
          { icon: 'notifications-outline' as const, label: 'Notifications', chevron: true },
          { icon: 'time-outline' as const, label: 'Timezone', subtitle: profile?.timezone, chevron: true },
          { icon: 'analytics-outline' as const, label: 'Weekly Report', chevron: true },
          { icon: 'shield-outline' as const, label: 'Privacy', chevron: true },
          { icon: 'information-circle-outline' as const, label: 'About Antigravity', chevron: true },
        ].map((item) => (
          <Pressable key={item.label}>
            <GlassmorphicCard style={styles.settingRow} padding={Spacing.md}>
              <Ionicons name={item.icon} size={22} color={Colors.textSecondary} />
              <View style={styles.settingContent}>
                <Text style={styles.settingLabel}>{item.label}</Text>
                {item.subtitle && <Text style={styles.settingSub}>{item.subtitle}</Text>}
              </View>
              {item.chevron && <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />}
            </GlassmorphicCard>
          </Pressable>
        ))}

        {/* Logout */}
        <View style={styles.logoutContainer}>
          <Button title="Sign Out" variant="danger" onPress={logout} fullWidth />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: Spacing.lg, paddingBottom: 100 },
  title: { ...Typography.heading1, color: Colors.textPrimary, marginBottom: Spacing.lg },
  profileCard: { alignItems: 'center', gap: Spacing.md, marginBottom: Spacing.lg },
  avatarContainer: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  avatar: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { color: Colors.textPrimary, fontSize: 28, fontWeight: '700' },
  name: { ...Typography.heading2, color: Colors.textPrimary },
  statsRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.xl },
  statCard: { flex: 1, alignItems: 'center', gap: 4 },
  statIcon: { fontSize: 24 },
  statValue: { color: Colors.textPrimary, fontSize: 16, fontWeight: '700' },
  statLabel: { color: Colors.textMuted, fontSize: 10, fontWeight: '600', textAlign: 'center' },
  sectionTitle: { ...Typography.heading4, color: Colors.textPrimary, marginBottom: Spacing.md },
  settingRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginBottom: Spacing.sm },
  settingContent: { flex: 1 },
  settingLabel: { color: Colors.textPrimary, fontSize: 15, fontWeight: '500' },
  settingSub: { color: Colors.textMuted, fontSize: 12, marginTop: 1 },
  logoutContainer: { marginTop: Spacing.xl },
});
