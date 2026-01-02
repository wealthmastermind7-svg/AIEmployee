import React, { useState } from "react";
import { StyleSheet, View, TextInput, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import Animated, { FadeIn, FadeInRight } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { AnimatedBackground } from "@/components/AnimatedBackground";
import { GlassCard } from "@/components/GlassCard";
import { ThemedText } from "@/components/ThemedText";
import { Button } from "@/components/Button";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import { RootStackParamList } from "@/navigation/RootStackNavigator";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

type Step = 1 | 2 | 3;
type FlowType = "inbound" | "outbound";
type GoalType = "schedule" | "faq" | "collect" | "triage";

interface Goal {
  id: GoalType;
  icon: keyof typeof Feather.glyphMap;
  title: string;
  description: string;
  color: string;
}

const GOALS: Goal[] = [
  {
    id: "schedule",
    icon: "calendar",
    title: "Schedule Meeting",
    description: "Book appointments directly on calendar",
    color: Colors.dark.primary,
  },
  {
    id: "faq",
    icon: "help-circle",
    title: "Answer FAQ",
    description: "Automated replies to common questions",
    color: Colors.dark.success,
  },
  {
    id: "collect",
    icon: "user-plus",
    title: "Collect Info",
    description: "Gather lead details and qualify prospects",
    color: Colors.dark.purple,
  },
  {
    id: "triage",
    icon: "git-branch",
    title: "Triage Issues",
    description: "Route complex tickets to humans",
    color: Colors.dark.warning,
  },
];

export default function CreateAgentScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const theme = Colors.dark;

  const [step, setStep] = useState<Step>(1);
  const [agentName, setAgentName] = useState("");
  const [businessUnit, setBusinessUnit] = useState("");
  const [flow, setFlow] = useState<FlowType>("inbound");
  const [openingLine, setOpeningLine] = useState("");
  const [selectedGoals, setSelectedGoals] = useState<GoalType[]>(["schedule", "collect"]);
  const [responseStyle, setResponseStyle] = useState(0.5);

  const handleFlowSelect = (selected: FlowType) => {
    Haptics.selectionAsync();
    setFlow(selected);
  };

  const handleGoalToggle = (goalId: GoalType) => {
    Haptics.selectionAsync();
    setSelectedGoals((prev) =>
      prev.includes(goalId) ? prev.filter((g) => g !== goalId) : [...prev, goalId]
    );
  };

  const handleContinue = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (step < 3) {
      setStep((prev) => (prev + 1) as Step);
    } else {
      navigation.goBack();
    }
  };

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (step > 1) {
      setStep((prev) => (prev - 1) as Step);
    } else {
      navigation.goBack();
    }
  };

  const renderStep1 = () => (
    <Animated.View entering={FadeInRight} style={styles.stepContent}>
      <View style={styles.stepHeader}>
        <ThemedText type="label" style={{ color: theme.primary }}>
          Step 1: Identity
        </ThemedText>
        <ThemedText type="h1" style={styles.stepTitle}>
          Create Agent
        </ThemedText>
        <ThemedText type="body" style={{ color: theme.textSecondary }}>
          Define your AI employee's core identity and role.
        </ThemedText>
      </View>

      <GlassCard style={styles.formCard}>
        <View style={styles.inputGroup}>
          <ThemedText type="body" style={{ fontWeight: "500", marginBottom: Spacing.sm }}>
            Agent Name
          </ThemedText>
          <View style={styles.inputContainer}>
            <Feather name="cpu" size={18} color={theme.textSecondary} />
            <TextInput
              style={styles.input}
              placeholder="e.g., Sarah Support"
              placeholderTextColor={theme.textTertiary}
              value={agentName}
              onChangeText={setAgentName}
            />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <ThemedText type="body" style={{ fontWeight: "500", marginBottom: Spacing.sm }}>
            Business Unit
          </ThemedText>
          <View style={styles.inputContainer}>
            <Feather name="briefcase" size={18} color={theme.textSecondary} />
            <TextInput
              style={styles.input}
              placeholder="e.g., Sales Department"
              placeholderTextColor={theme.textTertiary}
              value={businessUnit}
              onChangeText={setBusinessUnit}
            />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <ThemedText type="body" style={{ fontWeight: "500", marginBottom: Spacing.sm }}>
            Communication Flow
          </ThemedText>
          <View style={styles.flowSelector}>
            <Pressable
              onPress={() => handleFlowSelect("inbound")}
              style={[
                styles.flowOption,
                flow === "inbound" && styles.flowOptionActive,
              ]}
            >
              <Feather name="phone-incoming" size={16} color={flow === "inbound" ? theme.text : theme.textSecondary} />
              <ThemedText
                type="body"
                style={[
                  styles.flowText,
                  flow === "inbound" && styles.flowTextActive,
                ]}
              >
                Inbound
              </ThemedText>
            </Pressable>
            <Pressable
              onPress={() => handleFlowSelect("outbound")}
              style={[
                styles.flowOption,
                flow === "outbound" && styles.flowOptionActive,
              ]}
            >
              <ThemedText
                type="body"
                style={[
                  styles.flowText,
                  flow === "outbound" && styles.flowTextActive,
                ]}
              >
                Outbound
              </ThemedText>
              <Feather name="phone-outgoing" size={16} color={flow === "outbound" ? theme.text : theme.textSecondary} />
            </Pressable>
          </View>
        </View>

        <View style={styles.inputGroup}>
          <ThemedText type="body" style={{ fontWeight: "500", marginBottom: Spacing.sm }}>
            Opening Line
          </ThemedText>
          <View style={[styles.inputContainer, styles.textAreaContainer]}>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Hi there! How can I help you today?"
              placeholderTextColor={theme.textTertiary}
              value={openingLine}
              onChangeText={setOpeningLine}
              multiline
            />
          </View>
          <ThemedText type="caption" style={{ color: theme.textTertiary, marginTop: Spacing.xs }}>
            This message will be spoken first when the call connects.
          </ThemedText>
        </View>
      </GlassCard>
    </Animated.View>
  );

  const renderStep2 = () => (
    <Animated.View entering={FadeInRight} style={styles.stepContent}>
      <View style={styles.stepHeader}>
        <ThemedText type="label" style={{ color: theme.primary }}>
          Step 2 of 4
        </ThemedText>
        <ThemedText type="h1" style={[styles.stepTitle, { fontStyle: "italic" }]}>
          Define Agent Goals
        </ThemedText>
        <ThemedText type="body" style={{ color: theme.textSecondary }}>
          What is the primary objective for this AI employee?
        </ThemedText>
      </View>

      <View style={styles.tabSelector}>
        <Pressable style={[styles.tab, styles.tabActive]}>
          <ThemedText type="body" style={{ fontWeight: "600" }}>Basic</ThemedText>
        </Pressable>
        <Pressable style={styles.tab}>
          <ThemedText type="body" style={{ color: theme.textSecondary }}>Advanced</ThemedText>
        </Pressable>
      </View>

      <View style={styles.goalsGrid}>
        {GOALS.map((goal, index) => (
          <Animated.View key={goal.id} entering={FadeIn.delay(index * 100)}>
            <Pressable
              onPress={() => handleGoalToggle(goal.id)}
              style={[
                styles.goalCard,
                selectedGoals.includes(goal.id) && styles.goalCardActive,
              ]}
            >
              <View style={styles.goalHeader}>
                <View style={[styles.goalIcon, { backgroundColor: `${goal.color}20` }]}>
                  <Feather name={goal.icon} size={22} color={goal.color} />
                </View>
                <View style={[styles.goalCheck, selectedGoals.includes(goal.id) && styles.goalCheckActive]}>
                  {selectedGoals.includes(goal.id) ? (
                    <Feather name="check" size={14} color={theme.text} />
                  ) : null}
                </View>
              </View>
              <ThemedText type="body" style={{ fontWeight: "600", marginTop: Spacing.md }}>
                {goal.title}
              </ThemedText>
              <ThemedText type="small" style={{ color: theme.textSecondary, marginTop: 4 }}>
                {goal.description}
              </ThemedText>
            </Pressable>
          </Animated.View>
        ))}
      </View>

      <GlassCard style={styles.sliderCard}>
        <View style={styles.sliderHeader}>
          <Feather name="sliders" size={18} color={theme.textSecondary} />
          <ThemedText type="body" style={{ marginLeft: Spacing.sm }}>Response Style</ThemedText>
          <ThemedText type="body" style={{ color: theme.primary, marginLeft: "auto" }}>
            Balanced
          </ThemedText>
        </View>
        <View style={styles.sliderContainer}>
          <View style={styles.sliderTrack}>
            <View style={[styles.sliderFill, { width: `${responseStyle * 100}%` }]} />
            <View style={[styles.sliderThumb, { left: `${responseStyle * 100}%` }]} />
          </View>
          <View style={styles.sliderLabels}>
            <ThemedText type="label">Formal</ThemedText>
            <ThemedText type="label">Casual</ThemedText>
          </View>
        </View>
      </GlassCard>

      <GlassCard style={styles.infoCard}>
        <Feather name="info" size={16} color={theme.primary} />
        <ThemedText type="small" style={{ color: theme.textSecondary, marginLeft: Spacing.sm, flex: 1 }}>
          Selecting <ThemedText type="small" style={{ fontWeight: "600", color: theme.text }}>Schedule Meeting</ThemedText> will automatically enable Google Calendar integration in step 3.
        </ThemedText>
      </GlassCard>
    </Animated.View>
  );

  const renderStep3 = () => (
    <Animated.View entering={FadeInRight} style={styles.stepContent}>
      <View style={styles.stepHeader}>
        <ThemedText type="h1" style={styles.stepTitle}>
          Connect a Number
        </ThemedText>
        <ThemedText type="body" style={{ color: theme.textSecondary }}>
          Assign a phone line for voice and SMS capabilities.
        </ThemedText>
      </View>

      <GlassCard
        onPress={() => Haptics.selectionAsync()}
        style={[styles.numberOption, styles.numberOptionActive]}
      >
        <View style={[styles.numberIcon, { backgroundColor: `${theme.primary}20` }]}>
          <Feather name="smartphone" size={22} color={theme.primary} />
        </View>
        <View style={styles.numberContent}>
          <ThemedText type="body" style={{ fontWeight: "600" }}>Use Existing Number</ThemedText>
          <ThemedText type="small" style={{ color: theme.textSecondary }}>
            Select from your inventory
          </ThemedText>
        </View>
        <View style={styles.radioOuter}>
          <View style={styles.radioInner} />
        </View>
      </GlassCard>

      <GlassCard
        onPress={() => Haptics.selectionAsync()}
        style={styles.numberOption}
      >
        <View style={[styles.numberIcon, { backgroundColor: "rgba(255, 255, 255, 0.05)" }]}>
          <Feather name="phone-call" size={22} color={theme.textSecondary} />
        </View>
        <View style={styles.numberContent}>
          <ThemedText type="body" style={{ fontWeight: "600" }}>Get a New Number</ThemedText>
          <ThemedText type="small" style={{ color: theme.textSecondary }}>
            Provision a dedicated line
          </ThemedText>
        </View>
        <View style={[styles.radioOuter, { borderColor: theme.textTertiary }]} />
      </GlassCard>

      <GlassCard style={styles.confirmCard}>
        <Feather name="info" size={16} color={theme.primary} />
        <ThemedText type="small" style={{ color: theme.textSecondary, marginLeft: Spacing.sm, flex: 1 }}>
          <ThemedText type="small" style={{ fontWeight: "600", color: theme.text }}>Agent {agentName || "Sarah"}</ThemedText> will be reachable immediately. Voice recording and SMS logging will be enabled by default.
        </ThemedText>
      </GlassCard>
    </Animated.View>
  );

  return (
    <View style={styles.container}>
      <AnimatedBackground />
      <KeyboardAwareScrollViewCompat
        style={styles.scrollView}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + 100 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.progressContainer}>
          <View style={styles.progressDots}>
            {[1, 2, 3].map((s) => (
              <View
                key={s}
                style={[
                  styles.progressDot,
                  s === step && styles.progressDotActive,
                  s < step && styles.progressDotComplete,
                ]}
              />
            ))}
          </View>
        </View>

        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
      </KeyboardAwareScrollViewCompat>

      <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing.lg }]}>
        {step === 3 ? (
          <View style={styles.footerButtons}>
            <Pressable onPress={handleBack} style={styles.backButton}>
              <ThemedText type="body" style={{ fontWeight: "600" }}>Back</ThemedText>
            </Pressable>
            <Pressable onPress={handleContinue} style={styles.launchButton}>
              <ThemedText type="body" style={{ fontWeight: "600" }}>Launch Agent</ThemedText>
              <Feather name="zap" size={18} color={theme.text} style={{ marginLeft: Spacing.sm }} />
            </Pressable>
          </View>
        ) : (
          <Pressable onPress={handleContinue} style={styles.continueButton}>
            <ThemedText type="body" style={{ fontWeight: "600" }}>
              {step === 1 ? "Continue to Configuration" : "Continue"}
            </ThemedText>
            <Feather name="arrow-right" size={18} color={theme.text} style={{ marginLeft: Spacing.sm }} />
          </Pressable>
        )}
      </View>
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
    paddingTop: Spacing.lg,
  },
  progressContainer: {
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  progressDots: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
  },
  progressDotActive: {
    width: 24,
    backgroundColor: Colors.dark.primary,
  },
  progressDotComplete: {
    backgroundColor: Colors.dark.primary,
  },
  stepContent: {
    flex: 1,
  },
  stepHeader: {
    marginBottom: Spacing.xl,
  },
  stepTitle: {
    marginTop: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  formCard: {
    padding: Spacing.xl,
  },
  inputGroup: {
    marginBottom: Spacing.xl,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    paddingHorizontal: Spacing.lg,
    height: 52,
  },
  textAreaContainer: {
    height: 100,
    alignItems: "flex-start",
    paddingVertical: Spacing.md,
  },
  input: {
    flex: 1,
    color: Colors.dark.text,
    fontSize: 16,
    marginLeft: Spacing.sm,
  },
  textArea: {
    height: "100%",
    textAlignVertical: "top",
  },
  flowSelector: {
    flexDirection: "row",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: BorderRadius.md,
    padding: 4,
  },
  flowOption: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.sm,
    gap: Spacing.sm,
  },
  flowOptionActive: {
    backgroundColor: Colors.dark.primary,
  },
  flowText: {
    color: Colors.dark.textSecondary,
  },
  flowTextActive: {
    color: Colors.dark.text,
    fontWeight: "600",
  },
  tabSelector: {
    flexDirection: "row",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: BorderRadius.md,
    padding: 4,
    marginBottom: Spacing.xl,
  },
  tab: {
    flex: 1,
    paddingVertical: Spacing.md,
    alignItems: "center",
    borderRadius: BorderRadius.sm,
  },
  tabActive: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  goalsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  goalCard: {
    width: "48%",
    backgroundColor: "rgba(23, 29, 41, 0.6)",
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    padding: Spacing.lg,
    minWidth: 150,
    flexGrow: 1,
  },
  goalCardActive: {
    borderColor: Colors.dark.primary,
    backgroundColor: `${Colors.dark.primary}10`,
  },
  goalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  goalIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  goalCheck: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  goalCheckActive: {
    backgroundColor: Colors.dark.primary,
    borderColor: Colors.dark.primary,
  },
  sliderCard: {
    marginBottom: Spacing.lg,
  },
  sliderHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  sliderContainer: {},
  sliderTrack: {
    height: 6,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 3,
    position: "relative",
  },
  sliderFill: {
    height: "100%",
    backgroundColor: Colors.dark.primary,
    borderRadius: 3,
  },
  sliderThumb: {
    position: "absolute",
    top: -7,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.dark.text,
    marginLeft: -10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  sliderLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: Spacing.sm,
  },
  infoCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: Spacing.lg,
  },
  confirmCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: Spacing.lg,
    marginTop: Spacing.xl,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    borderStyle: "dashed",
  },
  numberOption: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  numberOptionActive: {
    borderColor: Colors.dark.primary,
    backgroundColor: `${Colors.dark.primary}10`,
  },
  numberIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  numberContent: {
    flex: 1,
  },
  radioOuter: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.dark.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.dark.primary,
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: Spacing["2xl"],
    paddingTop: Spacing.lg,
    backgroundColor: "rgba(16, 22, 34, 0.95)",
    borderTopWidth: 1,
    borderTopColor: Colors.dark.glassBorder,
  },
  continueButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.dark.primary,
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.xl,
  },
  footerButtons: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  backButton: {
    flex: 0.3,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  launchButton: {
    flex: 0.7,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.dark.primary,
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.xl,
  },
});
