import React from "react";
import { StyleSheet, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { GlassCard } from "@/components/GlassCard";
import { ThemedText } from "@/components/ThemedText";
import { ProgressBar } from "@/components/ProgressBar";
import { Colors, Spacing } from "@/constants/theme";

interface StatCardProps {
  title: string;
  value: string | number;
  progress?: number;
  progressColor?: string;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  icon?: keyof typeof Feather.glyphMap;
  onPress?: () => void;
}

export function StatCard({
  title,
  value,
  progress,
  progressColor,
  trend,
  icon,
  onPress,
}: StatCardProps) {
  const theme = Colors.dark;

  return (
    <GlassCard onPress={onPress} style={styles.container}>
      {icon ? (
        <View style={[styles.iconContainer, { backgroundColor: `${theme.primary}20` }]}>
          <Feather name={icon} size={20} color={theme.primary} />
        </View>
      ) : null}
      <ThemedText type="caption" style={styles.title}>
        {title}
      </ThemedText>
      <ThemedText type="h3" style={styles.value}>
        {value}
      </ThemedText>
      {progress !== undefined ? (
        <ProgressBar
          value={progress}
          maxValue={100}
          height={4}
          color={progressColor}
          style={styles.progress}
        />
      ) : null}
      {trend ? (
        <View style={styles.trendContainer}>
          <Feather
            name={trend.isPositive ? "arrow-up" : "arrow-down"}
            size={10}
            color={trend.isPositive ? theme.success : theme.error}
          />
          <ThemedText
            type="caption"
            style={[
              styles.trendText,
              { color: trend.isPositive ? theme.success : theme.error },
            ]}
          >
            {trend.value}
          </ThemedText>
        </View>
      ) : null}
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    minHeight: 100,
    padding: Spacing.lg,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.sm,
  },
  title: {
    marginBottom: Spacing.xs,
  },
  value: {
    marginBottom: Spacing.xs,
  },
  progress: {
    marginTop: Spacing.sm,
  },
  trendContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: Spacing.xs,
  },
  trendText: {
    marginLeft: 2,
  },
});
