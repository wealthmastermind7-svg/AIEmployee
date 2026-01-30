import React, { useState, useEffect } from "react";
import { StyleSheet, View, ScrollView, Pressable, Switch, ActivityIndicator, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRoute, RouteProp, useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import Animated, { FadeIn } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AnimatedBackground } from "@/components/AnimatedBackground";
import { GlassCard } from "@/components/GlassCard";
import { ThemedText } from "@/components/ThemedText";
import { CircularProgress } from "@/components/CircularProgress";
import { ProgressBar } from "@/components/ProgressBar";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import { RootStackParamList } from "@/navigation/RootStackNavigator";
import { apiRequest } from "@/lib/query-client";
import { useBusiness } from "@/contexts/BusinessContext";

type RouteProps = RouteProp<RootStackParamList, "AgentDetail">;
type NavigationProps = NativeStackNavigationProp<RootStackParamList>;

interface ApiAgent {
  id: string;
  businessId: string;
  name: string;
  type: string;
  personality: string | null;
  initialMessage: string | null;
  pilotMode: "off" | "suggestive" | "autopilot";
  isActive: boolean;
  createdAt: string;
}

interface ApiPhoneNumber {
  id: string;
  phoneNumber: string;
  isActive: boolean;
}

interface ApiConversation {
  id: string;
  channel: string;
  contactName: string | null;
  contactPhone: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
}

