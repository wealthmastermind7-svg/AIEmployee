import React, { useState } from "react";
import { StyleSheet, View, ScrollView, Pressable, FlatList } from "react-native";
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
import { AnimatedBackground } from "@/components/AnimatedBackground";
import { GlassCard } from "@/components/GlassCard";
import { ThemedText } from "@/components/ThemedText";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import { RootStackParamList } from "@/navigation/RootStackNavigator";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type FilterType = "all" | "ai_pending" | "human_needed" | "resolved";

interface Conversation {
  id: string;
  name: string;
  avatar?: string;
  channel: "phone" | "sms" | "chat" | "instagram" | "email";
  lastMessage: string;
  time: string;
  status: "ai_drafting" | "escalated" | "resolved" | "ai_replied";
  isToday: boolean;
  unread?: boolean;
}

const CONVERSATIONS: Conversation[] = [
  {
    id: "1",
    name: "Sarah Jenkins",
    channel: "chat",
    lastMessage: "AI Drafting: Can I schedule a dem...",
    time: "2m",
    status: "ai_drafting",
    isToday: true,
    unread: true,
  },
  {
    id: "2",
    name: "Tech Corp Support",
    channel: "email",
    lastMessage: "Escalated: Payment gateway integr...",
    time: "15m",
    status: "escalated",
    isToday: true,
    unread: true,
  },
  {
    id: "3",
    name: "Mike Ross",
    channel: "phone",
    lastMessage: "Resolved: Thanks for the quick re...",
    time: "1h",
    status: "resolved",
    isToday: true,
  },
  {
    id: "4",
    name: "Amanda Lee",
    channel: "sms",
    lastMessage: "Re: Invoice #3302 - Confirmation of p...",
    time: "Yesterday",
    status: "ai_replied",
    isToday: false,
  },
  {
    id: "5",
    name: "David Chen",
    channel: "instagram",
    lastMessage: "AI Replied: Sure, I can help wi...",
    time: "Yesterday",
    status: "ai_replied",
    isToday: false,
  },
];

const FILTERS: { key: FilterType; label: string; color?: string }[] = [
  { key: "all", label: "All" },
  { key: "ai_pending", label: "AI Pending", color: Colors.dark.warning },
  { key: "human_needed", label: "Human Needed", color: Colors.dark.error },
  { key: "resolved", label: "Resolved", color: Colors.dark.success },
];

const getChannelIcon = (channel: Conversation["channel"]): keyof typeof Feather.glyphMap => {
  switch (channel) {
    case "phone":
      return "phone";
    case "sms":
      return "message-circle";
    case "chat":
      return "message-square";
    case "instagram":
      return "instagram";
    case "email":
      return "mail";
    default:
      return "message-square";
  }
};

const getStatusColor = (status: Conversation["status"]) => {
  switch (status) {
    case "ai_drafting":
      return Colors.dark.primary;
    case "escalated":
      return Colors.dark.error;
    case "resolved":
      return Colors.dark.success;
    case "ai_replied":
      return Colors.dark.primary;
    default:
      return Colors.dark.textSecondary;
  }
};

