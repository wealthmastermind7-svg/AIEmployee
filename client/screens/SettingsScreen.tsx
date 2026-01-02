import React, { useState } from "react";
import { StyleSheet, View, ScrollView, Pressable, Switch } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { Feather } from "@expo/vector-icons";
import Animated, { FadeIn } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { AnimatedBackground } from "@/components/AnimatedBackground";
import { GlassCard } from "@/components/GlassCard";
import { ThemedText } from "@/components/ThemedText";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";

interface SettingItemProps {
  icon: keyof typeof Feather.glyphMap;
  iconColor?: string;
  title: string;
  subtitle?: string;
  value?: string;
  hasArrow?: boolean;
  hasSwitch?: boolean;
  switchValue?: boolean;
  onSwitchChange?: (value: boolean) => void;
  onPress?: () => void;
}

function SettingItem({
  icon,
  iconColor,
  title,
  subtitle,
  value,
  hasArrow = true,
  hasSwitch = false,
  switchValue = false,
  onSwitchChange,
  onPress,
}: SettingItemProps) {
  const theme = Colors.dark;

  return (
    <Pressable
      onPress={() => {
        if (onPress) {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onPress();
        }
      }}
      style={styles.settingItem}
    >
      <View style={[styles.settingIcon, { backgroundColor: `${iconColor || theme.primary}20` }]}>
        <Feather name={icon} size={18} color={iconColor || theme.primary} />
      </View>
      <View style={styles.settingContent}>
        <ThemedText type="body">{title}</ThemedText>
        {subtitle ? (
          <ThemedText type="small" style={{ color: theme.textSecondary }}>
            {subtitle}
          </ThemedText>
        ) : null}
      </View>
      {value ? (
        <ThemedText type="small" style={{ color: theme.textSecondary, marginRight: Spacing.sm }}>
          {value}
        </ThemedText>
      ) : null}
      {hasSwitch ? (
        <Switch
          value={switchValue}
          onValueChange={(val) => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onSwitchChange?.(val);
          }}
          trackColor={{ false: "rgba(255, 255, 255, 0.1)", true: theme.primary }}
          thumbColor={theme.text}
        />
      ) : hasArrow ? (
        <Feather name="chevron-right" size={20} color={theme.textTertiary} />
      ) : null}
    </Pressable>
  );
}

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const theme = Colors.dark;

  const [pushNotifications, setPushNotifications] = useState(true);
  const [weeklyDigest, setWeeklyDigest] = useState(false);

  return (
    <View style={styles.container}>
      <AnimatedBackground />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: insets.top + Spacing.lg,
            paddingBottom: tabBarHeight + Spacing.xl,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <ThemedText type="h1">Settings</ThemedText>
          <View style={styles.headerAvatar}>
            <Feather name="user" size={20} color={theme.text} />
          </View>
        </View>

        <Animated.View entering={FadeIn.delay(100)}>
          <GlassCard style={styles.profileCard}>
            <View style={styles.profileContent}>
              <View style={styles.profileAvatar}>
                <Feather name="user" size={28} color={theme.text} />
                <View style={styles.editBadge}>
                  <Feather name="edit-2" size={10} color={theme.text} />
                </View>
              </View>
              <View style={styles.profileInfo}>
                <ThemedText type="h4">Sarah Connor</ThemedText>
                <ThemedText type="small" style={{ color: theme.textSecondary }}>
                  Admin • Tech Solutions Inc.
                </ThemedText>
                <View style={styles.planBadge}>
                  <ThemedText type="label" style={{ color: theme.primary }}>
                    PRO PLAN
                  </ThemedText>
                </View>
              </View>
              <Feather name="chevron-right" size={20} color={theme.textTertiary} />
            </View>
          </GlassCard>
        </Animated.View>

        <Animated.View entering={FadeIn.delay(200)}>
          <ThemedText type="h4" style={styles.sectionTitle}>
            General
          </ThemedText>
          <GlassCard noPadding style={styles.settingsGroup}>
            <SettingItem
              icon="briefcase"
              iconColor={theme.primary}
              title="Business Profile"
              subtitle="Tech Solutions Inc. • SaaS"
            />
            <View style={styles.divider} />
            <SettingItem
              icon="globe"
              iconColor="#8b5cf6"
              title="Language & R..."
              value="English (US)"
            />
          </GlassCard>
        </Animated.View>

        <Animated.View entering={FadeIn.delay(300)}>
          <ThemedText type="h4" style={styles.sectionTitle}>
            AI Behavior
          </ThemedText>
          <GlassCard noPadding style={styles.settingsGroup}>
            <SettingItem
              icon="message-circle"
              iconColor={theme.success}
              title="Response Tone"
              value="Professional"
            />
            <View style={styles.divider} />
            <SettingItem
              icon="clock"
              iconColor="#f472b6"
              title="Active Hours"
              subtitle="09:00 AM - 06:00 PM"
            />
          </GlassCard>
        </Animated.View>

        <Animated.View entering={FadeIn.delay(400)}>
          <ThemedText type="h4" style={styles.sectionTitle}>
            Notifications
          </ThemedText>
          <GlassCard noPadding style={styles.settingsGroup}>
            <SettingItem
              icon="bell"
              iconColor={theme.warning}
              title="Push Notifications"
              hasArrow={false}
              hasSwitch
              switchValue={pushNotifications}
              onSwitchChange={setPushNotifications}
            />
            <View style={styles.divider} />
            <SettingItem
              icon="mail"
              iconColor="#06b6d4"
              title="Weekly Digest"
              hasArrow={false}
              hasSwitch
              switchValue={weeklyDigest}
              onSwitchChange={setWeeklyDigest}
            />
          </GlassCard>
        </Animated.View>

        <Animated.View entering={FadeIn.delay(500)}>
          <GlassCard noPadding style={[styles.settingsGroup, { marginTop: Spacing.xl }]}>
            <SettingItem
              icon="lock"
              iconColor={theme.textSecondary}
              title="Change Password"
            />
          </GlassCard>
        </Animated.View>

        <Animated.View entering={FadeIn.delay(600)}>
          <Pressable
            onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)}
            style={styles.logoutButton}
          >
            <Feather name="log-out" size={18} color={theme.error} />
            <ThemedText type="body" style={{ color: theme.error, marginLeft: Spacing.sm }}>
              Log Out
            </ThemedText>
          </Pressable>
        </Animated.View>

        <View style={styles.footer}>
          <ThemedText type="caption" style={{ color: theme.textTertiary, textAlign: "center" }}>
            AI Employee v2.4.0 (Build 8902)
          </ThemedText>
          <View style={styles.footerLinks}>
            <ThemedText type="caption" style={{ color: theme.primary }}>
              Privacy Policy
            </ThemedText>
            <ThemedText type="caption" style={{ color: theme.textTertiary }}>
              {" • "}
            </ThemedText>
            <ThemedText type="caption" style={{ color: theme.primary }}>
              Terms of Service
            </ThemedText>
          </View>
        </View>
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
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  headerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  profileCard: {
    marginBottom: Spacing.xl,
  },
  profileContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  profileAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.lg,
    position: "relative",
  },
  editBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.dark.primary,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: Colors.dark.backgroundRoot,
  },
  profileInfo: {
    flex: 1,
  },
  planBadge: {
    backgroundColor: `${Colors.dark.primary}20`,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.xs,
    alignSelf: "flex-start",
    marginTop: 4,
  },
  sectionTitle: {
    marginBottom: Spacing.md,
  },
  settingsGroup: {
    marginBottom: Spacing.lg,
    overflow: "hidden",
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
  },
  settingIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  settingContent: {
    flex: 1,
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    marginLeft: Spacing.lg + 36 + Spacing.md,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: `${Colors.dark.error}15`,
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: `${Colors.dark.error}30`,
    marginTop: Spacing.md,
  },
  footer: {
    marginTop: Spacing["3xl"],
    alignItems: "center",
  },
  footerLinks: {
    flexDirection: "row",
    marginTop: Spacing.xs,
  },
});
