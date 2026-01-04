import React from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import MainTabNavigator from "@/navigation/MainTabNavigator";
import ConversationDetailScreen from "@/screens/ConversationDetailScreen";
import CreateAgentScreen from "@/screens/CreateAgentScreen";
import AgentDetailScreen from "@/screens/AgentDetailScreen";
import AgentTrainingScreen from "@/screens/AgentTrainingScreen";
import OnboardingScreen from "@/screens/OnboardingScreen";
import UsageScreen from "@/screens/UsageScreen";
import { useScreenOptions } from "@/hooks/useScreenOptions";
import { Colors } from "@/constants/theme";
import { useBusiness } from "@/contexts/BusinessContext";

export type RootStackParamList = {
  Main: undefined;
  ConversationDetail: { conversationId: string };
  CreateAgent: undefined;
  AgentDetail: { agentId: string };
  AgentTraining: { agentId: string; agentName: string };
  Usage: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootStackNavigator() {
  const screenOptions = useScreenOptions();
  const theme = Colors.dark;
  const { isLoading, isOnboarded } = useBusiness();

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  if (!isOnboarded) {
    return <OnboardingScreen />;
  }

  return (
    <Stack.Navigator
      screenOptions={{
        ...screenOptions,
        headerStyle: {
          backgroundColor: theme.backgroundRoot,
        },
        headerTintColor: theme.text,
        contentStyle: {
          backgroundColor: theme.backgroundRoot,
        },
      }}
    >
      <Stack.Screen
        name="Main"
        component={MainTabNavigator}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="ConversationDetail"
        component={ConversationDetailScreen}
        options={{
          headerTitle: "Conversation",
          headerBackTitle: "Back",
        }}
      />
      <Stack.Screen
        name="CreateAgent"
        component={CreateAgentScreen}
        options={{
          presentation: "modal",
          headerTitle: "Create Agent",
        }}
      />
      <Stack.Screen
        name="AgentDetail"
        component={AgentDetailScreen}
        options={{
          headerTitle: "Agent Details",
          headerBackTitle: "Back",
        }}
      />
      <Stack.Screen
        name="Usage"
        component={UsageScreen}
        options={{
          headerTitle: "AI Usage",
          headerBackTitle: "Back",
        }}
      />
      <Stack.Screen
        name="AgentTraining"
        component={AgentTrainingScreen}
        options={{
          headerTitle: "Train Agent",
          headerBackTitle: "Back",
        }}
      />
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.dark.backgroundRoot,
  },
});
