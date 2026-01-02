import React, { useState, useRef } from "react";
import {
  StyleSheet,
  View,
  ScrollView,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRoute, RouteProp } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { AnimatedBackground } from "@/components/AnimatedBackground";
import { GlassCard } from "@/components/GlassCard";
import { ThemedText } from "@/components/ThemedText";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import { RootStackParamList } from "@/navigation/RootStackNavigator";

type RouteProps = RouteProp<RootStackParamList, "ConversationDetail">;

interface Message {
  id: string;
  role: "user" | "agent" | "system";
  content: string;
  time: string;
  isAI?: boolean;
  isPending?: boolean;
}

const MOCK_MESSAGES: Message[] = [
  {
    id: "1",
    role: "user",
    content: "Hi, I'm interested in scheduling a demo of your AI employee platform.",
    time: "2:30 PM",
  },
  {
    id: "2",
    role: "agent",
    content: "Hello! Thank you for reaching out. I'd be happy to help you schedule a demo. What time works best for you?",
    time: "2:31 PM",
    isAI: true,
  },
  {
    id: "3",
    role: "user",
    content: "I'm free tomorrow afternoon, around 3 PM EST.",
    time: "2:32 PM",
  },
  {
    id: "4",
    role: "agent",
    content: "Perfect! I've found an available slot for tomorrow at 3:00 PM EST. Would you like me to send you a calendar invite?",
    time: "2:32 PM",
    isAI: true,
  },
  {
    id: "5",
    role: "user",
    content: "Yes please, that would be great!",
    time: "2:33 PM",
  },
  {
    id: "6",
    role: "agent",
    content: "I'm preparing a calendar invite for you. Could you please confirm your email address?",
    time: "2:33 PM",
    isAI: true,
    isPending: true,
  },
];

