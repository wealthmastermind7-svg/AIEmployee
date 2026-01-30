import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Platform,
} from "react-native";
import { Audio } from "expo-av";
import { Feather } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withSequence,
  withTiming,
  interpolate,
  Easing,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Colors, Spacing, BorderRadius, Typography } from "@/constants/theme";
import { useBusiness } from "@/contexts/BusinessContext";
import { getApiUrl } from "@/lib/query-client";

type RootStackParamList = {
  VoiceChat: { agentId: string; agentName: string };
};

type Props = NativeStackScreenProps<RootStackParamList, "VoiceChat">;

interface Message {
  id: string;
  role: "user" | "agent";
  content: string;
  timestamp: Date;
}

export default function VoiceChatScreen({ route, navigation }: Props) {
  const { agentId, agentName } = route.params;
  const { business } = useBusiness();
  const insets = useSafeAreaInsets();
  const theme = Colors.dark;

  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const recordingRef = useRef<Audio.Recording | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);

  const pulseScale = useSharedValue(1);
  const waveOpacity = useSharedValue(0);

  useEffect(() => {
    return () => {
      if (recordingRef.current) {
        recordingRef.current.stopAndUnloadAsync();
      }
      if (soundRef.current) {
        soundRef.current.unloadAsync();
      }
    };
  }, []);

  const animatedPulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  const animatedWaveStyle = useAnimatedStyle(() => ({
    opacity: waveOpacity.value,
    transform: [{ scale: interpolate(waveOpacity.value, [0, 1], [0.8, 1.5]) }],
  }));

  const startRecording = useCallback(async () => {
    try {
      setError(null);
      
      const permission = await Audio.requestPermissionsAsync();
      if (!permission.granted) {
        setError("Microphone permission is required");
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync({
        isMeteringEnabled: true,
        android: {
          extension: ".wav",
          outputFormat: Audio.AndroidOutputFormat.DEFAULT,
          audioEncoder: Audio.AndroidAudioEncoder.DEFAULT,
          sampleRate: 16000,
          numberOfChannels: 1,
          bitRate: 256000,
        },
        ios: {
          extension: ".wav",
          audioQuality: Audio.IOSAudioQuality.HIGH,
          sampleRate: 16000,
          numberOfChannels: 1,
          bitRate: 256000,
          linearPCMBitDepth: 16,
          linearPCMIsBigEndian: false,
          linearPCMIsFloat: false,
        },
        web: {
          mimeType: "audio/webm",
          bitsPerSecond: 256000,
        },
      });

      recordingRef.current = recording;
      setIsRecording(true);

      pulseScale.value = withRepeat(
        withSequence(
          withTiming(1.2, { duration: 500, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 500, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );
      waveOpacity.value = withRepeat(
        withSequence(
          withTiming(0.6, { duration: 800 }),
          withTiming(0, { duration: 800 })
        ),
        -1,
        false
      );
    } catch (err: any) {
      console.error("Failed to start recording:", err);
      setError("Failed to start recording");
    }
  }, [pulseScale, waveOpacity]);

  const stopRecording = useCallback(async () => {
    if (!recordingRef.current) return;

    setIsRecording(false);
    setIsProcessing(true);
    pulseScale.value = withSpring(1);
    waveOpacity.value = withTiming(0);

    try {
      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();
      recordingRef.current = null;

      if (!uri) {
        throw new Error("No recording URI");
      }

      const response = await fetch(uri);
      const blob = await response.blob();
      
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onloadend = () => {
          const result = reader.result as string;
          const base64 = result.substring(result.indexOf(",") + 1);
          resolve(base64);
        };
        reader.onerror = reject;
      });
      reader.readAsDataURL(blob);
      const audioBase64 = await base64Promise;

      const apiUrl = getApiUrl();
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

      const voiceResponse = await fetch(`${apiUrl}/api/voice/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          audioBase64,
          agentId,
          businessId: business?.id,
          conversationId,
        }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!voiceResponse.ok) {
        const errorData = await voiceResponse.json();
        throw new Error(errorData.error || "Voice chat failed");
      }

      const result = await voiceResponse.json();

      if (result.conversationId && !conversationId) {
        setConversationId(result.conversationId);
      }

      const userMessage: Message = {
        id: Date.now().toString(),
        role: "user",
        content: result.userTranscript || "[Voice message]",
        timestamp: new Date(),
      };

      const agentMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "agent",
        content: result.transcript,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMessage, agentMessage]);

      if (result.audioBase64) {
        await playAudio(result.audioBase64);
      }

      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (err: any) {
      console.error("Voice chat error:", err);
      setError(err.message || "Failed to process voice");
    } finally {
      setIsProcessing(false);
    }
  }, [agentId, business?.id, conversationId, pulseScale, waveOpacity]);

  const playAudio = async (base64Audio: string) => {
    try {
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
      });

      const uri = `data:audio/wav;base64,${base64Audio}`;
      const { sound } = await Audio.Sound.createAsync({ uri });
      soundRef.current = sound;
      await sound.playAsync();
    } catch (err) {
      console.error("Playback error:", err);
    }
  };

  const handleMicPress = () => {
    if (isRecording) {
      stopRecording();
    } else if (!isProcessing) {
      startRecording();
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <LinearGradient
        colors={[theme.orb1, theme.orb2, theme.backgroundRoot]}
        style={styles.backgroundGradient}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 0.6 }}
      />

      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesContainer}
        contentContainerStyle={[
          styles.messagesContent,
          { paddingBottom: 200 + insets.bottom },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {messages.length === 0 ? (
          <View style={styles.emptyState}>
            <Feather name="mic" size={48} color={theme.textSecondary} />
            <Text style={[styles.emptyTitle, { color: theme.text }]}>
              Voice Chat with {agentName}
            </Text>
            <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
              Hold the microphone button to speak
            </Text>
          </View>
        ) : (
          messages.map((message) => (
            <View
              key={message.id}
              style={[
                styles.messageBubble,
                message.role === "user"
                  ? styles.userBubble
                  : styles.agentBubble,
                {
                  backgroundColor:
                    message.role === "user"
                      ? theme.primary
                      : theme.backgroundSecondary,
                },
              ]}
            >
              <Text
                style={[
                  styles.messageText,
                  {
                    color:
                      message.role === "user" ? "#FFFFFF" : theme.text,
                  },
                ]}
              >
                {message.content}
              </Text>
              <Text
                style={[
                  styles.messageTime,
                  {
                    color:
                      message.role === "user"
                        ? "rgba(255,255,255,0.7)"
                        : theme.textTertiary,
                  },
                ]}
              >
                {message.timestamp.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </Text>
            </View>
          ))
        )}
      </ScrollView>

      {error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <Pressable onPress={() => setError(null)}>
            <Text style={styles.errorDismiss}>Dismiss</Text>
          </Pressable>
        </View>
      ) : null}

      <View
        style={[
          styles.controlsContainer,
          { paddingBottom: insets.bottom + Spacing.xl },
        ]}
      >
        {Platform.OS === "ios" ? (
          <BlurView intensity={80} tint="dark" style={styles.controlsBlur}>
            <MicButton
              isRecording={isRecording}
              isProcessing={isProcessing}
              onPress={handleMicPress}
              animatedPulseStyle={animatedPulseStyle}
              animatedWaveStyle={animatedWaveStyle}
              theme={theme}
            />
          </BlurView>
        ) : (
          <View
            style={[
              styles.controlsBlur,
              { backgroundColor: "rgba(16, 22, 34, 0.95)" },
            ]}
          >
            <MicButton
              isRecording={isRecording}
              isProcessing={isProcessing}
              onPress={handleMicPress}
              animatedPulseStyle={animatedPulseStyle}
              animatedWaveStyle={animatedWaveStyle}
              theme={theme}
            />
          </View>
        )}
      </View>
    </View>
  );
}

function MicButton({
  isRecording,
  isProcessing,
  onPress,
  animatedPulseStyle,
  animatedWaveStyle,
  theme,
}: {
  isRecording: boolean;
  isProcessing: boolean;
  onPress: () => void;
  animatedPulseStyle: any;
  animatedWaveStyle: any;
  theme: typeof Colors.dark;
}) {
  return (
    <View style={styles.micContainer}>
      <Animated.View style={[styles.waveRing, animatedWaveStyle]}>
        <View
          style={[
            styles.waveRingInner,
            { borderColor: isRecording ? theme.error : theme.primary },
          ]}
        />
      </Animated.View>

      <Animated.View style={animatedPulseStyle}>
        <Pressable
          onPress={onPress}
          disabled={isProcessing}
          style={({ pressed }) => [
            styles.micButton,
            {
              backgroundColor: isRecording ? theme.error : theme.primary,
              opacity: pressed ? 0.8 : 1,
            },
          ]}
        >
          {isProcessing ? (
            <ActivityIndicator size="large" color="#FFFFFF" />
          ) : (
            <Feather
              name={isRecording ? "mic-off" : "mic"}
              size={32}
              color="#FFFFFF"
            />
          )}
        </Pressable>
      </Animated.View>

      <Text style={[styles.micLabel, { color: theme.textSecondary }]}>
        {isProcessing
          ? "Processing..."
          : isRecording
          ? "Release to send"
          : "Tap to speak"}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundGradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 300,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: Spacing.lg,
    paddingTop: Spacing.xl,
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 100,
  },
  emptyTitle: {
    ...Typography.h3,
    marginTop: Spacing.lg,
    textAlign: "center",
  },
  emptySubtitle: {
    ...Typography.body,
    marginTop: Spacing.sm,
    textAlign: "center",
  },
  messageBubble: {
    maxWidth: "80%",
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.sm,
  },
  userBubble: {
    alignSelf: "flex-end",
    borderBottomRightRadius: BorderRadius.xs,
  },
  agentBubble: {
    alignSelf: "flex-start",
    borderBottomLeftRadius: BorderRadius.xs,
  },
  messageText: {
    ...Typography.body,
  },
  messageTime: {
    ...Typography.caption,
    marginTop: Spacing.xs,
    alignSelf: "flex-end",
  },
  errorContainer: {
    position: "absolute",
    top: 100,
    left: Spacing.lg,
    right: Spacing.lg,
    backgroundColor: "rgba(239, 68, 68, 0.9)",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  errorText: {
    color: "#FFFFFF",
    flex: 1,
  },
  errorDismiss: {
    color: "#FFFFFF",
    fontWeight: "600",
    marginLeft: Spacing.md,
  },
  controlsContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
  },
  controlsBlur: {
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.lg,
    alignItems: "center",
    overflow: "hidden",
  },
  micContainer: {
    alignItems: "center",
  },
  waveRing: {
    position: "absolute",
    width: 100,
    height: 100,
    alignItems: "center",
    justifyContent: "center",
  },
  waveRingInner: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
  },
  micButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  micLabel: {
    ...Typography.small,
    marginTop: Spacing.md,
  },
});
