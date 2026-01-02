import React, { useRef, useState } from "react";
import {
  StyleSheet,
  View,
  Pressable,
  Dimensions,
  Platform,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import Animated, {
  FadeInUp,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
  Extrapolation,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { AnimatedBackground } from "@/components/AnimatedBackground";
import { GlassCard } from "@/components/GlassCard";
import { ThemedText } from "@/components/ThemedText";
import { Colors, Spacing, BorderRadius, Shadows } from "@/constants/theme";
import { useBusiness } from "@/contexts/BusinessContext";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const theme = Colors.dark;
  const scrollRef = useRef<ScrollView>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const pageOffset = useSharedValue(0);
  const [businessName, setBusinessName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const { createBusiness } = useBusiness();

  const handlePageChange = (position: number) => {
    setCurrentPage(position);
    pageOffset.value = withTiming(position, { duration: 300 });
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleScroll = (event: any) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const page = Math.round(offsetX / SCREEN_WIDTH);
    if (page !== currentPage && page >= 0 && page <= 2) {
      setCurrentPage(page);
      pageOffset.value = withTiming(page, { duration: 300 });
    }
  };

  const handleNext = () => {
    if (currentPage < 2) {
      const nextPage = currentPage + 1;
      scrollRef.current?.scrollTo({ x: nextPage * SCREEN_WIDTH, animated: true });
      setCurrentPage(nextPage);
      pageOffset.value = withTiming(nextPage, { duration: 300 });
    } else {
      handleComplete();
    }
  };

  const handleSkip = () => {
    handleComplete();
  };

  const handleComplete = async () => {
    if (isCreating) return;
    setIsCreating(true);
    try {
      console.log("Starting business creation...");
      const name = businessName.trim() || "My Business";
      await createBusiness(name);
      console.log("Business created successfully");
      
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (error) {
      console.error("Failed to create business:", error);
      Alert.alert("Error", "Failed to create your workspace. Please try again.");
    } finally {
      setIsCreating(false);
    }
  };

  const PaginationDots = () => (
    <View style={styles.paginationContainer}>
      {[0, 1, 2].map((index) => {
        const dotStyle = useAnimatedStyle(() => ({
          width: interpolate(
            pageOffset.value,
            [index - 1, index, index + 1],
            [6, 24, 6],
            Extrapolation.CLAMP
          ),
          opacity: interpolate(
            pageOffset.value,
            [index - 1, index, index + 1],
            [0.3, 1, 0.3],
            Extrapolation.CLAMP
          ),
        }));

        return (
          <Animated.View
            key={index}
            style={[
              styles.paginationDot,
              { backgroundColor: currentPage === index ? theme.primary : "rgba(255, 255, 255, 0.2)" },
              dotStyle,
            ]}
          />
        );
      })}
    </View>
  );

  const Page1 = () => (
    <View style={[styles.page, { width: SCREEN_WIDTH, paddingTop: insets.top + Spacing.lg, paddingBottom: insets.bottom + Spacing.lg }]}>
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <View style={styles.logoIcon}>
            <Feather name="cpu" size={16} color={theme.primary} />
          </View>
          <ThemedText type="label" style={styles.logoText}>AI EMPLOYEE</ThemedText>
        </View>
        <Pressable onPress={handleSkip}>
          <ThemedText type="small" style={styles.skipText}>SKIP</ThemedText>
        </Pressable>
      </View>

      <View style={styles.heroContent}>
        <Animated.View entering={FadeInUp.delay(200)} style={styles.heroIconContainer}>
          <View style={styles.heroIconGlow} />
          <View style={styles.heroIcon}>
            <Feather name="settings" size={32} color={theme.text} />
          </View>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(400)}>
          <ThemedText type="display" style={styles.heroTitle}>
            Your
          </ThemedText>
          <ThemedText type="display" style={styles.heroTitle}>
            Workforce,
          </ThemedText>
          <ThemedText type="display" style={[styles.heroTitle, styles.heroTitleHighlight]}>
            Evolved.
          </ThemedText>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(600)}>
          <ThemedText type="body" style={styles.heroSubtitle}>
            Automate customer interactions across every channel instantly.
          </ThemedText>
        </Animated.View>
      </View>

      <View style={styles.bottomActions}>
        <PaginationDots />
        <Pressable
          onPress={handleNext}
          style={({ pressed }) => [styles.primaryButton, pressed && styles.buttonPressed]}
        >
          <ThemedText type="body" style={styles.buttonText}>Deploy AI Agent</ThemedText>
          <Feather name="arrow-right" size={18} color={theme.text} style={styles.buttonIcon} />
        </Pressable>
        <Pressable onPress={handleSkip}>
          <ThemedText type="body" style={styles.secondaryLink}>Log In</ThemedText>
        </Pressable>
      </View>
    </View>
  );

  const Page2 = () => (
    <View style={[styles.page, { width: SCREEN_WIDTH, paddingTop: insets.top + Spacing.lg, paddingBottom: insets.bottom + Spacing.lg }]}>
      <View style={styles.header}>
        <PaginationDots />
        <Pressable onPress={handleSkip}>
          <ThemedText type="small" style={styles.skipText}>Skip</ThemedText>
        </Pressable>
      </View>

      <View style={styles.contentArea}>
        <Animated.View entering={FadeInUp.delay(200)} style={styles.page2Title}>
          <ThemedText type="display" style={styles.boldTitle}>UNIFIED</ThemedText>
          <ThemedText type="display" style={[styles.boldTitle, styles.gradientTitle]}>DASHBOARD</ThemedText>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(400)} style={styles.previewContainer}>
          <GlassCard style={styles.previewCard}>
            <View style={styles.previewContent}>
              <View style={styles.previewHeader}>
                <View style={styles.previewDots}>
                  <View style={[styles.previewDot, { backgroundColor: "#ef4444" }]} />
                  <View style={[styles.previewDot, { backgroundColor: "#f59e0b" }]} />
                  <View style={[styles.previewDot, { backgroundColor: "#22c55e" }]} />
                </View>
                <View style={styles.liveFeedBadge}>
                  <View style={styles.liveDot} />
                  <ThemedText type="label" style={styles.liveFeedText}>LIVE FEED</ThemedText>
                </View>
              </View>
              <View style={styles.previewChart}>
                <View style={styles.chartBar1} />
                <View style={styles.chartBar2} />
                <View style={styles.chartBar3} />
                <View style={styles.chartBar4} />
                <View style={styles.chartBar5} />
              </View>
              <View style={styles.playButton}>
                <Feather name="play" size={24} color={theme.text} />
              </View>
            </View>
          </GlassCard>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(600)}>
          <ThemedText type="body" style={styles.descriptionText}>
            Control every channel from one command center. AI filters the noise, you focus on the signal.
          </ThemedText>
        </Animated.View>
      </View>

      <View style={styles.bottomActions}>
        <Pressable
          onPress={handleNext}
          style={({ pressed }) => [styles.primaryButton, pressed && styles.buttonPressed]}
        >
          <ThemedText type="body" style={styles.buttonText}>Next</ThemedText>
          <Feather name="arrow-right" size={18} color={theme.text} style={styles.buttonIcon} />
        </Pressable>
      </View>
    </View>
  );

  const Page3 = () => (
    <View style={[styles.page, { width: SCREEN_WIDTH, paddingTop: insets.top + Spacing.lg, paddingBottom: insets.bottom + Spacing.lg }]}>
      <View style={styles.header}>
        <View />
        <Pressable onPress={handleSkip} style={styles.loginButton}>
          <ThemedText type="small" style={styles.loginText}>Login</ThemedText>
        </Pressable>
      </View>

      <View style={styles.contentArea}>
        <Animated.View entering={FadeInUp.delay(200)} style={styles.metricsCard}>
          <GlassCard style={styles.statsCard}>
            <View style={styles.statsHeader}>
              <View>
                <ThemedText type="label" style={styles.statsLabel}>LEARNING RATE</ThemedText>
                <View style={styles.statsValue}>
                  <ThemedText type="revenue" style={styles.statsNumber}>99.9%</ThemedText>
                  <View style={styles.statsBadge}>
                    <Feather name="trending-up" size={12} color={theme.success} />
                    <ThemedText type="label" style={styles.statsGrowth}>+120%</ThemedText>
                  </View>
                </View>
              </View>
              <View style={styles.statsIcon}>
                <Feather name="refresh-cw" size={20} color={theme.primary} />
              </View>
            </View>

            <View style={styles.chartContainer}>
              <View style={styles.lineChart}>
                <View style={[styles.chartLine, { height: 40, left: "10%" }]} />
                <View style={[styles.chartLine, { height: 60, left: "25%" }]} />
                <View style={[styles.chartLine, { height: 35, left: "40%" }]} />
                <View style={[styles.chartLine, { height: 80, left: "55%" }]} />
                <View style={[styles.chartLine, { height: 50, left: "70%" }]} />
                <View style={[styles.chartLine, { height: 70, left: "85%" }]} />
                <View style={styles.chartDot} />
              </View>
            </View>

            <View style={styles.progressBars}>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: "85%", backgroundColor: theme.primary }]} />
              </View>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: "65%", backgroundColor: theme.purple }]} />
              </View>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: "92%", backgroundColor: "#3b82f6" }]} />
              </View>
            </View>
            <ThemedText type="caption" style={styles.optimizationText}>Real-time Optimization Active</ThemedText>
          </GlassCard>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(400)} style={styles.page3Title}>
          <ThemedText type="h1" style={styles.intelligentTitle}>Intelligent</ThemedText>
          <ThemedText type="h1" style={styles.intelligentTitle}>Automation</ThemedText>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(600)}>
          <ThemedText type="body" style={styles.descriptionText}>
            Train your AI workforce in minutes. Watch them learn, adapt, and handle customer queries 24/7 with human-like precision.
          </ThemedText>
        </Animated.View>
      </View>

      <View style={styles.bottomActions}>
        <PaginationDots />
        <Pressable
          onPress={() => {
            console.log("Complete button pressed");
            handleComplete();
          }}
          style={({ pressed }) => [styles.primaryButton, pressed && styles.buttonPressed]}
        >
          <ThemedText type="body" style={styles.buttonText}>Launch Your Workspace</ThemedText>
          <Feather name="arrow-right" size={18} color={theme.text} style={styles.buttonIcon} />
        </Pressable>
        <Pressable onPress={handleSkip}>
          <ThemedText type="small" style={styles.restoreText}>Restore Purchases</ThemedText>
        </Pressable>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <AnimatedBackground />
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
        scrollEventThrottle={16}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        <Page1 />
        <Page2 />
        <Page3 />
      </ScrollView>
    </View>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.backgroundRoot,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  page: {
    flex: 1,
    paddingHorizontal: Spacing["2xl"],
    justifyContent: "space-between",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  logoContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  logoIcon: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.sm,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  logoText: {
    color: "rgba(255, 255, 255, 0.5)",
    letterSpacing: 2,
  },
  skipText: {
    color: "rgba(255, 255, 255, 0.4)",
    fontWeight: "500",
  },
  heroContent: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
  },
  heroIconContainer: {
    marginBottom: Spacing["3xl"],
    alignItems: "center",
    justifyContent: "center",
  },
  heroIconGlow: {
    position: "absolute",
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.dark.primary,
    opacity: 0.2,
  },
  heroIcon: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius.lg,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  heroTitle: {
    textAlign: "center",
    lineHeight: 56,
  },
  heroTitleHighlight: {
    color: Colors.dark.primary,
  },
  heroSubtitle: {
    color: "rgba(255, 255, 255, 0.6)",
    textAlign: "center",
    marginTop: Spacing.xl,
    maxWidth: 280,
  },
  bottomActions: {
    alignItems: "center",
    gap: Spacing.lg,
  },
  paginationContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  paginationDot: {
    height: 6,
    borderRadius: 3,
  },
  primaryButton: {
    width: "100%",
    height: 56,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.dark.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    ...Shadows.glow,
  },
  buttonPressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.9,
  },
  buttonText: {
    fontWeight: "700",
    color: Colors.dark.text,
  },
  buttonIcon: {
    marginLeft: Spacing.sm,
  },
  secondaryLink: {
    color: "rgba(255, 255, 255, 0.5)",
    fontWeight: "700",
    paddingVertical: Spacing.sm,
  },
  contentArea: {
    flex: 1,
    justifyContent: "center",
  },
  page2Title: {
    marginBottom: Spacing.xl,
  },
  boldTitle: {
    fontSize: 44,
    fontWeight: "900",
    letterSpacing: -2,
    lineHeight: 48,
  },
  gradientTitle: {
    color: Colors.dark.primary,
  },
  previewContainer: {
    marginBottom: Spacing.xl,
  },
  previewCard: {
    aspectRatio: 4 / 3,
    overflow: "hidden",
  },
  previewContent: {
    flex: 1,
    padding: Spacing.md,
  },
  previewHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  previewDots: {
    flexDirection: "row",
    gap: 6,
  },
  previewDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  liveFeedBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
    gap: 6,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#22c55e",
  },
  liveFeedText: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 9,
  },
  previewChart: {
    flex: 1,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-around",
    paddingTop: Spacing.xl,
    paddingHorizontal: Spacing.md,
  },
  chartBar1: { width: 20, height: 40, backgroundColor: Colors.dark.primary, borderRadius: 4 },
  chartBar2: { width: 20, height: 60, backgroundColor: Colors.dark.primary, borderRadius: 4 },
  chartBar3: { width: 20, height: 35, backgroundColor: Colors.dark.primary, borderRadius: 4 },
  chartBar4: { width: 20, height: 80, backgroundColor: Colors.dark.primary, borderRadius: 4 },
  chartBar5: { width: 20, height: 55, backgroundColor: Colors.dark.primary, borderRadius: 4 },
  playButton: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: [{ translateX: -28 }, { translateY: -28 }],
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  descriptionText: {
    color: "rgba(255, 255, 255, 0.6)",
    lineHeight: 24,
  },
  loginButton: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
  },
  loginText: {
    color: "rgba(255, 255, 255, 0.7)",
  },
  metricsCard: {
    marginBottom: Spacing.xl,
  },
  statsCard: {
    padding: Spacing.lg,
  },
  statsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: Spacing.lg,
  },
  statsLabel: {
    color: "rgba(255, 255, 255, 0.5)",
    marginBottom: Spacing.xs,
  },
  statsValue: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  statsNumber: {
    color: Colors.dark.text,
  },
  statsBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(52, 211, 153, 0.1)",
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: 4,
    gap: 4,
  },
  statsGrowth: {
    color: Colors.dark.success,
    fontSize: 10,
  },
  statsIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(19, 91, 236, 0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  chartContainer: {
    height: 100,
    marginBottom: Spacing.lg,
  },
  lineChart: {
    flex: 1,
    position: "relative",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  chartLine: {
    position: "absolute",
    bottom: 0,
    width: 2,
    backgroundColor: Colors.dark.primary,
    borderRadius: 1,
  },
  chartDot: {
    position: "absolute",
    top: 30,
    left: "40%",
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.dark.text,
    ...Shadows.glow,
  },
  progressBars: {
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  progressBar: {
    height: 4,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 2,
  },
  optimizationText: {
    color: "rgba(255, 255, 255, 0.4)",
    textAlign: "right",
    fontSize: 10,
  },
  page3Title: {
    marginBottom: Spacing.lg,
  },
  intelligentTitle: {
    fontSize: 36,
    fontWeight: "700",
    lineHeight: 42,
  },
  restoreText: {
    color: "rgba(255, 255, 255, 0.4)",
    paddingVertical: Spacing.sm,
  },
});
