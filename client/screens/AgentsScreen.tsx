import React, { useState } from "react";
import { StyleSheet, View, ScrollView, Pressable, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  FadeIn,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { useQuery } from "@tanstack/react-query";
import { AnimatedBackground } from "@/components/AnimatedBackground";
import { GlassCard } from "@/components/GlassCard";
import { ThemedText } from "@/components/ThemedText";
import { Button } from "@/components/Button";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import { RootStackParamList } from "@/navigation/RootStackNavigator";
import { useBusiness } from "@/contexts/BusinessContext";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

type AgentType = "all" | "voice";

interface Agent {
  id: string;
  name: string;
  type: "voice";
  isActive: boolean;
  direction: string;
  pilotMode: string;
  createdAt: string;
}

const FILTERS: { key: AgentType; label: string }[] = [
  { key: "all", label: "All Agents" },
  { key: "voice", label: "Voice" },
];

const getAgentIcon = (type: string): keyof typeof Feather.glyphMap => {
  switch (type) {
    case "voice":
      return "phone";
    case "chat":
      return "message-square";
    case "sms":
      return "smartphone";
    default:
      return "cpu";
  }
};

export default function AgentsScreen() {
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const navigation = useNavigation<NavigationProp>();
  const theme = Colors.dark;
  const [activeFilter, setActiveFilter] = useState<AgentType>("all");
  const { business } = useBusiness();

  const { data: agents = [], isLoading } = useQuery<Agent[]>({
    queryKey: ["/api/businesses", business?.id, "agents"],
    enabled: !!business?.id,
  });

  const handleFilterPress = (filter: AgentType) => {
    Haptics.selectionAsync();
    setActiveFilter(filter);
  };

  const handleAgentPress = (agent: Agent) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate("AgentDetail", { agentId: agent.id });
  };

  const handleCreateAgent = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate("CreateAgent");
  };

  const filteredAgents = agents.filter((agent) => {
    if (activeFilter === "all") return true;
    return agent.type === activeFilter;
  });

  const activeCount = agents.filter((a) => a.isActive).length;
  const pausedCount = agents.filter((a) => !a.isActive).length;

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
          <View style={styles.profileButton}>
            <Feather name="user" size={20} color={theme.text} />
          </View>
          <View style={styles.headerActions}>
            <Pressable style={styles.headerButton}>
              <Feather name="search" size={22} color={theme.text} />
            </Pressable>
            <Pressable style={styles.headerButton}>
              <Feather name="bell" size={22} color={theme.text} />
            </Pressable>
          </View>
        </View>

        <View style={styles.titleSection}>
          <View style={styles.titleRow}>
            <ThemedText type="h1">Your </ThemedText>
            <ThemedText type="h1" style={{ color: theme.primary }}>
              AI Agents
            </ThemedText>
          </View>
          <View style={styles.statusRow}>
            <View style={styles.statusItem}>
              <View style={[styles.statusDot, { backgroundColor: theme.success }]} />
              <ThemedText type="small" style={{ color: theme.textSecondary }}>
                {activeCount} Active
              </ThemedText>
            </View>
            <ThemedText type="small" style={{ color: theme.textTertiary }}>
              {" "}
              {" "}
            </ThemedText>
            <ThemedText type="small" style={{ color: theme.textSecondary }}>
              {pausedCount} Paused
            </ThemedText>
          </View>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersContainer}
        >
          {FILTERS.map((filter) => (
            <Pressable
              key={filter.key}
              onPress={() => handleFilterPress(filter.key)}
              style={[
                styles.filterPill,
                activeFilter === filter.key && styles.filterPillActive,
              ]}
            >
              <ThemedText
                type="small"
                style={[
                  styles.filterText,
                  activeFilter === filter.key && styles.filterTextActive,
                ]}
              >
                {filter.label}
              </ThemedText>
            </Pressable>
          ))}
        </ScrollView>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.primary} />
            <ThemedText type="small" style={{ color: theme.textSecondary, marginTop: Spacing.md }}>
              Loading agents...
            </ThemedText>
          </View>
        ) : filteredAgents.length === 0 ? (
          <GlassCard style={styles.emptyCard}>
            <Feather name="cpu" size={48} color={theme.textTertiary} />
            <ThemedText type="body" style={{ color: theme.textSecondary, marginTop: Spacing.md, textAlign: "center" }}>
              No agents yet
            </ThemedText>
            <ThemedText type="small" style={{ color: theme.textTertiary, marginTop: Spacing.xs, textAlign: "center" }}>
              Create your first AI agent to get started
            </ThemedText>
          </GlassCard>
        ) : null}

        {filteredAgents.map((agent, index) => (
          <Animated.View key={agent.id} entering={FadeIn.delay(index * 100)}>
            <GlassCard
              onPress={() => handleAgentPress(agent)}
              style={styles.agentCard}
            >
              <View style={styles.agentHeader}>
                <View style={styles.agentInfo}>
                  <View style={[styles.agentIcon, { backgroundColor: `${theme.primary}20` }]}>
                    <Feather name={getAgentIcon(agent.type)} size={20} color={theme.primary} />
                  </View>
                  <View style={styles.agentDetails}>
                    <View style={styles.statusBadge}>
                      <View
                        style={[
                          styles.statusIndicator,
                          {
                            backgroundColor:
                              agent.isActive ? theme.success : theme.warning,
                          },
                        ]}
                      />
                      <ThemedText
                        type="label"
                        style={{
                          color:
                            agent.isActive ? theme.success : theme.warning,
                        }}
                      >
                        {agent.isActive ? "ACTIVE" : "PAUSED"}
                      </ThemedText>
                    </View>
                    <ThemedText type="h4" style={styles.agentName}>
                      {agent.name}
                    </ThemedText>
                    <ThemedText type="small" style={{ color: theme.textSecondary }}>
                      {agent.type.charAt(0).toUpperCase() + agent.type.slice(1)} Agent
                      {agent.direction ? ` - ${agent.direction}` : ""}
                    </ThemedText>
                  </View>
                </View>
                <View style={styles.agentVisual}>
                  <View style={[styles.visualPlaceholder, { backgroundColor: `${theme.primary}10` }]}>
                    <Feather name="activity" size={32} color={theme.primary} />
                  </View>
                </View>
              </View>
              <View style={styles.agentActions}>
                <Pressable
                  style={[styles.actionButton, { backgroundColor: theme.primary }]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                >
                  <ThemedText type="small" style={{ fontWeight: "600" }}>
                    {agent.isActive ? "Manage" : "Resume"}
                  </ThemedText>
                </Pressable>
                <Pressable
                  style={[styles.actionButton, styles.actionButtonSecondary]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                >
                  <Feather name="settings" size={18} color={theme.textSecondary} />
                </Pressable>
              </View>
            </GlassCard>
          </Animated.View>
        ))}

        <Pressable onPress={handleCreateAgent} style={styles.createButton}>
          <Feather name="plus" size={20} color={theme.text} />
          <ThemedText type="body" style={{ fontWeight: "600", marginLeft: Spacing.sm }}>
            Create Agent
          </ThemedText>
        </Pressable>
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
    marginBottom: Spacing.xl,
  },
  profileButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerActions: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  headerButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  titleSection: {
    marginBottom: Spacing.xl,
  },
  titleRow: {
    flexDirection: "row",
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: Spacing.sm,
  },
  statusItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  filtersContainer: {
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  filterPill: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  filterPillActive: {
    backgroundColor: Colors.dark.primary,
    borderColor: Colors.dark.primary,
  },
  filterText: {
    color: Colors.dark.textSecondary,
  },
  filterTextActive: {
    color: Colors.dark.text,
    fontWeight: "600",
  },
  agentCard: {
    marginBottom: Spacing.lg,
    padding: Spacing.lg,
  },
  agentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  agentInfo: {
    flexDirection: "row",
    flex: 1,
  },
  agentIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  agentDetails: {
    flex: 1,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  statusIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 4,
  },
  agentName: {
    marginBottom: 2,
  },
  agentVisual: {
    marginLeft: Spacing.md,
  },
  visualPlaceholder: {
    width: 80,
    height: 60,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  agentActions: {
    flexDirection: "row",
    marginTop: Spacing.lg,
    gap: Spacing.sm,
  },
  actionButton: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  actionButtonSecondary: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    paddingHorizontal: Spacing.md,
  },
  createButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.dark.primary,
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.xl,
    marginTop: Spacing.md,
  },
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing["2xl"],
  },
  emptyCard: {
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing["2xl"],
    marginBottom: Spacing.lg,
  },
});
