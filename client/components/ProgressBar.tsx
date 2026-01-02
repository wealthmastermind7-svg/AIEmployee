import React, { useEffect } from "react";
import { StyleSheet, View, ViewStyle } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { Colors, BorderRadius, Shadows } from "@/constants/theme";

interface ProgressBarProps {
  value: number;
  maxValue: number;
  height?: number;
  color?: string;
  showGlow?: boolean;
  style?: ViewStyle;
}

export function ProgressBar({
  value,
  maxValue,
  height = 6,
  color,
  showGlow = true,
  style,
}: ProgressBarProps) {
  const theme = Colors.dark;
  const progress = useSharedValue(0);
  const percentage = Math.min((value / maxValue) * 100, 100);

  useEffect(() => {
    progress.value = withTiming(percentage, {
      duration: 1000,
      easing: Easing.out(Easing.cubic),
    });
  }, [percentage]);

  const animatedStyle = useAnimatedStyle(() => ({
    width: `${progress.value}%`,
  }));

  const fillColor = color || (percentage >= 90 ? theme.success : theme.primary);

  return (
    <View style={[styles.container, { height }, style]}>
      <Animated.View
        style={[
          styles.fill,
          { backgroundColor: fillColor, height },
          showGlow && {
            shadowColor: fillColor,
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.5,
            shadowRadius: 8,
          },
          animatedStyle,
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: BorderRadius.full,
    overflow: "hidden",
  },
  fill: {
    borderRadius: BorderRadius.full,
  },
});
