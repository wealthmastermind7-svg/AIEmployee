import React from "react";
import { StyleSheet, Pressable, ViewStyle, Platform, View } from "react-native";
import { BlurView } from "expo-blur";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  WithSpringConfig,
} from "react-native-reanimated";
import { Colors, Spacing, BorderRadius, Shadows } from "@/constants/theme";

interface GlassCardProps {
  children: React.ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
  intensity?: "low" | "medium" | "high";
  noPadding?: boolean;
}

const springConfig: WithSpringConfig = {
  damping: 15,
  mass: 0.3,
  stiffness: 150,
  overshootClamping: true,
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function GlassCard({
  children,
  onPress,
  style,
  intensity = "medium",
  noPadding = false,
}: GlassCardProps) {
  const theme = Colors.dark;
  const scale = useSharedValue(1);

  const getBackgroundOpacity = () => {
    switch (intensity) {
      case "low":
        return 0.4;
      case "high":
        return 0.8;
      default:
        return 0.6;
    }
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    if (onPress) {
      scale.value = withSpring(0.98, springConfig);
    }
  };

  const handlePressOut = () => {
    if (onPress) {
      scale.value = withSpring(1, springConfig);
    }
  };

  const containerStyle = [
    styles.container,
    {
      backgroundColor: `rgba(23, 29, 41, ${getBackgroundOpacity()})`,
      borderColor: theme.glassBorder,
    },
    !noPadding && styles.padding,
    style,
  ];

  if (Platform.OS === "ios") {
    return (
      <AnimatedPressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[styles.wrapper, animatedStyle]}
      >
        <BlurView intensity={24} tint="dark" style={containerStyle}>
          {children}
        </BlurView>
      </AnimatedPressable>
    );
  }

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[containerStyle, animatedStyle]}
    >
      {children}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    borderRadius: BorderRadius.xl,
    overflow: "hidden",
  },
  container: {
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    overflow: "hidden",
    ...Shadows.glass,
  },
  padding: {
    padding: Spacing.xl,
  },
});