export default function InboxScreen() {
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const navigation = useNavigation<NavigationProp>();
  const theme = Colors.dark;
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");

  const fabScale = useSharedValue(1);
  const fabStyle = useAnimatedStyle(() => ({
    transform: [{ scale: fabScale.value }],
  }));

  const handleFabPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    fabScale.value = withSpring(0.9, {}, () => {
      fabScale.value = withSpring(1);
    });
  };

  const handleConversationPress = (conversation: Conversation) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate("ConversationDetail", { conversationId: conversation.id });
  };

  const handleFilterPress = (filter: FilterType) => {
    Haptics.selectionAsync();
    setActiveFilter(filter);
  };

  const filteredConversations = CONVERSATIONS.filter((conv) => {
    if (activeFilter === "all") return true;
    if (activeFilter === "ai_pending") return conv.status === "ai_drafting";
    if (activeFilter === "human_needed") return conv.status === "escalated";
    if (activeFilter === "resolved") return conv.status === "resolved";
    return true;
  });

  const todayConversations = filteredConversations.filter((c) => c.isToday);
  const yesterdayConversations = filteredConversations.filter((c) => !c.isToday);

  const renderConversation = ({ item, index }: { item: Conversation; index: number }) => (
    <Animated.View entering={FadeIn.delay(index * 50)}>
      <GlassCard
        onPress={() => handleConversationPress(item)}
        style={[
          styles.conversationCard,
          item.status === "escalated" && styles.escalatedCard,
        ]}
      >
        <View style={styles.conversationContent}>
          <View style={styles.avatarContainer}>
            <View style={[styles.avatar, { backgroundColor: `${theme.primary}20` }]}>
              <Feather name={getChannelIcon(item.channel)} size={18} color={theme.primary} />
            </View>
            {item.status === "ai_drafting" || item.status === "ai_replied" ? (
              <View style={[styles.statusBadge, { backgroundColor: theme.primary }]}>
                <Feather name="cpu" size={8} color={theme.text} />
              </View>
            ) : null}
          </View>
          <View style={styles.conversationDetails}>
            <View style={styles.nameRow}>
              <ThemedText type="body" style={{ fontWeight: "600" }}>
                {item.name}
              </ThemedText>
              <ThemedText type="caption" style={{ color: theme.textTertiary }}>
                {item.time}
              </ThemedText>
            </View>
            <View style={styles.messageRow}>
              {item.status === "resolved" ? (
                <Feather name="check-circle" size={12} color={theme.success} style={{ marginRight: 4 }} />
              ) : item.status === "ai_drafting" || item.status === "ai_replied" ? (
                <Feather name="zap" size={12} color={theme.primary} style={{ marginRight: 4 }} />
              ) : null}
              <ThemedText
                type="small"
                style={{ color: theme.textSecondary, flex: 1 }}
                numberOfLines={1}
              >
                {item.lastMessage}
              </ThemedText>
            </View>
          </View>
        </View>
      </GlassCard>
    </Animated.View>
  );

  return (
    <View style={styles.container}>
      <AnimatedBackground />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: insets.top + Spacing.lg,
            paddingBottom: tabBarHeight + Spacing.xl + 80,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.profileButton}>
            <Feather name="user" size={20} color={theme.text} />
          </View>
          <Pressable style={styles.searchButton}>
            <Feather name="search" size={22} color={theme.text} />
          </Pressable>
        </View>

        <View style={styles.titleSection}>
          <ThemedText type="h1">Inbox</ThemedText>
          <ThemedText type="small" style={{ color: theme.textSecondary, marginTop: 4 }}>
            3 Waiting for Review
          </ThemedText>
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
              {filter.color ? (
                <View style={[styles.filterDot, { backgroundColor: filter.color }]} />
              ) : null}
              <ThemedText
                type="small"
                style={[
                  styles.filterText,
                  activeFilter === filter.key && styles.filterTextActive,
                ]}
              >
                {filter.label}
              </ThemedText>
              {activeFilter === filter.key && filter.key !== "all" ? (
                <Feather name="check" size={14} color={theme.text} style={{ marginLeft: 4 }} />
              ) : null}
            </Pressable>
          ))}
        </ScrollView>

        {todayConversations.length > 0 ? (
          <>
            <ThemedText type="label" style={styles.sectionLabel}>
              Today
            </ThemedText>
            {todayConversations.map((item, index) => renderConversation({ item, index }))}
          </>
        ) : null}

        {yesterdayConversations.length > 0 ? (
          <>
            <ThemedText type="label" style={styles.sectionLabel}>
              Yesterday
            </ThemedText>
            {yesterdayConversations.map((item, index) => renderConversation({ item, index: index + todayConversations.length }))}
          </>
        ) : null}
      </ScrollView>

      <AnimatedPressable
        onPress={handleFabPress}
        style={[
          styles.fab,
          { bottom: tabBarHeight + Spacing.xl },
          fabStyle,
        ]}
      >
        <Feather name="edit-2" size={22} color={theme.text} />
      </AnimatedPressable>
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
  searchButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  titleSection: {
    marginBottom: Spacing.xl,
  },
  filtersContainer: {
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  filterPill: {
    flexDirection: "row",
    alignItems: "center",
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
  filterDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  filterText: {
    color: Colors.dark.textSecondary,
  },
  filterTextActive: {
    color: Colors.dark.text,
    fontWeight: "600",
  },
  sectionLabel: {
    marginBottom: Spacing.md,
    marginTop: Spacing.sm,
  },
  conversationCard: {
    marginBottom: Spacing.md,
    padding: Spacing.lg,
  },
  escalatedCard: {
    borderLeftWidth: 3,
    borderLeftColor: Colors.dark.error,
  },
  conversationContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatarContainer: {
    position: "relative",
    marginRight: Spacing.md,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  statusBadge: {
    position: "absolute",
    bottom: -2,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: Colors.dark.backgroundRoot,
  },
  conversationDetails: {
    flex: 1,
  },
  nameRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  messageRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  fab: {
    position: "absolute",
    right: Spacing["2xl"],
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.dark.primary,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: Colors.dark.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
});
