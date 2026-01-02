import React, { useState } from "react";
import { StyleSheet, View, ScrollView, Pressable, Switch } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRoute, RouteProp } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import Animated, { FadeIn } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { AnimatedBackground } from "@/components/AnimatedBackground";
import { GlassCard } from "@/components/GlassCard";
import { ThemedText } from "@/components/ThemedText";
import { CircularProgress } from "@/components/CircularProgress";
import { ProgressBar } from "@/components/ProgressBar";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import { RootStackParamList } from "@/navigation/RootStackNavigator";

type RouteProps = RouteProp<RootStackParamList, "AgentDetail">;

interface CallLog {
  id: string;
  contact: string;
  duration: string;
  status: "completed" | "missed" | "ongoing";
  time: string;
}

const MOCK_CALL_LOGS: CallLog[] = [
  { id: "1", contact: "John Smith", duration: "4:32", status: "completed", time: "2:30 PM" },
  { id: "2", contact: "Emily Davis", duration: "2:15", status: "completed", time: "1:45 PM" },
  { id: "3", contact: "Unknown", duration: "0:45", status: "missed", time: "12:30 PM" },
  { id: "4", contact: "Mike Johnson", duration: "8:12", status: "completed", time: "11:15 AM" },
];

export default function AgentDetailScreen() {
  const insets = useSafeAreaInsets();
  const route = useRoute<RouteProps>();
  const theme = Colors.dark;

  const [isActive, setIsActive] = useState(true);
  const [pilotMode, setPilotMode] = useState<"off" | "suggestive" | "autopilot">("suggestive");

  const handleToggleActive = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsActive(!isActive);
  };

  const handlePilotModeChange = (mode: "off" | "suggestive" | "autopilot") => {
    Haptics.selectionAsync();
    setPilotMode(mode);
  };

  return (
    <View style={styles.container}>
      <AnimatedBackground />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + Spacing.xl },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeIn}>
          <GlassCard style={styles.headerCard}>
            <View style={styles.agentHeader}>
              <View style={[styles.agentIcon, { backgroundColor: `${theme.primary}20` }]}>
                <Feather name="phone" size={28} color={theme.primary} />
              </View>
              <View style={styles.agentInfo}>
                <View style={styles.statusRow}>
                  <View
                    style={[
                      styles.statusDot,
                      { backgroundColor: isActive ? theme.success : theme.warning },
                    ]}
                  />
                  <ThemedText type="label" style={{ color: isActive ? theme.success : theme.warning }}>
                    {isActive ? "ONLINE" : "PAUSED"}
                  </ThemedText>
                </View>
                <ThemedText type="h2">Support Voice Bot</ThemedText>
                <ThemedText type="small" style={{ color: theme.textSecondary }}>
                  +1 (555) 123-4567
                </ThemedText>
              </View>
              <Switch
                value={isActive}
                onValueChange={handleToggleActive}
                trackColor={{ false: "rgba(255, 255, 255, 0.1)", true: theme.success }}
                thumbColor={theme.text}
              />
            </View>
          </GlassCard>
        </Animated.View>

        <Animated.View entering={FadeIn.delay(100)}>
          <View style={styles.statsRow}>
            <GlassCard style={styles.statCard}>
              <CircularProgress value={87} maxValue={100} size={70} strokeWidth={5} />
              <ThemedText type="caption" style={{ marginTop: Spacing.sm }}>
                Success Rate
              </ThemedText>
            </GlassCard>
            <GlassCard style={styles.statCard}>
              <ThemedText type="h2">120</ThemedText>
              <ThemedText type="caption" style={{ marginTop: Spacing.xs }}>
                Calls Today
              </ThemedText>
              <View style={styles.trendRow}>
                <Feather name="arrow-up" size={12} color={theme.success} />
                <ThemedText type="label" style={{ color: theme.success }}>
                  23%
                </ThemedText>
              </View>
            </GlassCard>
            <GlassCard style={styles.statCard}>
              <ThemedText type="h2">2:34</ThemedText>
              <ThemedText type="caption" style={{ marginTop: Spacing.xs }}>
                Avg Duration
              </ThemedText>
            </GlassCard>
          </View>
        </Animated.View>

        <Animated.View entering={FadeIn.delay(200)}>
          <ThemedText type="h4" style={styles.sectionTitle}>
            Pilot Mode
          </ThemedText>
          <GlassCard style={styles.pilotCard}>
            <ThemedText type="small" style={{ color: theme.textSecondary, marginBottom: Spacing.lg }}>
              Control how the AI handles conversations
            </ThemedText>
            <View style={styles.pilotOptions}>
              {(["off", "suggestive", "autopilot"] as const).map((mode) => (
                <Pressable
                  key={mode}
                  onPress={() => handlePilotModeChange(mode)}
                  style={[
                    styles.pilotOption,
                    pilotMode === mode && styles.pilotOptionActive,
                  ]}
                >
                  <Feather
                    name={mode === "off" ? "pause" : mode === "suggestive" ? "eye" : "zap"}
                    size={18}
                    color={pilotMode === mode ? theme.text : theme.textSecondary}
                  />
                  <ThemedText
                    type="small"
                    style={[
                      styles.pilotText,
                      pilotMode === mode && styles.pilotTextActive,
                    ]}
                  >
                    {mode === "off" ? "Off" : mode === "suggestive" ? "Suggest" : "Auto"}
                  </ThemedText>
                </Pressable>
              ))}
            </View>
            <View style={styles.pilotDescription}>
              <Feather name="info" size={14} color={theme.primary} />
              <ThemedText type="caption" style={{ color: theme.textSecondary, marginLeft: Spacing.sm, flex: 1 }}>
                {pilotMode === "off"
                  ? "AI is disabled. All responses are manual."
                  : pilotMode === "suggestive"
                  ? "AI generates responses for your approval before sending."
                  : "AI sends responses automatically without approval."}
              </ThemedText>
            </View>
          </GlassCard>
        </Animated.View>

        <Animated.View entering={FadeIn.delay(300)}>
          <View style={styles.sectionHeader}>
            <ThemedText type="h4">Recent Calls</ThemedText>
            <Pressable>
              <ThemedText type="small" style={{ color: theme.primary }}>View All</ThemedText>
            </Pressable>
          </View>
          <GlassCard noPadding style={styles.callsCard}>
            {MOCK_CALL_LOGS.map((call, index) => (
              <View key={call.id}>
                <Pressable
                  onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
                  style={styles.callRow}
                >
                  <View style={[styles.callIcon, { backgroundColor: call.status === "missed" ? `${theme.error}20` : `${theme.success}20` }]}>
                    <Feather
                      name={call.status === "missed" ? "phone-missed" : "phone-incoming"}
                      size={16}
                      color={call.status === "missed" ? theme.error : theme.success}
                    />
                  </View>
                  <View style={styles.callInfo}>
                    <ThemedText type="body">{call.contact}</ThemedText>
                    <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                      {call.duration} • {call.status === "missed" ? "Missed" : "Completed"}
                    </ThemedText>
                  </View>
                  <ThemedText type="caption" style={{ color: theme.textTertiary }}>
                    {call.time}
                  </ThemedText>
                </Pressable>
                {index < MOCK_CALL_LOGS.length - 1 ? <View style={styles.divider} /> : null}
              </View>
            ))}
          </GlassCard>
        </Animated.View>

        <Animated.View entering={FadeIn.delay(400)}>
          <ThemedText type="h4" style={styles.sectionTitle}>
            Performance
          </ThemedText>
          <GlassCard style={styles.performanceCard}>
            <View style={styles.performanceRow}>
              <ThemedText type="small">Customer Satisfaction</ThemedText>
              <ThemedText type="small" style={{ color: theme.success }}>94%</ThemedText>
            </View>
            <ProgressBar value={94} maxValue={100} color={theme.success} height={6} />

            <View style={[styles.performanceRow, { marginTop: Spacing.xl }]}>
              <ThemedText type="small">Resolution Rate</ThemedText>
              <ThemedText type="small" style={{ color: theme.primary }}>78%</ThemedText>
            </View>
            <ProgressBar value={78} maxValue={100} height={6} />

            <View style={[styles.performanceRow, { marginTop: Spacing.xl }]}>
              <ThemedText type="small">Transfer Rate</ThemedText>
              <ThemedText type="small" style={{ color: theme.warning }}>12%</ThemedText>
            </View>
            <ProgressBar value={12} maxValue={100} color={theme.warning} height={6} />
          </GlassCard>
        </Animated.View>

        <View style={styles.actionButtons}>
          <Pressable
            onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
            style={styles.editButton}
          >
            <Feather name="edit-2" size={18} color={theme.text} />
            <ThemedText type="body" style={{ fontWeight: "600", marginLeft: Spacing.sm }}>
              Edit Agent
            </ThemedText>
          </Pressable>
          <Pressable
            onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)}
            style={styles.deleteButton}
          >
            <Feather name="trash-2" size={18} color={theme.error} />
          </Pressable>
        </View>
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
    paddingTop: Spacing.lg,
  },
  headerCard: {
    marginBottom: Spacing.lg,
  },
  agentHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  agentIcon: {
    width: 64,
    height: 64,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.lg,
  },
  agentInfo: {
    flex: 1,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statsRow: {
    flexDirection: "row",
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  statCard: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.lg,
  },
  trendRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  sectionTitle: {
    marginBottom: Spacing.md,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  pilotCard: {
    marginBottom: Spacing.xl,
  },
  pilotOptions: {
    flexDirection: "row",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: BorderRadius.md,
    padding: 4,
    marginBottom: Spacing.lg,
  },
  pilotOption: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.sm,
    gap: Spacing.xs,
  },
  pilotOptionActive: {
    backgroundColor: Colors.dark.primary,
  },
  pilotText: {
    color: Colors.dark.textSecondary,
  },
  pilotTextActive: {
    color: Colors.dark.text,
    fontWeight: "600",
  },
  pilotDescription: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
  },
  callsCard: {
    marginBottom: Spacing.xl,
    overflow: "hidden",
  },
  callRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
  },
  callIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  callInfo: {
    flex: 1,
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    marginLeft: Spacing.lg + 40 + Spacing.md,
  },
  performanceCard: {
    marginBottom: Spacing.xl,
  },
  performanceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: Spacing.sm,
  },
  actionButtons: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  editButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.dark.primary,
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.xl,
  },
  deleteButton: {
    width: 56,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: `${Colors.dark.error}15`,
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: `${Colors.dark.error}30`,
  },
});
