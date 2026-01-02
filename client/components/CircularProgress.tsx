import React, { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
  Easing,
} from "react-native-reanimated";
import Svg, { Circle, Defs, LinearGradient, Stop } from "react-native-svg";
import { ThemedText } from "@/components/ThemedText";
import { Colors, Spacing } from "@/constants/theme";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface CircularProgressProps {
  value: number;
  maxValue: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
  showValue?: boolean;
}

export function CircularProgress({
  value,
  maxValue,
  size = 96,
  strokeWidth = 6,
  label,
  showValue = true,
}: CircularProgressProps) {
  const theme = Colors.dark;
  const progress = useSharedValue(0);
  const percentage = Math.min((value / maxValue) * 100, 100);

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  useEffect(() => {
    progress.value = withTiming(percentage / 100, {
      duration: 1500,
      easing: Easing.out(Easing.cubic),
    });
  }, [percentage]);

  const animatedProps = useAnimatedProps(() => {
    const strokeDashoffset = circumference * (1 - progress.value);
    return {
      strokeDashoffset,
    };
  });

  return (
    <View style={styles.container}>
      <View style={[styles.circleContainer, { width: size, height: size }]}>
        <Svg width={size} height={size} style={styles.svg}>
          <Defs>
            <LinearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <Stop offset="0%" stopColor={theme.primary} />
              <Stop offset="100%" stopColor={theme.primaryLight} />
            </LinearGradient>
          </Defs>
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="rgba(255, 255, 255, 0.05)"
            strokeWidth={strokeWidth}
            fill="none"
          />
          <AnimatedCircle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="url(#progressGradient)"
            strokeWidth={strokeWidth}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={circumference}
            animatedProps={animatedProps}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        </Svg>
        {showValue ? (
          <View style={styles.valueContainer}>
            <ThemedText type="h2" style={styles.value}>
              {value}
            </ThemedText>
          </View>
        ) : null}
      </View>
      {label ? (
        <ThemedText type="label" style={styles.label}>
          {label}
        </ThemedText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
  },
  circleContainer: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
  },
  svg: {
    position: "absolute",
  },
  valueContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  value: {
    fontWeight: "700",
  },
  label: {
    marginTop: Spacing.sm,
    textAlign: "center",
  },
});
