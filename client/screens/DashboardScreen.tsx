import React from "react";
import { StyleSheet, View, ScrollView, Pressable, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { Feather } from "@expo/vector-icons";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { useQuery } from "@tanstack/react-query";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "@/navigation/RootStackNavigator";
import { AnimatedBackground } from "@/components/AnimatedBackground";
import { GlassCard } from "@/components/GlassCard";
import { CircularProgress } from "@/components/CircularProgress";
import { ProgressBar } from "@/components/ProgressBar";
import { StatCard } from "@/components/StatCard";
import { ThemedText } from "@/components/ThemedText";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import { useBusiness } from "@/contexts/BusinessContext";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface DashboardStats {
  aiCreditsRemaining: number;
  subscriptionTier: string;
  totalAgents: number;
  totalConversations: number;
  activeConversations: number;
}

export default function DashboardScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const theme = Colors.dark;
  const { business } = useBusiness();

  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/businesses", business?.id, "stats"],
    enabled: !!business?.id,
  });

  const notificationScale = useSharedValue(1);
  const notificationStyle = useAnimatedStyle(() => ({
    transform: [{ scale: notificationScale.value }],
  }));

  const handleNotificationPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    notificationScale.value = withSpring(0.9, {}, () => {
      notificationScale.value = withSpring(1);
    });
  };

  const creditsUsed = stats ? 5000 - stats.aiCreditsRemaining : 0;
  const creditsPercentage = stats ? Math.round((creditsUsed / 5000) * 100) : 0;

  return (
    <View style={styles.container}>
      <AnimatedBackground />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: insets.top + Spacing.lg,
            paddingBottom: tabBarHeight + Spacing.xl,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Pressable 
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              navigation.navigate("Main", { screen: "Settings" } as any);
            }}
            style={styles.profileContainer}
          >
            <View style={styles.avatar}>
              <Feather name="user" size={20} color={theme.text} />
            </View>
            <View style={styles.statusDot} />
          </Pressable>
          <AnimatedPressable
            onPress={handleNotificationPress}
            style={[styles.notificationButton, notificationStyle]}
          >
            <View style={styles.notificationBg}>
              <Feather name="bell" size={22} color={theme.text} />
              <View style={styles.notificationBadge}>
                <View style={styles.notificationPulse} />
              </View>
            </View>
          </AnimatedPressable>
        </View>

        <View style={styles.greeting}>
          <Pressable onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            navigation.navigate("Main", { screen: "Settings" } as any);
          }}>
            <ThemedText type="body" style={{ color: theme.textSecondary }}>
              {business?.name || "Your Business"}
            </ThemedText>
          </Pressable>
        </View>

        <GlassCard style={styles.revenueCard} onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          Alert.alert("Revenue", "Detailed revenue reports coming soon!");
        }}>
          <ThemedText type="label" style={styles.revenueLabel}>
            Total Revenue
          </ThemedText>
          <View style={styles.revenueRow}>
            <ThemedText type="display" style={styles.revenueValue}>
              $14,230
            </ThemedText>
            <View style={styles.trendBadge}>
              <Feather name="trending-up" size={14} color={theme.success} />
              <ThemedText type="caption" style={{ color: theme.success, marginLeft: 4 }}>
                +12%
              </ThemedText>
            </View>
          </View>
        </GlassCard>

        <View style={styles.metersRow}>
          <GlassCard 
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              navigation.navigate("Main", { screen: "Inbox" } as any);
            }} 
            style={styles.meterCard}
          >
            <View style={styles.pulseIndicator}>
              <View style={[styles.pulseDot, { backgroundColor: theme.primary }]} />
            </View>
            <CircularProgress
              value={stats?.activeConversations || 0}
              maxValue={Math.max(stats?.totalConversations || 1, 10)}
              size={80}
              strokeWidth={5}
              label="Active Chats"
            />
          </GlassCard>

          <GlassCard onPress={() => navigation.navigate("Usage")} style={styles.creditsCard}>
            <View style={styles.creditsHeader}>
              <View style={[styles.iconBadge, { backgroundColor: `${theme.primary}20` }]}>
                <Feather name="cpu" size={18} color={theme.primary} />
              </View>
            </View>
            <ThemedText type="h2" style={styles.creditsValue}>
              {stats?.aiCreditsRemaining?.toLocaleString() || "0"}
            </ThemedText>
            <ThemedText type="caption" style={{ color: theme.textTertiary }}>
              AI Credits Remaining
            </ThemedText>
            <View style={styles.usageBar}>
              <View style={styles.usageLabels}>
                <ThemedText type="label">Usage</ThemedText>
                <ThemedText type="label">{creditsPercentage}%</ThemedText>
              </View>
              <ProgressBar value={creditsPercentage} maxValue={100} height={4} />
            </View>
          </GlassCard>
        </View>

        <View style={styles.statsGrid}>
          <StatCard
            title="Avg Response"
            value="1.2s"
            progress={90}
            progressColor={theme.success}
            onPress={() => Alert.alert("Performance", "Your average response time is optimized.")}
          />
          <StatCard
            title="Sentiment"
            value="98%"
            progress={98}
            progressColor={theme.purple}
            onPress={() => Alert.alert("Sentiment", "Customer satisfaction is at an all-time high.")}
          />
        </View>

        <View style={styles.statsGrid}>
          <StatCard
            title="Total Agents"
            value={String(stats?.totalAgents || 0)}
            trend={{ value: "Active", isPositive: true }}
            onPress={() => navigation.navigate("Main", { screen: "Agents" } as any)}
          />
          <GlassCard onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            Alert.alert("Credits", "Add more AI credits to your workspace?", [
              { text: "Buy Credits", onPress: () => {} },
              { text: "Cancel", style: "cancel" }
            ]);
          }} style={styles.addCreditsCard}>
            <View style={[styles.addIconContainer, { backgroundColor: `${theme.primary}20` }]}>
              <Feather name="plus" size={20} color={theme.primary} />
            </View>
            <ThemedText type="small" style={{ fontWeight: "600", marginTop: Spacing.sm }}>
              Add Credits
            </ThemedText>
          </GlassCard>
        </View>

        <GlassCard style={styles.chartCard}>
          <View style={styles.chartHeader}>
            <ThemedText type="body" style={{ fontWeight: "600" }}>
              Weekly Activity
            </ThemedText>
            <Pressable 
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                Alert.alert("Period", "Select display period", [
                  { text: "Last 7 Days" },
                  { text: "Last 30 Days" },
                  { text: "Cancel", style: "cancel" }
                ]);
              }}
              style={styles.chartFilter}
            >
              <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                Last 7 Days
              </ThemedText>
              <Feather name="chevron-down" size={14} color={theme.textSecondary} />
            </Pressable>
          </View>
          <View style={styles.chartContainer}>
            <View style={styles.chartLine} />
            <View style={styles.chartBars}>
              {[40, 55, 70, 60, 85, 75, 90].map((height, index) => (
                <View key={index} style={styles.barContainer}>
                  <View
                    style={[
                      styles.bar,
                      {
                        height: `${height}%`,
                        backgroundColor: index === 6 ? theme.primary : `${theme.primary}40`,
                      },
                    ]}
                  />
                </View>
              ))}
            </View>
            <View style={styles.chartLabels}>
              {["M", "T", "W", "T", "F", "S", "S"].map((day, index) => (
                <ThemedText key={index} type="label" style={styles.chartLabel}>
                  {day}
                </ThemedText>
              ))}
            </View>
          </View>
        </GlassCard>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing["2xl"],
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  profileContainer: {
    position: "relative",
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  statusDot: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.dark.success,
    borderWidth: 2,
    borderColor: Colors.dark.backgroundRoot,
  },
  notificationButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  notificationBg: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(23, 29, 41, 0.6)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  notificationBadge: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.dark.primary,
  },
  notificationPulse: {
    position: "absolute",
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.dark.primary,
    opacity: 0.5,
  },
  greeting: {
    marginBottom: Spacing.lg,
  },
  revenueCard: {
    marginBottom: Spacing.lg,
    padding: Spacing["2xl"],
  },
  revenueLabel: {
    marginBottom: Spacing.xs,
  },
  revenueRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: Spacing.md,
  },
  revenueValue: {
    color: Colors.dark.text,
  },
  trendBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.dark.successBg,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: `${Colors.dark.success}30`,
    marginBottom: Spacing.sm,
  },
  metersRow: {
    flexDirection: "row",
    gap: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  meterCard: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing["2xl"],
    position: "relative",
  },
  pulseIndicator: {
    position: "absolute",
    top: Spacing.lg,
    right: Spacing.lg,
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  creditsCard: {
    flex: 1,
    padding: Spacing.lg,
  },
  creditsHeader: {
    marginBottom: Spacing.sm,
  },
  iconBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  creditsValue: {
    marginBottom: 2,
  },
  usageBar: {
    marginTop: Spacing.lg,
  },
  usageLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: Spacing.xs,
  },
  statsGrid: {
    flexDirection: "row",
    gap: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  addCreditsCard: {
    flex: 1,
    alignItems: "flex-start",
    justifyContent: "center",
    padding: Spacing.lg,
  },
  addIconContainer: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  chartCard: {
    padding: Spacing.xl,
    marginBottom: Spacing.lg,
  },
  chartHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  chartFilter: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.xs,
    gap: 4,
  },
  chartContainer: {
    height: 120,
    position: "relative",
  },
  chartLine: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.05)",
  },
  chartBars: {
    flex: 1,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    paddingBottom: 24,
  },
  barContainer: {
    flex: 1,
    height: "100%",
    alignItems: "center",
    justifyContent: "flex-end",
  },
  bar: {
    width: 8,
    borderRadius: 4,
    minHeight: 8,
  },
  chartLabels: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  chartLabel: {
    flex: 1,
    textAlign: "center",
  },
});
