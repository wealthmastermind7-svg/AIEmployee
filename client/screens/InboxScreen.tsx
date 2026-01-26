import React, { useState } from "react";
import { StyleSheet, View, ScrollView, Pressable, FlatList, ActivityIndicator, Alert, TextInput } from "react-native";
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
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import { RootStackParamList } from "@/navigation/RootStackNavigator";
import { useBusiness } from "@/contexts/BusinessContext";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type FilterType = "all" | "active" | "transferred" | "resolved";

interface ApiConversation {
  id: string;
  businessId: string;
  agentId: string | null;
  channel: string;
  contactName: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  status: string;
  sentiment: string | null;
  summary: string | null;
  createdAt: string;
  updatedAt: string;
}

interface Conversation {
  id: string;
  name: string;
  avatar?: string;
  channel: "phone" | "sms" | "chat" | "instagram" | "email" | "webchat" | "whatsapp" | "facebook";
  lastMessage: string;
  time: string;
  status: "active" | "resolved" | "transferred";
  isToday: boolean;
  unread?: boolean;
}

const FILTERS: { key: FilterType; label: string; color?: string }[] = [
  { key: "all", label: "All" },
  { key: "active", label: "Active", color: Colors.dark.primary },
  { key: "transferred", label: "Transferred", color: Colors.dark.warning },
  { key: "resolved", label: "Resolved", color: Colors.dark.success },
];

function formatTimeAgo(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays === 1) return "Yesterday";
  return `${diffDays}d ago`;
}

function isToday(dateString: string): boolean {
  const date = new Date(dateString);
  const today = new Date();
  return date.toDateString() === today.toDateString();
}

function normalizeStatus(status: string): Conversation["status"] {
  const validStatuses: Conversation["status"][] = ["active", "resolved", "transferred"];
  if (validStatuses.includes(status as Conversation["status"])) {
    return status as Conversation["status"];
  }
  return "active";
}

function mapApiConversation(conv: ApiConversation): Conversation {
  const normalizedStatus = normalizeStatus(conv.status);
  return {
    id: conv.id,
    name: conv.contactName || conv.contactEmail || conv.contactPhone || "Unknown Contact",
    channel: (conv.channel as Conversation["channel"]) || "webchat",
    lastMessage: conv.summary || "No messages yet",
    time: formatTimeAgo(conv.updatedAt),
    status: normalizedStatus,
    isToday: isToday(conv.updatedAt),
    unread: normalizedStatus === "active",
  };
}

