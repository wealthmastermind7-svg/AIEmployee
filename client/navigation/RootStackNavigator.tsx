import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import MainTabNavigator from "@/navigation/MainTabNavigator";
import ConversationDetailScreen from "@/screens/ConversationDetailScreen";
import CreateAgentScreen from "@/screens/CreateAgentScreen";
import AgentDetailScreen from "@/screens/AgentDetailScreen";
import { useScreenOptions } from "@/hooks/useScreenOptions";
import { Colors } from "@/constants/theme";

export type RootStackParamList = {
  Main: undefined;
  ConversationDetail: { conversationId: string };
  CreateAgent: undefined;
  AgentDetail: { agentId: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootStackNavigator() {
  const screenOptions = useScreenOptions();
  const theme = Colors.dark;

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
    </Stack.Navigator>
  );
}
