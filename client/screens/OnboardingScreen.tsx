import React, { useRef, useState } from "react";
import {
  StyleSheet,
  View,
  Pressable,
  Dimensions,
  Platform,
  ScrollView,
  Image,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import Animated, {
  FadeIn,
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
  const [isCreating, setIsCreating] = useState(false);
  const { createBusiness } = useBusiness();

  const handleScroll = (event: any) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const page = Math.round(offsetX / SCREEN_WIDTH);
    if (page !== currentPage) {
      setCurrentPage(page);
      pageOffset.value = withTiming(page, { duration: 300 });
    }
  };

  const handleNext = () => {
    if (currentPage < 3) {
      const nextPage = currentPage + 1;
      scrollRef.current?.scrollTo({ x: nextPage * SCREEN_WIDTH, animated: true });
      setCurrentPage(nextPage);
      pageOffset.value = withTiming(nextPage, { duration: 300 });
      if (Platform.OS !== "web") {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    } else {
      handleComplete();
    }
  };

  const handleComplete = async () => {
    if (isCreating) return;
    setIsCreating(true);
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    try {
      await createBusiness("My Workspace");
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (error) {
      console.error("Failed to create business:", error);
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } finally {
      setIsCreating(false);
    }
  };

  const PaginationDots = ({ total }: { total: number }) => (
    <View style={styles.paginationContainer}>
      {Array.from({ length: total }).map((_, index) => {
        const dotStyle = useAnimatedStyle(() => ({
          width: interpolate(
            pageOffset.value,
            [index - 1, index, index + 1],
            [8, 24, 8],
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
              { backgroundColor: theme.primary },
              dotStyle,
            ]}
          />
        );
      })}
    </View>
  );

  const WelcomePage = () => (
    <View style={[styles.page, { width: SCREEN_WIDTH }]}>
      <Animated.View entering={FadeIn.delay(200)} style={styles.welcomeHero}>
        <View style={styles.orbContainer}>
          <View style={styles.orb1} />
          <View style={styles.orb2} />
        </View>
        <Image source={require("../../assets/icon.png")} style={styles.largeIcon} />
      </Animated.View>

      <View style={styles.welcomeContent}>
        <Animated.View entering={FadeInUp.delay(400)}>
          <ThemedText type="display" style={styles.title}>WorkMate</ThemedText>
          <ThemedText type="body" style={styles.subtitle}>Your AI-Powered Productivity Partner</ThemedText>
        </Animated.View>
      </View>

      <View style={[styles.bottomActions, { paddingBottom: insets.bottom + Spacing.xl }]}>
        <Pressable
          onPress={handleNext}
          style={({ pressed }) => [styles.primaryButton, pressed && styles.buttonPressed]}
        >
          <ThemedText style={styles.buttonText}>Continue</ThemedText>
        </Pressable>
        <Pressable onPress={handleComplete}>
          <ThemedText style={styles.textLink}>Skip</ThemedText>
        </Pressable>
      </View>
    </View>
  );

  const PainPointsPage = () => (
    <View style={[styles.page, { width: SCREEN_WIDTH }]}>
      <View style={[styles.header, { paddingTop: insets.top + Spacing.md }]}>
        <PaginationDots total={4} />
        <Pressable onPress={handleComplete}>
          <ThemedText style={styles.skipText}>Skip</ThemedText>
        </Pressable>
      </View>

      <Animated.View entering={FadeIn.delay(200)} style={styles.welcomeHero}>
        <View style={styles.orbContainer}>
          <View style={styles.orb1} />
          <View style={styles.orb2} />
        </View>
        <View style={styles.iconCircle}>
          <Feather name="mic" size={32} color={theme.text} />
        </View>
      </Animated.View>

      <View style={styles.welcomeContent}>
        <Animated.View entering={FadeInUp.delay(400)}>
          <ThemedText type="h1" style={styles.gradientTitle}>Human-Like Voice</ThemedText>
          <ThemedText type="body" style={styles.subtitle}>Ultra-low latency AI voice agents that handle complex customer inquiries naturally.</ThemedText>
        </Animated.View>
      </View>

      <View style={[styles.bottomActions, { paddingBottom: insets.bottom + Spacing.xl }]}>
        <Pressable
          onPress={handleNext}
          style={({ pressed }) => [styles.primaryButton, pressed && styles.buttonPressed]}
        >
          <ThemedText style={styles.buttonText}>Next</ThemedText>
        </Pressable>
      </View>
    </View>
  );

  const ResponsePage = () => (
    <View style={[styles.page, { width: SCREEN_WIDTH }]}>
      <View style={[styles.header, { paddingTop: insets.top + Spacing.md }]}>
        <PaginationDots total={4} />
        <Pressable onPress={handleComplete}>
          <ThemedText style={styles.skipText}>Skip</ThemedText>
        </Pressable>
      </View>

      <Animated.View entering={FadeIn.delay(200)} style={styles.welcomeHero}>
        <View style={styles.orbContainer}>
          <View style={styles.orb1} />
        </View>
        <View style={styles.iconCircle}>
          <Feather name="clock" size={32} color={theme.text} />
        </View>
      </Animated.View>

      <View style={styles.welcomeContent}>
        <Animated.View entering={FadeInUp.delay(400)}>
          <ThemedText type="h1" style={styles.gradientTitle}>Slow to Respond</ThemedText>
          <ThemedText type="body" style={styles.subtitle}>Modern customers expect instant answers. Every minute of delay is a lost sale.</ThemedText>
        </Animated.View>
      </View>

      <View style={[styles.bottomActions, { paddingBottom: insets.bottom + Spacing.xl }]}>
        <Pressable
          onPress={handleNext}
          style={({ pressed }) => [styles.primaryButton, pressed && styles.buttonPressed]}
        >
          <ThemedText style={styles.buttonText}>Next</ThemedText>
        </Pressable>
      </View>
    </View>
  );

  const AlwaysOnPage = () => (
    <View style={[styles.page, { width: SCREEN_WIDTH }]}>
      <View style={[styles.header, { paddingTop: insets.top + Spacing.md }]}>
        <PaginationDots total={4} />
        <Pressable onPress={handleComplete}>
          <ThemedText style={styles.skipText}>Skip</ThemedText>
        </Pressable>
      </View>

      <Animated.View entering={FadeIn.delay(200)} style={styles.welcomeHero}>
        <View style={styles.orbContainer}>
          <View style={styles.orb2} />
        </View>
        <View style={styles.iconCircle}>
          <Feather name="moon" size={32} color={theme.text} />
        </View>
      </Animated.View>

      <View style={styles.welcomeContent}>
        <Animated.View entering={FadeInUp.delay(400)}>
          <ThemedText type="h1" style={styles.gradientTitle}>Never Off Duty</ThemedText>
          <ThemedText type="body" style={styles.subtitle}>WorkMate works while you sleep. Full 24/7 availability for your business without the overhead.</ThemedText>
        </Animated.View>
      </View>

      <View style={[styles.bottomActions, { paddingBottom: insets.bottom + Spacing.xl }]}>
        <Pressable
          onPress={handleComplete}
          disabled={isCreating}
          style={({ pressed }) => [styles.primaryButton, pressed && styles.buttonPressed, isCreating && { opacity: 0.7 }]}
        >
          {isCreating ? (
            <ActivityIndicator size="small" color={theme.text} />
          ) : (
            <ThemedText style={styles.buttonText}>Get Started</ThemedText>
          )}
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
      >
        <WelcomePage />
        <PainPointsPage />
        <ResponsePage />
        <AlwaysOnPage />
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
  welcomeHero: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  orbContainer: {
    position: "absolute",
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  orb1: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: Colors.dark.primary,
    opacity: 0.2,
    position: "absolute",
    top: "30%",
  },
  orb2: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: "#2a3b55",
    opacity: 0.3,
    position: "absolute",
    bottom: "30%",
  },
  largeIcon: {
    width: 120,
    height: 120,
    borderRadius: 30,
    ...Shadows.glow,
  },
  welcomeContent: {
    alignItems: "center",
    marginBottom: Spacing["3xl"],
  },
  title: {
    fontSize: 64,
    fontWeight: "900",
    textAlign: "center",
    letterSpacing: -2,
  },
  subtitle: {
    textAlign: "center",
    opacity: 0.7,
    marginTop: Spacing.sm,
  },
  centerContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.15)",
    alignItems: "center",
    justifyContent: "center",
    ...Shadows.glow,
  },
  gradientTitle: {
    fontSize: 36,
    fontWeight: "900",
    textAlign: "center",
    marginBottom: Spacing.md,
    color: Colors.dark.text,
    letterSpacing: -1,
  },
  bottomActions: {
    alignItems: "center",
    gap: Spacing.lg,
  },
  paginationContainer: {
    flexDirection: "row",
    gap: 8,
  },
  paginationDot: {
    height: 8,
    borderRadius: 4,
  },
  primaryButton: {
    width: "100%",
    height: 56,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.dark.primary,
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
    fontSize: 16,
  },
  textLink: {
    color: Colors.dark.primary,
    fontWeight: "600",
  },
  skipText: {
    color: "rgba(255, 255, 255, 0.4)",
  },
});
