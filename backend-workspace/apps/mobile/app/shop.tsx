// ============================================
// Antigravity — Token Shop Screen
// ============================================

import React, { useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GlassmorphicCard } from '../components/ui/GlassmorphicCard';
import { TokenBadge } from '../components/ui/TokenBadge';
import { Button } from '../components/ui/Button';
import { useTokenStore } from '../store/useTokenStore';
import { useVaultStore } from '../store/useVaultStore';
import { Colors, Spacing, BorderRadius, Typography, Gradients } from '../constants/theme';

export default function ShopScreen() {
  const { balance, fetchBalance } = useTokenStore();
  const { lockedApps, fetchApps } = useVaultStore();
  const { unlockApp } = useTokenStore();

  useEffect(() => {
    fetchBalance();
    fetchApps();
  }, []);

  const handleUnlock = async (appId: string, duration: number) => {
    try {
      await unlockApp(appId, duration);
      await fetchBalance();
    } catch (err: any) {
      console.error('Unlock failed:', err);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Balance header */}
        <GlassmorphicCard style={styles.balanceCard} padding={Spacing.xl} glowColor={Colors.tokenGold}>
          <Text style={styles.balanceLabel}>Your Token Balance</Text>
          <TokenBadge balance={balance} size="lg" />
          <Text style={styles.balanceHint}>
            Earn tokens by completing tasks and building streaks
          </Text>
        </GlassmorphicCard>

        {/* Unlock Apps section */}
        <Text style={styles.sectionTitle}>🔓 Unlock Apps</Text>
        <Text style={styles.sectionSub}>Spend tokens to unlock your favorite apps temporarily</Text>

        {lockedApps.filter((a) => a.is_active).map((app) => (
          <GlassmorphicCard key={app.id} style={styles.appCard} padding={Spacing.md}>
            <View style={styles.appHeader}>
              <View style={styles.appIcon}>
                <Text style={{ fontSize: 24 }}>📱</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.appName}>{app.app_label}</Text>
                <Text style={styles.appCost}>Base cost: 🪙 {app.unlock_cost}/15min</Text>
              </View>
            </View>
            <View style={styles.durations}>
              {[
                { min: 15, label: '15 min' },
                { min: 30, label: '30 min' },
                { min: 60, label: '1 hour' },
              ].map((d) => {
                const cost = Math.ceil(app.unlock_cost * (d.min / 15));
                const canAfford = balance >= cost;
                return (
                  <Pressable
                    key={d.min}
                    onPress={() => canAfford && handleUnlock(app.id, d.min)}
                    style={[styles.durationBtn, !canAfford && styles.disabledBtn]}
                  >
                    <Text style={styles.durationLabel}>{d.label}</Text>
                    <Text style={[styles.durationCost, !canAfford && styles.disabledText]}>
                      🪙 {cost}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </GlassmorphicCard>
        ))}

        {lockedApps.filter((a) => a.is_active).length === 0 && (
          <GlassmorphicCard padding={Spacing.xl}>
            <View style={styles.empty}>
              <Ionicons name="storefront-outline" size={48} color={Colors.textMuted} />
              <Text style={styles.emptyText}>No locked apps yet</Text>
              <Text style={styles.emptySubtext}>Add apps in the Vault to unlock them here</Text>
            </View>
          </GlassmorphicCard>
        )}

        {/* Rewards section */}
        <Text style={[styles.sectionTitle, { marginTop: Spacing.xl }]}>🏆 Rewards</Text>
        <Text style={styles.sectionSub}>Coming soon — theme packs, power-ups, and more!</Text>

        {[
          { name: 'Dark Neon Theme', cost: 500, icon: '🎨', available: false },
          { name: 'Double Token Hour', cost: 200, icon: '⚡', available: false },
          { name: 'Streak Shield', cost: 300, icon: '🛡️', available: false },
        ].map((reward) => (
          <GlassmorphicCard key={reward.name} style={styles.rewardCard} padding={Spacing.md}>
            <Text style={{ fontSize: 28 }}>{reward.icon}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.rewardName}>{reward.name}</Text>
              <Text style={styles.rewardCost}>🪙 {reward.cost}</Text>
            </View>
            <View style={styles.comingSoon}>
              <Text style={styles.comingSoonText}>SOON</Text>
            </View>
          </GlassmorphicCard>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: Spacing.lg, paddingBottom: 100 },
  balanceCard: { alignItems: 'center', gap: Spacing.md, marginBottom: Spacing.xl },
  balanceLabel: { color: Colors.textSecondary, fontSize: 14, fontWeight: '500' },
  balanceHint: { color: Colors.textMuted, fontSize: 12, textAlign: 'center' },
  sectionTitle: { ...Typography.heading3, color: Colors.textPrimary },
  sectionSub: { color: Colors.textSecondary, fontSize: 13, marginBottom: Spacing.md },
  appCard: { marginBottom: Spacing.md },
  appHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginBottom: Spacing.md },
  appIcon: {
    width: 44, height: 44, borderRadius: BorderRadius.md,
    backgroundColor: Colors.surfaceLight, alignItems: 'center', justifyContent: 'center',
  },
  appName: { color: Colors.textPrimary, fontSize: 16, fontWeight: '600' },
  appCost: { color: Colors.tokenGold, fontSize: 12, marginTop: 2 },
  durations: { flexDirection: 'row', gap: Spacing.sm },
  durationBtn: {
    flex: 1, alignItems: 'center', padding: Spacing.sm,
    borderRadius: BorderRadius.md, backgroundColor: Colors.surfaceLight,
    borderWidth: 1, borderColor: Colors.glassBorder, gap: 4,
  },
  disabledBtn: { opacity: 0.4 },
  durationLabel: { color: Colors.textSecondary, fontSize: 12, fontWeight: '600' },
  durationCost: { color: Colors.tokenGold, fontSize: 13, fontWeight: '700' },
  disabledText: { color: Colors.textMuted },
  empty: { alignItems: 'center', gap: Spacing.sm },
  emptyText: { ...Typography.heading4, color: Colors.textPrimary },
  emptySubtext: { color: Colors.textSecondary, fontSize: 13, textAlign: 'center' },
  rewardCard: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    marginBottom: Spacing.sm,
  },
  rewardName: { color: Colors.textPrimary, fontSize: 15, fontWeight: '600' },
  rewardCost: { color: Colors.tokenGold, fontSize: 12, marginTop: 2 },
  comingSoon: {
    backgroundColor: Colors.surfaceLight, paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  comingSoonText: { color: Colors.textMuted, fontSize: 10, fontWeight: '700', letterSpacing: 1 },
});
