import React from "react";
import { StyleSheet, View, ScrollView, Pressable, FlatList } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { AnimatedBackground } from "@/components/AnimatedBackground";
import { GlassCard } from "@/components/GlassCard";
import { ThemedText } from "@/components/ThemedText";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import { useBusiness } from "@/contexts/BusinessContext";
import { format } from "date-fns";

export default function UsageScreen() {
  const insets = useSafeAreaInsets();
  const theme = Colors.dark;
  const { business } = useBusiness();

  const { data: usageLogs } = useQuery<any[]>({
    queryKey: [`/api/businesses/${business?.id}/usage`],
    enabled: !!business?.id,
  });

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.logItem}>
      <View style={[styles.iconContainer, { backgroundColor: item.type === 'ai_message' ? '#135bec20' : '#10b98120' }]}>
        <Feather 
          name={item.type === 'ai_message' ? 'message-circle' : 'phone'} 
          size={16} 
          color={item.type === 'ai_message' ? theme.primary : theme.success} 
        />
      </View>
      <View style={styles.logInfo}>
        <ThemedText type="body" style={styles.logType}>
          {item.type.replace(/_/g, ' ').toUpperCase()}
        </ThemedText>
        <ThemedText type="caption" style={{ color: theme.textSecondary }}>
          {item.createdAt ? format(new Date(item.createdAt), "MMM d, h:mm a") : 'N/A'}
        </ThemedText>
      </View>
      <View style={styles.logQuantity}>
        <ThemedText type="body" style={{ fontWeight: "600" }}>
          -{item.creditsUsed || 0}
        </ThemedText>
        <ThemedText type="caption" style={{ color: theme.textTertiary }}>
          Credits
        </ThemedText>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <AnimatedBackground />
      <View style={[styles.header, { paddingTop: insets.top + Spacing.lg }]}>
        <ThemedText type="h1">AI Usage</ThemedText>
        <ThemedText type="body" style={{ color: theme.textSecondary }}>
          Track and control your AI resources
        </ThemedText>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={{ paddingBottom: insets.bottom + Spacing.xl }}
      >
        <GlassCard style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <ThemedText type="h4">Current Balance</ThemedText>
            <View style={styles.badge}>
              <ThemedText type="caption" style={{ color: theme.primary }}>PRO PLAN</ThemedText>
            </View>
          </View>
          <ThemedText type="display" style={styles.balanceText}>
            {business?.aiCreditsRemaining?.toLocaleString()}
          </ThemedText>
          <ThemedText type="caption" style={{ color: theme.textTertiary }}>
            Credits remaining for this billing cycle
          </ThemedText>
        </GlassCard>

        <ThemedText type="h4" style={styles.sectionTitle}>Recent Activity</ThemedText>
        <GlassCard noPadding style={styles.logsCard}>
          {usageLogs && usageLogs.length > 0 ? (
            usageLogs.map((log, index) => (
              <React.Fragment key={log.id}>
                {renderItem({ item: log })}
                {index < usageLogs.length - 1 && <View style={styles.divider} />}
              </React.Fragment>
            ))
          ) : (
            <View style={{ padding: Spacing.xl, alignItems: 'center' }}>
              <ThemedText type="body" style={{ color: theme.textTertiary }}>No usage logs found</ThemedText>
            </View>
          )}
        </GlassCard>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: Spacing["2xl"],
    marginBottom: Spacing.xl,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: Spacing["2xl"],
  },
  summaryCard: {
    padding: Spacing.xl,
    marginBottom: Spacing.xl,
  },
  summaryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  badge: {
    backgroundColor: "rgba(19, 91, 236, 0.15)",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  balanceText: {
    color: Colors.dark.text,
    fontSize: 48,
    lineHeight: 56,
  },
  sectionTitle: {
    marginBottom: Spacing.md,
  },
  logsCard: {
    marginBottom: Spacing.xl,
  },
  logItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  logInfo: {
    flex: 1,
  },
  logType: {
    fontSize: 14,
    fontWeight: "600",
  },
  logQuantity: {
    alignItems: "flex-end",
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    marginHorizontal: Spacing.lg,
  },
});
