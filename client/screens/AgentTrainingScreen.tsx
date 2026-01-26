import React, { useState } from "react";
import { StyleSheet, View, ScrollView, Pressable, TextInput, Alert, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRoute, RouteProp } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AnimatedBackground } from "@/components/AnimatedBackground";
import { GlassCard } from "@/components/GlassCard";
import { ThemedText } from "@/components/ThemedText";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import { RootStackParamList } from "@/navigation/RootStackNavigator";
import { apiRequest } from "@/lib/query-client";
import type { TrainingData } from "@shared/schema";

type RouteProps = RouteProp<RootStackParamList, "AgentTraining">;

export default function AgentTrainingScreen() {
  const insets = useSafeAreaInsets();
  const route = useRoute<RouteProps>();
  const { agentId, agentName } = route.params;
  const theme = Colors.dark;
  const queryClient = useQueryClient();

  const [websiteUrl, setWebsiteUrl] = useState("");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [showQAForm, setShowQAForm] = useState(false);

  const { data: trainingData = [], isLoading } = useQuery<TrainingData[]>({
    queryKey: [`/api/agents/${agentId}/training`],
  });

  const crawlMutation = useMutation({
    mutationFn: async (url: string) => {
      return apiRequest("POST", `/api/agents/${agentId}/training/crawl`, { url });
    },
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      queryClient.invalidateQueries({ queryKey: [`/api/agents/${agentId}/training`] });
      setWebsiteUrl("");
      Alert.alert("Success", "Website content has been crawled and added to training data.");
    },
    onError: (error: Error) => {
      Alert.alert("Error", error.message || "Failed to crawl website");
    },
  });

  const addQAMutation = useMutation({
    mutationFn: async (data: { question: string; answer: string }) => {
      return apiRequest("POST", `/api/agents/${agentId}/training/qa`, data);
    },
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      queryClient.invalidateQueries({ queryKey: [`/api/agents/${agentId}/training`] });
      setQuestion("");
      setAnswer("");
      setShowQAForm(false);
    },
    onError: (error: Error) => {
      Alert.alert("Error", error.message || "Failed to add Q&A pair");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/training/${id}`);
    },
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      queryClient.invalidateQueries({ queryKey: [`/api/agents/${agentId}/training`] });
    },
  });

  const handleCrawlWebsite = () => {
    if (!websiteUrl.trim()) {
      Alert.alert("Error", "Please enter a website URL");
      return;
    }
    let url = websiteUrl.trim();
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      url = "https://" + url;
    }
    crawlMutation.mutate(url);
  };

  const handleAddQA = () => {
    if (!question.trim() || !answer.trim()) {
      Alert.alert("Error", "Please fill in both question and answer");
      return;
    }
    addQAMutation.mutate({ question: question.trim(), answer: answer.trim() });
  };

  const handleDelete = (id: string, title: string) => {
    Alert.alert(
      "Delete Training Data",
      `Are you sure you want to delete "${title}"?`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: () => deleteMutation.mutate(id) },
      ]
    );
  };

  const websiteCrawls = trainingData.filter((d) => d.type === "website_crawl");
  const qaPairs = trainingData.filter((d) => d.type === "qa_pair");

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
            <View style={styles.headerIcon}>
              <Feather name="book-open" size={24} color={theme.primary} />
            </View>
            <ThemedText type="h3">Train {agentName}</ThemedText>
            <ThemedText type="small" style={{ color: theme.textSecondary, marginTop: Spacing.xs }}>
              Add knowledge to help your AI agent respond better
            </ThemedText>
          </GlassCard>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(100)}>
          <ThemedText type="h4" style={styles.sectionTitle}>
            Web Crawler
          </ThemedText>
          <GlassCard style={styles.crawlerCard}>
            <ThemedText type="small" style={{ color: theme.textSecondary, marginBottom: Spacing.md }}>
              Enter a website URL to automatically extract content for training. For large sites like Cerolauto, we'll start with the most relevant pages.
            </ThemedText>
            <View style={styles.inputRow}>
              <TextInput
                style={styles.urlInput}
                placeholder="https://example.com"
                placeholderTextColor={theme.textTertiary}
                value={websiteUrl}
                onChangeText={setWebsiteUrl}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="url"
              />
              <Pressable
                onPress={handleCrawlWebsite}
                disabled={crawlMutation.isPending}
                style={[styles.crawlButton, crawlMutation.isPending && styles.buttonDisabled]}
              >
                {crawlMutation.isPending ? (
                  <ActivityIndicator size="small" color={theme.text} />
                ) : (
                  <ThemedText type="body" style={{ fontWeight: "600" }}>Get Data</ThemedText>
                )}
              </Pressable>
            </View>
          </GlassCard>
        </Animated.View>

        {websiteCrawls.length > 0 ? (
          <Animated.View entering={FadeInDown.delay(150)}>
            <View style={styles.sectionHeader}>
              <ThemedText type="h4">Uploaded Links</ThemedText>
              <View style={styles.countBadge}>
                <ThemedText type="label">{websiteCrawls.length}</ThemedText>
              </View>
            </View>
            <GlassCard noPadding style={styles.listCard}>
              {websiteCrawls.map((item, index) => (
                <View key={item.id}>
                  <Pressable
                    onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
                    style={styles.listItem}
                  >
                    <View style={styles.listIcon}>
                      <Feather name="globe" size={16} color={theme.primary} />
                    </View>
                    <View style={styles.listContent}>
                      <ThemedText type="body" numberOfLines={1}>{item.title || "Website"}</ThemedText>
                      <ThemedText type="caption" style={{ color: theme.textSecondary }} numberOfLines={1}>
                        {item.sourceUrl}
                      </ThemedText>
                    </View>
                    <Pressable
                      onPress={() => handleDelete(item.id, item.title || "Website")}
                      hitSlop={8}
                    >
                      <Feather name="trash-2" size={16} color={theme.error} />
                    </Pressable>
                  </Pressable>
                  {index < websiteCrawls.length - 1 ? <View style={styles.divider} /> : null}
                </View>
              ))}
            </GlassCard>
          </Animated.View>
        ) : null}

        <Animated.View entering={FadeInDown.delay(200)}>
          <View style={styles.sectionHeader}>
            <ThemedText type="h4">Custom Q&A</ThemedText>
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setShowQAForm(!showQAForm);
              }}
              style={styles.addButton}
            >
              <Feather name={showQAForm ? "x" : "plus"} size={16} color={theme.primary} />
              <ThemedText type="small" style={{ color: theme.primary, marginLeft: 4 }}>
                {showQAForm ? "Cancel" : "Add Q&A"}
              </ThemedText>
            </Pressable>
          </View>

          {showQAForm ? (
            <Animated.View entering={FadeInDown}>
              <GlassCard style={styles.qaFormCard}>
                <ThemedText type="small" style={{ color: theme.textSecondary, marginBottom: Spacing.md }}>
                  Add questions and answers to train the bot
                </ThemedText>
                <TextInput
                  style={styles.textInput}
                  placeholder="Question (e.g., What are your hours?)"
                  placeholderTextColor={theme.textTertiary}
                  value={question}
                  onChangeText={setQuestion}
                  multiline
                />
                <TextInput
                  style={[styles.textInput, styles.answerInput]}
                  placeholder="Answer (e.g., We're open Mon-Fri 9am-5pm)"
                  placeholderTextColor={theme.textTertiary}
                  value={answer}
                  onChangeText={setAnswer}
                  multiline
                />
                <Pressable
                  onPress={handleAddQA}
                  disabled={addQAMutation.isPending}
                  style={[styles.saveButton, addQAMutation.isPending && styles.buttonDisabled]}
                >
                  {addQAMutation.isPending ? (
                    <ActivityIndicator size="small" color={theme.text} />
                  ) : (
                    <>
                      <Feather name="check" size={18} color={theme.text} />
                      <ThemedText type="body" style={{ fontWeight: "600", marginLeft: Spacing.sm }}>
                        Save Q&A
                      </ThemedText>
                    </>
                  )}
                </Pressable>
              </GlassCard>
            </Animated.View>
          ) : null}

          {qaPairs.length > 0 ? (
            <GlassCard noPadding style={styles.listCard}>
              {qaPairs.map((item, index) => (
                <View key={item.id}>
                  <Pressable
                    onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
                    style={styles.listItem}
                  >
                    <View style={[styles.listIcon, { backgroundColor: `${theme.success}20` }]}>
                      <Feather name="help-circle" size={16} color={theme.success} />
                    </View>
                    <View style={styles.listContent}>
                      <ThemedText type="body" numberOfLines={1}>{item.question}</ThemedText>
                      <ThemedText type="caption" style={{ color: theme.textSecondary }} numberOfLines={2}>
                        {item.answer}
                      </ThemedText>
                    </View>
                    <Pressable
                      onPress={() => handleDelete(item.id, item.question || "Q&A")}
                      hitSlop={8}
                    >
                      <Feather name="trash-2" size={16} color={theme.error} />
                    </Pressable>
                  </Pressable>
                  {index < qaPairs.length - 1 ? <View style={styles.divider} /> : null}
                </View>
              ))}
            </GlassCard>
          ) : !showQAForm ? (
            <GlassCard style={styles.emptyCard}>
              <Feather name="inbox" size={32} color={theme.textTertiary} />
              <ThemedText type="small" style={{ color: theme.textSecondary, marginTop: Spacing.md, textAlign: "center" }}>
                No Q&A pairs yet. Add custom questions and answers to improve your agent's responses.
              </ThemedText>
            </GlassCard>
          ) : null}
        </Animated.View>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.primary} />
          </View>
        ) : null}
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
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  headerIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: `${Colors.dark.primary}20`,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    marginBottom: Spacing.md,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
    marginTop: Spacing.lg,
  },
  countBadge: {
    backgroundColor: `${Colors.dark.primary}30`,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  crawlerCard: {
    marginBottom: Spacing.md,
  },
  inputRow: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  urlInput: {
    flex: 1,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    color: Colors.dark.text,
    fontSize: 14,
  },
  crawlButton: {
    backgroundColor: Colors.dark.primary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    justifyContent: "center",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  qaFormCard: {
    marginBottom: Spacing.md,
  },
  textInput: {
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    color: Colors.dark.text,
    fontSize: 14,
    marginBottom: Spacing.md,
    minHeight: 48,
  },
  answerInput: {
    minHeight: 80,
    textAlignVertical: "top",
  },
  saveButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.dark.success,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  listCard: {
    overflow: "hidden",
    marginBottom: Spacing.md,
  },
  listItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
  },
  listIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: `${Colors.dark.primary}20`,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  listContent: {
    flex: 1,
    marginRight: Spacing.md,
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    marginLeft: Spacing.lg + 36 + Spacing.md,
  },
  emptyCard: {
    alignItems: "center",
    paddingVertical: Spacing.xl,
  },
  loadingContainer: {
    paddingVertical: Spacing.xl,
    alignItems: "center",
  },
});