const getChannelIcon = (channel: Conversation["channel"]): keyof typeof Feather.glyphMap => {
  switch (channel) {
    case "phone":
      return "phone";
    case "sms":
      return "message-circle";
    case "chat":
    case "webchat":
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
    case "active":
      return Colors.dark.primary;
    case "transferred":
      return Colors.dark.warning;
    case "resolved":
      return Colors.dark.success;
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
  const { business } = useBusiness();

  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [isNewConvoModalVisible, setIsNewConvoModalVisible] = useState(false);

  const { data: apiConversations = [], isLoading } = useQuery<ApiConversation[]>({
    queryKey: ["/api/businesses", business?.id, "conversations"],
    enabled: !!business?.id,
  });

  const conversations = apiConversations.map(mapApiConversation);

  const fabScale = useSharedValue(1);
  const fabStyle = useAnimatedStyle(() => ({
    transform: [{ scale: fabScale.value }],
  }));

  const handleFabPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    fabScale.value = withSpring(0.9, {}, () => {
      fabScale.value = withSpring(1);
    });
    Alert.alert(
      "New Conversation",
      "Start a new conversation with a customer.",
      [
        { text: "SMS", onPress: () => {} },
        { text: "Email", onPress: () => {} },
        { text: "Cancel", style: "cancel" }
      ]
    );
  };

  const handleProfilePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert(
      "Profile Options",
      "Manage your personal profile and preferences.",
      [
        { text: "View Profile", onPress: () => {} },
        { text: "Settings", onPress: () => navigation.navigate("Main", { screen: "Settings" } as any) },
        { text: "Cancel", style: "cancel" }
      ]
    );
  };

  const handleSearchPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsSearchVisible(!isSearchVisible);
    if (!isSearchVisible) {
      // In a real app, we'd focus a search input here
    }
  };

  const handleConversationPress = (conversation: Conversation) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate("ConversationDetail", { conversationId: conversation.id });
  };

  const handleFilterPress = (filter: FilterType) => {
    Haptics.selectionAsync();
    setActiveFilter(filter);
  };

  const filteredConversations = conversations.filter((conv) => {
    const matchesFilter = activeFilter === "all" || conv.status === activeFilter;
    const matchesSearch = conv.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         conv.lastMessage.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const todayConversations = filteredConversations.filter((c) => c.isToday);
  const yesterdayConversations = filteredConversations.filter((c) => !c.isToday);

  const renderConversation = ({ item, index }: { item: Conversation; index: number }) => (
    <Animated.View entering={FadeIn.delay(index * 50)}>
      <GlassCard
        onPress={() => handleConversationPress(item)}
        style={[
          styles.conversationCard,
          item.status === "transferred" && styles.transferredCard,
        ].filter(Boolean) as any}
      >
        <View style={styles.conversationContent}>
          <View style={styles.avatarContainer}>
            <View style={[styles.avatar, { backgroundColor: `${theme.primary}20` }]}>
              <Feather name={getChannelIcon(item.channel)} size={18} color={theme.primary} />
            </View>
            {item.status === "active" ? (
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
              ) : item.status === "active" ? (
                <Feather name="zap" size={12} color={theme.primary} style={{ marginRight: 4 }} />
              ) : item.status === "transferred" ? (
                <Feather name="user" size={12} color={theme.warning} style={{ marginRight: 4 }} />
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
          <Pressable onPress={handleProfilePress} style={styles.profileButton}>
            <Feather name="user" size={20} color={theme.text} />
          </Pressable>
          <Pressable onPress={handleSearchPress} style={styles.searchButton}>
            <Feather name={isSearchVisible ? "x" : "search"} size={22} color={theme.text} />
          </Pressable>
        </View>

        {isSearchVisible && (
          <Animated.View entering={FadeIn} style={styles.searchContainer}>
            <View style={styles.searchInputWrapper}>
              <Feather name="search" size={16} color={theme.textTertiary} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search conversations..."
                placeholderTextColor={theme.textTertiary}
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoFocus
              />
            </View>
          </Animated.View>
        )}

        <View style={styles.titleSection}>
          <ThemedText type="h1">Inbox</ThemedText>
          <ThemedText type="small" style={{ color: theme.textSecondary, marginTop: 4 }}>
            {conversations.filter(c => c.status !== "resolved").length} Open Conversations
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

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.primary} />
            <ThemedText type="small" style={{ color: theme.textSecondary, marginTop: Spacing.md }}>
              Loading conversations...
            </ThemedText>
          </View>
        ) : filteredConversations.length === 0 ? (
          <GlassCard style={styles.emptyCard}>
            <Feather name="inbox" size={48} color={theme.textTertiary} />
            <ThemedText type="body" style={{ color: theme.textSecondary, marginTop: Spacing.md, textAlign: "center" }}>
              No conversations yet
            </ThemedText>
            <ThemedText type="small" style={{ color: theme.textTertiary, marginTop: Spacing.xs, textAlign: "center" }}>
              Messages from your customers will appear here
            </ThemedText>
          </GlassCard>
        ) : (
          <>
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
                  Earlier
                </ThemedText>
                {yesterdayConversations.map((item, index) => renderConversation({ item, index: index + todayConversations.length }))}
              </>
            ) : null}
          </>
        )}
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
  searchContainer: {
    marginBottom: Spacing.lg,
  },
  searchInputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    height: 44,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  searchInput: {
    flex: 1,
    color: Colors.dark.text,
    marginLeft: Spacing.sm,
    fontSize: 16,
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
  transferredCard: {
    borderLeftWidth: 3,
    borderLeftColor: Colors.dark.warning,
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
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing["2xl"],
  },
  emptyCard: {
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing["2xl"],
  },
});
