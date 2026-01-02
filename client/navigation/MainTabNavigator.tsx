import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Feather } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { Platform, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import DashboardScreen from "@/screens/DashboardScreen";
import InboxScreen from "@/screens/InboxScreen";
import AgentsScreen from "@/screens/AgentsScreen";
import SettingsScreen from "@/screens/SettingsScreen";
import { Colors, Spacing } from "@/constants/theme";

export type MainTabParamList = {
  Dashboard: undefined;
  Inbox: undefined;
  Agents: undefined;
  Settings: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();

export default function MainTabNavigator() {
  const insets = useSafeAreaInsets();
  const theme = Colors.dark;

  return (
    <Tab.Navigator
      initialRouteName="Dashboard"
      screenOptions={{
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.tabIconDefault,
        tabBarStyle: {
          position: "absolute",
          backgroundColor: Platform.select({
            ios: "transparent",
            android: "rgba(16, 22, 34, 0.95)",
            web: "rgba(16, 22, 34, 0.95)",
          }),
          borderTopWidth: 1,
          borderTopColor: theme.glassBorder,
          height: 80 + insets.bottom,
          paddingTop: Spacing.sm,
          paddingBottom: insets.bottom + Spacing.xs,
          elevation: 0,
        },
        tabBarBackground: () =>
          Platform.OS === "ios" ? (
            <BlurView
              intensity={80}
              tint="dark"
              style={StyleSheet.absoluteFill}
            />
          ) : (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(16, 22, 34, 0.95)" }]} />
          ),
        headerShown: false,
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: "500",
          marginTop: 4,
        },
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => (
            <Feather name="grid" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Inbox"
        component={InboxScreen}
        options={{
          title: "Inbox",
          tabBarIcon: ({ color, size }) => (
            <Feather name="message-square" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Agents"
        component={AgentsScreen}
        options={{
          title: "Agents",
          tabBarIcon: ({ color, size }) => (
            <Feather name="cpu" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          title: "Settings",
          tabBarIcon: ({ color, size }) => (
            <Feather name="settings" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}