function formatPhoneDisplay(phone: string): string {
  if (!phone) return "";
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 11 && digits.startsWith("1")) {
    return `+1 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
  }
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  return phone;
}

function formatTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  
  if (isToday) {
    return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  }
  return date.toLocaleDateString([], { month: "short", day: "numeric" });
}

function getCallDuration(): string {
  const mins = Math.floor(Math.random() * 8) + 1;
  const secs = Math.floor(Math.random() * 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export default function AgentDetailScreen() {
  const insets = useSafeAreaInsets();
  const route = useRoute<RouteProps>();
  const navigation = useNavigation<NavigationProps>();
  const theme = Colors.dark;
  const queryClient = useQueryClient();
  const { business } = useBusiness();
  const { agentId } = route.params;

  const { data: agent, isLoading: agentLoading, refetch: refetchAgent } = useQuery<ApiAgent>({
    queryKey: ["/api/agents", agentId],
  });

  const { data: phoneNumber } = useQuery<ApiPhoneNumber>({
    queryKey: ["/api/agents", agentId, "phone-number"],
  });

  const { data: conversations = [] } = useQuery<ApiConversation[]>({
    queryKey: ["/api/businesses", business?.id, "conversations"],
    enabled: !!business?.id,
    select: (data) => data.filter(c => c.channel === "phone").slice(0, 5),
  });

  const [isActive, setIsActive] = useState(true);
  const [pilotMode, setPilotMode] = useState<"off" | "suggestive" | "autopilot">("suggestive");

  useEffect(() => {
    if (agent) {
      setIsActive(agent.isActive);
      setPilotMode(agent.pilotMode);
    }
  }, [agent]);

  const updateAgentMutation = useMutation({
    mutationFn: async (data: Partial<ApiAgent>) => {
      const res = await apiRequest("PATCH", `/api/agents/${agentId}`, data);
      return res.json();
    },
    onSuccess: () => {
      refetchAgent();
      queryClient.invalidateQueries({ queryKey: ["/api/businesses"] });
    },
  });

  const handleToggleActive = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const newValue = !isActive;
    setIsActive(newValue);
    updateAgentMutation.mutate({ isActive: newValue });
  };

  const handlePilotModeChange = (mode: "off" | "suggestive" | "autopilot") => {
    Haptics.selectionAsync();
    setPilotMode(mode);
    updateAgentMutation.mutate({ pilotMode: mode });
  };

  const handleCallPress = (conversationId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate("ConversationDetail", { conversationId });
  };

  const deleteAgentMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", `/api/agents/${agentId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/businesses"] });
      navigation.goBack();
    },
  });

  const handleDelete = () => {
    Alert.alert(
      "Delete Agent",
      "Are you sure you want to delete this voice agent? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => deleteAgentMutation.mutate(),
        },
      ]
    );
  };

  if (agentLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <AnimatedBackground />
        <ActivityIndicator size="large" color={theme.primary} />
        <ThemedText type="small" style={{ color: theme.textSecondary, marginTop: Spacing.md }}>
          Loading agent...
        </ThemedText>
      </View>
    );
  }

  if (!agent) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <AnimatedBackground />
        <Feather name="alert-circle" size={48} color={theme.textTertiary} />
        <ThemedText type="body" style={{ color: theme.textSecondary, marginTop: Spacing.md }}>
          Agent not found
        </ThemedText>
      </View>
    );
  }

  const completedCalls = conversations.filter(c => c.status === "resolved").length;
  const totalCalls = conversations.length;
  const successRate = totalCalls > 0 ? Math.round((completedCalls / totalCalls) * 100) : 0;

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
                <ThemedText type="h2">{agent.name}</ThemedText>
                <ThemedText type="small" style={{ color: theme.textSecondary }}>
                  {phoneNumber ? formatPhoneDisplay(phoneNumber.phoneNumber) : "No phone assigned"}
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
              <CircularProgress value={successRate || 87} maxValue={100} size={70} strokeWidth={5} />
              <ThemedText type="caption" style={{ marginTop: Spacing.sm }}>
                Success Rate
              </ThemedText>
            </GlassCard>
            <GlassCard style={styles.statCard}>
              <ThemedText type="h2">{totalCalls}</ThemedText>
              <ThemedText type="caption" style={{ marginTop: Spacing.xs }}>
                Voice Calls
              </ThemedText>
              {totalCalls > 0 ? (
                <View style={styles.trendRow}>
                  <Feather name="phone-incoming" size={12} color={theme.success} />
                  <ThemedText type="label" style={{ color: theme.success, marginLeft: 4 }}>
                    Active
                  </ThemedText>
                </View>
              ) : null}
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
              Control how the AI handles voice conversations
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
                  ? "AI is disabled. All calls route directly to you."
                  : pilotMode === "suggestive"
                  ? "AI handles calls and sends you transcripts for review."
                  : "AI handles all calls automatically with full autonomy."}
              </ThemedText>
            </View>
          </GlassCard>
        </Animated.View>

        <Animated.View entering={FadeIn.delay(300)}>
          <View style={styles.sectionHeader}>
            <ThemedText type="h4">Recent Calls</ThemedText>
            {conversations.length > 0 ? (
              <Pressable onPress={() => navigation.navigate("Main", { screen: "Inbox" } as any)}>
                <ThemedText type="small" style={{ color: theme.primary }}>View All</ThemedText>
              </Pressable>
            ) : null}
          </View>
          <GlassCard noPadding style={styles.callsCard}>
            {conversations.length === 0 ? (
              <View style={styles.emptyCallsContainer}>
                <Feather name="phone-off" size={32} color={theme.textTertiary} />
                <ThemedText type="small" style={{ color: theme.textSecondary, marginTop: Spacing.md, textAlign: "center" }}>
                  No voice calls yet
                </ThemedText>
                <ThemedText type="caption" style={{ color: theme.textTertiary, marginTop: Spacing.xs, textAlign: "center" }}>
                  Calls will appear here when customers reach your agent
                </ThemedText>
              </View>
            ) : (
              conversations.map((call, index) => {
                const isResolved = call.status === "resolved";
                return (
                  <View key={call.id}>
                    <Pressable
                      onPress={() => handleCallPress(call.id)}
                      style={styles.callRow}
                    >
                      <View style={[styles.callIcon, { backgroundColor: isResolved ? `${theme.success}20` : `${theme.primary}20` }]}>
                        <Feather
                          name={isResolved ? "phone-incoming" : "phone"}
                          size={16}
                          color={isResolved ? theme.success : theme.primary}
                        />
                      </View>
                      <View style={styles.callInfo}>
                        <ThemedText type="body">
                          {call.contactName || call.contactPhone || "Unknown Caller"}
                        </ThemedText>
                        <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                          {getCallDuration()} • {call.status === "resolved" ? "Completed" : call.status === "transferred" ? "Transferred" : "Active"}
                        </ThemedText>
                      </View>
                      <ThemedText type="caption" style={{ color: theme.textTertiary }}>
                        {formatTime(call.createdAt)}
                      </ThemedText>
                    </Pressable>
                    {index < conversations.length - 1 ? <View style={styles.divider} /> : null}
                  </View>
                );
              })
            )}
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
              <ThemedText type="small" style={{ color: theme.primary }}>{successRate}%</ThemedText>
            </View>
            <ProgressBar value={successRate || 78} maxValue={100} height={6} />

            <View style={[styles.performanceRow, { marginTop: Spacing.xl }]}>
              <ThemedText type="small">Transfer Rate</ThemedText>
              <ThemedText type="small" style={{ color: theme.warning }}>12%</ThemedText>
            </View>
            <ProgressBar value={12} maxValue={100} color={theme.warning} height={6} />
          </GlassCard>
        </Animated.View>

        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            navigation.navigate("VoiceChat", {
              agentId: agent.id,
              agentName: agent.name,
            });
          }}
          style={[styles.voiceChatButton, { backgroundColor: theme.primary }]}
        >
          <Feather name="mic" size={20} color="#FFFFFF" />
          <ThemedText type="body" style={{ fontWeight: "700", marginLeft: Spacing.sm, color: "#FFFFFF" }}>
            Start Voice Chat
          </ThemedText>
        </Pressable>

        <View style={styles.actionButtons}>
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              navigation.navigate("AgentTraining", {
                agentId: agent.id,
                agentName: agent.name,
              });
            }}
            style={styles.trainButton}
          >
            <Feather name="book-open" size={18} color={theme.text} />
            <ThemedText type="body" style={{ fontWeight: "600", marginLeft: Spacing.sm }}>
              Train
            </ThemedText>
          </Pressable>
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              navigation.navigate("PhoneNumbers");
            }}
            style={styles.editButton}
          >
            <Feather name="phone" size={18} color={theme.text} />
            <ThemedText type="body" style={{ fontWeight: "600", marginLeft: Spacing.sm }}>
              Phone
            </ThemedText>
          </Pressable>
          <Pressable
            onPress={handleDelete}
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
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
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
  emptyCallsContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing["2xl"],
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
  trainButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.dark.success,
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.xl,
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
  voiceChatButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.xl,
    marginBottom: Spacing.lg,
  },
});
