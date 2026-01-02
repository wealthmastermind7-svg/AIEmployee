import React, { useEffect } from "react";
import { StyleSheet, View, Dimensions } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
  interpolate,
} from "react-native-reanimated";
import { Colors } from "@/constants/theme";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

interface OrbProps {
  size: number;
  color: string;
  initialX: number;
  initialY: number;
  duration: number;
  delay?: number;
}

function Orb({ size, color, initialX, initialY, duration, delay = 0 }: OrbProps) {
  const progress = useSharedValue(0);

  useEffect(() => {
    const timeout = setTimeout(() => {
      progress.value = withRepeat(
        withSequence(
          withTiming(1, { duration: duration, easing: Easing.inOut(Easing.sin) }),
          withTiming(0, { duration: duration, easing: Easing.inOut(Easing.sin) })
        ),
        -1,
        false
      );
    }, delay);
    return () => clearTimeout(timeout);
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    const translateX = interpolate(progress.value, [0, 0.5, 1], [0, 30, 0]);
    const translateY = interpolate(progress.value, [0, 0.5, 1], [0, -50, 0]);
    const scale = interpolate(progress.value, [0, 0.5, 1], [1, 1.1, 1]);

    return {
      transform: [
        { translateX },
        { translateY },
        { scale },
      ],
    };
  });

  return (
    <Animated.View
      style={[
        styles.orb,
        {
          width: size,
          height: size,
          backgroundColor: color,
          left: initialX,
          top: initialY,
        },
        animatedStyle,
      ]}
    />
  );
}

export function AnimatedBackground() {
  const theme = Colors.dark;

  return (
    <View style={styles.container}>
      <Orb
        size={SCREEN_WIDTH * 0.8}
        color={theme.orb1}
        initialX={-SCREEN_WIDTH * 0.2}
        initialY={-SCREEN_HEIGHT * 0.15}
        duration={12000}
        delay={0}
      />
      <Orb
        size={SCREEN_WIDTH * 1.0}
        color={theme.orb2}
        initialX={SCREEN_WIDTH * 0.3}
        initialY={SCREEN_HEIGHT * 0.35}
        duration={15000}
        delay={2000}
      />
      <Orb
        size={SCREEN_WIDTH * 0.7}
        color={theme.orb3}
        initialX={SCREEN_WIDTH * 0.1}
        initialY={SCREEN_HEIGHT * 0.7}
        duration={10000}
        delay={1000}
      />
      <View style={styles.noiseOverlay} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.dark.backgroundRoot,
    overflow: "hidden",
  },
  orb: {
    position: "absolute",
    borderRadius: 9999,
    opacity: 0.6,
  },
  noiseOverlay: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.03,
    backgroundColor: "rgba(255, 255, 255, 0.02)",
  },
});