export default function ConversationDetailScreen() {
  const insets = useSafeAreaInsets();
  const route = useRoute<RouteProps>();
  const theme = Colors.dark;
  const scrollViewRef = useRef<ScrollView>(null);
  const [message, setMessage] = useState("");

  const handleSend = () => {
    if (message.trim()) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setMessage("");
    }
  };

  const handleApprove = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleReject = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  return (
    <View style={styles.container}>
      <AnimatedBackground />
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={100}
      >
        <ScrollView
          ref={scrollViewRef}
          style={styles.scrollView}
          contentContainerStyle={[
            styles.messagesContainer,
            { paddingBottom: Spacing.xl },
          ]}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
        >
          <View style={styles.conversationHeader}>
            <View style={styles.contactInfo}>
              <View style={[styles.avatar, { backgroundColor: `${theme.primary}20` }]}>
                <Feather name="user" size={24} color={theme.primary} />
              </View>
              <View style={styles.contactDetails}>
                <ThemedText type="h4">Sarah Jenkins</ThemedText>
                <View style={styles.channelBadge}>
                  <Feather name="message-square" size={12} color={theme.textSecondary} />
                  <ThemedText type="caption" style={{ color: theme.textSecondary, marginLeft: 4 }}>
                    Live Chat
                  </ThemedText>
                </View>
              </View>
            </View>
          </View>

          {MOCK_MESSAGES.map((msg, index) => (
            <Animated.View
              key={msg.id}
              entering={FadeInDown.delay(index * 50)}
              style={[
                styles.messageRow,
                msg.role === "agent" ? styles.messageRowAgent : styles.messageRowUser,
              ]}
            >
              {msg.role === "agent" ? (
                <View style={styles.agentMessage}>
                  <View style={styles.messageHeader}>
                    {msg.isAI ? (
                      <View style={styles.aiBadge}>
                        <Feather name="cpu" size={10} color={theme.primary} />
                        <ThemedText type="label" style={{ color: theme.primary, marginLeft: 4 }}>
                          AI {msg.isPending ? "DRAFTING" : "SENT"}
                        </ThemedText>
                      </View>
                    ) : null}
                    <ThemedText type="caption" style={{ color: theme.textTertiary }}>
                      {msg.time}
                    </ThemedText>
                  </View>
                  <GlassCard style={[styles.messageBubble, msg.isPending && styles.pendingBubble]}>
                    <ThemedText type="body">{msg.content}</ThemedText>
                  </GlassCard>
                  {msg.isPending ? (
                    <View style={styles.pendingActions}>
                      <Pressable onPress={handleApprove} style={styles.approveButton}>
                        <Feather name="check" size={18} color={theme.success} />
                        <ThemedText type="small" style={{ color: theme.success, marginLeft: 4 }}>
                          Approve
                        </ThemedText>
                      </Pressable>
                      <Pressable onPress={handleReject} style={styles.rejectButton}>
                        <Feather name="edit-2" size={16} color={theme.textSecondary} />
                        <ThemedText type="small" style={{ color: theme.textSecondary, marginLeft: 4 }}>
                          Edit
                        </ThemedText>
                      </Pressable>
                    </View>
                  ) : null}
                </View>
              ) : (
                <View style={styles.userMessage}>
                  <View style={styles.messageHeader}>
                    <ThemedText type="caption" style={{ color: theme.textTertiary }}>
                      {msg.time}
                    </ThemedText>
                  </View>
                  <View style={[styles.messageBubble, styles.userBubble]}>
                    <ThemedText type="body">{msg.content}</ThemedText>
                  </View>
                </View>
              )}
            </Animated.View>
          ))}
        </ScrollView>

        <View style={[styles.inputContainer, { paddingBottom: insets.bottom + Spacing.sm }]}>
          <GlassCard noPadding style={styles.inputWrapper}>
            <View style={styles.inputRow}>
              <TextInput
                style={styles.input}
                placeholder="Type a message..."
                placeholderTextColor={theme.textTertiary}
                value={message}
                onChangeText={setMessage}
                multiline
              />
              <Pressable
                onPress={handleSend}
                style={[styles.sendButton, { backgroundColor: message.trim() ? theme.primary : "rgba(255, 255, 255, 0.1)" }]}
              >
                <Feather name="send" size={18} color={message.trim() ? theme.text : theme.textTertiary} />
              </Pressable>
            </View>
          </GlassCard>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  messagesContainer: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
  },
  conversationHeader: {
    marginBottom: Spacing.xl,
    alignItems: "center",
  },
  contactInfo: {
    alignItems: "center",
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.sm,
  },
  contactDetails: {
    alignItems: "center",
  },
  channelBadge: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  messageRow: {
    marginBottom: Spacing.lg,
  },
  messageRowAgent: {
    alignItems: "flex-start",
  },
  messageRowUser: {
    alignItems: "flex-end",
  },
  agentMessage: {
    maxWidth: "85%",
  },
  userMessage: {
    maxWidth: "85%",
    alignItems: "flex-end",
  },
  messageHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
    gap: Spacing.sm,
  },
  aiBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: `${Colors.dark.primary}20`,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.xs,
  },
  messageBubble: {
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  userBubble: {
    backgroundColor: Colors.dark.primary,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
  },
  pendingBubble: {
    borderWidth: 1,
    borderColor: Colors.dark.primary,
    borderStyle: "dashed",
  },
  pendingActions: {
    flexDirection: "row",
    marginTop: Spacing.sm,
    gap: Spacing.sm,
  },
  approveButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: `${Colors.dark.success}15`,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: `${Colors.dark.success}30`,
  },
  rejectButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  inputContainer: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    backgroundColor: "rgba(16, 22, 34, 0.9)",
    borderTopWidth: 1,
    borderTopColor: Colors.dark.glassBorder,
  },
  inputWrapper: {
    borderRadius: BorderRadius.xl,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    padding: Spacing.sm,
  },
  input: {
    flex: 1,
    color: Colors.dark.text,
    fontSize: 16,
    maxHeight: 100,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
});
