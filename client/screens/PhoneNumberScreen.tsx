import React, { useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useHeaderHeight } from "@react-navigation/elements";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { NativeStackScreenProps } from "@react-navigation/native-stack";

import { ThemedText } from "@/components/ThemedText";
import { GlassCard } from "@/components/GlassCard";
import { useTheme } from "@/hooks/useTheme";
import { useBusiness } from "@/contexts/BusinessContext";
import { getApiUrl, apiRequest } from "@/lib/query-client";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import { RootStackParamList } from "@/navigation/RootStackNavigator";

type Props = NativeStackScreenProps<RootStackParamList, "PhoneNumbers">;

interface AvailableNumber {
  phoneNumber: string;
  friendlyName: string;
  locality: string;
  region: string;
}

interface PhoneNumber {
  id: string;
  businessId: string;
  agentId: string | null;
  phoneNumber: string;
  twilioSid: string;
  isActive: boolean;
}

interface Agent {
  id: string;
  name: string;
}

export function PhoneNumberScreen({ navigation }: Props) {
  const { theme } = useTheme();
  const headerHeight = useHeaderHeight();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const { business } = useBusiness();
  const [areaCode, setAreaCode] = useState("");
  const [existingNumber, setExistingNumber] = useState("");
  const [searchResults, setSearchResults] = useState<AvailableNumber[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedNumber, setSelectedNumber] = useState<PhoneNumber | null>(null);

  const businessId = business?.id || "demo-business";

  const { data: phoneNumbers = [], isLoading: isLoadingNumbers } = useQuery<PhoneNumber[]>({
    queryKey: [`/api/businesses/${businessId}/phone-numbers`],
  });

  const { data: agents = [] } = useQuery<Agent[]>({
    queryKey: [`/api/businesses/${businessId}/agents`],
  });

  const searchMutation = useMutation({
    mutationFn: async () => {
      setIsSearching(true);
      const url = new URL("/api/phone-provider/search-numbers", getApiUrl());
      if (areaCode) url.searchParams.set("areaCode", areaCode);
      const response = await fetch(url.toString());
      if (!response.ok) throw new Error("Search failed");
      return response.json();
    },
    onSuccess: (data) => {
      setSearchResults(data);
      setIsSearching(false);
    },
    onError: () => {
      setIsSearching(false);
      Alert.alert("Error", "Failed to search for phone numbers. Please check your phone provider configuration.");
    },
  });

  const purchaseMutation = useMutation({
    mutationFn: async (phoneNumber: string) => {
      const response = await apiRequest("POST", `/api/businesses/${businessId}/phone-numbers/purchase`, { phoneNumber });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/businesses/${businessId}/phone-numbers`] });
      setSearchResults([]);
      Alert.alert("Success", "Phone number purchased successfully!");
    },
    onError: (error: any) => {
      Alert.alert("Error", error.message || "Failed to purchase phone number");
    },
  });

  const addExistingMutation = useMutation({
    mutationFn: async (phoneNumber: string) => {
      const response = await apiRequest("POST", `/api/businesses/${businessId}/phone-numbers/add-existing`, { phoneNumber });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/businesses/${businessId}/phone-numbers`] });
      setExistingNumber("");
      Alert.alert("Success", "Phone number added! You can now assign it to an agent.");
    },
    onError: (error: any) => {
      Alert.alert("Error", error.message || "Failed to add phone number");
    },
  });

  const handleAddExisting = () => {
    if (!existingNumber.trim()) {
      Alert.alert("Error", "Please enter a phone number");
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    addExistingMutation.mutate(existingNumber);
  };

  const assignMutation = useMutation({
    mutationFn: async ({ phoneNumberId, agentId }: { phoneNumberId: string; agentId: string | null }) => {
      const response = await apiRequest("PUT", `/api/phone-numbers/${phoneNumberId}/assign`, { agentId });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/businesses/${businessId}/phone-numbers`] });
      setSelectedNumber(null);
      Alert.alert("Success", "Phone number assigned successfully!");
    },
    onError: () => {
      Alert.alert("Error", "Failed to assign phone number");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (phoneNumberId: string) => {
      await apiRequest("DELETE", `/api/phone-numbers/${phoneNumberId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/businesses/${businessId}/phone-numbers`] });
      Alert.alert("Success", "Phone number removed successfully");
    },
    onError: () => {
      Alert.alert("Error", "Failed to remove phone number");
    },
  });

  const handleDelete = (number: PhoneNumber) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      "Remove Number",
      `Are you sure you want to remove ${number.phoneNumber}?`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Remove", 
          style: "destructive",
          onPress: () => deleteMutation.mutate(number.id) 
        },
      ]
    );
  };

  const handleSearch = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    searchMutation.mutate();
  };

  const handlePurchase = (phoneNumber: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      "Purchase Number",
      `Are you sure you want to purchase ${phoneNumber}? Standard rates apply.`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Purchase", onPress: () => purchaseMutation.mutate(phoneNumber) },
      ]
    );
  };

  const handleAssign = (number: PhoneNumber) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedNumber(number);
  };

  const getAssignedAgentName = (agentId: string | null) => {
    if (!agentId) return "Unassigned";
    const agent = agents.find((a) => a.id === agentId);
    return agent?.name || "Unknown Agent";
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.backgroundRoot,
    },
    content: {
      paddingTop: headerHeight + Spacing.md,
      paddingHorizontal: Spacing.lg,
      paddingBottom: insets.bottom + Spacing.xl,
    },
    section: {
      marginBottom: Spacing.xl,
    },
    sectionTitle: {
      marginBottom: Spacing.md,
    },
    searchRow: {
      flexDirection: "row",
      gap: Spacing.md,
      marginBottom: Spacing.lg,
    },
    input: {
      flex: 1,
      backgroundColor: theme.backgroundSecondary,
      borderRadius: BorderRadius.lg,
      padding: Spacing.md,
      color: theme.text,
      fontSize: 16,
    },
    searchButton: {
      backgroundColor: theme.primary,
      paddingHorizontal: Spacing.lg,
      borderRadius: BorderRadius.lg,
      alignItems: "center",
      justifyContent: "center",
    },
    numberCard: {
      marginBottom: Spacing.md,
    },
    numberRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    numberInfo: {
      flex: 1,
    },
    numberText: {
      fontSize: 18,
      fontWeight: "600",
    },
    locationText: {
      color: theme.textSecondary,
      marginTop: 2,
    },
    actionButton: {
      backgroundColor: theme.primary,
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.sm,
      borderRadius: BorderRadius.lg,
    },
    assignButton: {
      backgroundColor: theme.success,
    },
    unassignButton: {
      backgroundColor: theme.warning,
    },
    emptyText: {
      color: theme.textSecondary,
      textAlign: "center",
      paddingVertical: Spacing.xl,
    },
    agentList: {
      marginTop: Spacing.md,
    },
    agentOption: {
      flexDirection: "row",
      alignItems: "center",
      padding: Spacing.md,
      backgroundColor: theme.backgroundSecondary,
      borderRadius: BorderRadius.md,
      marginBottom: Spacing.sm,
    },
    agentOptionText: {
      flex: 1,
      marginLeft: Spacing.md,
    },
    cancelButton: {
      padding: Spacing.md,
      alignItems: "center",
      marginTop: Spacing.md,
    },
  });

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.section}>
          <ThemedText type="h3" style={styles.sectionTitle}>
            Add Existing Number
          </ThemedText>
          <ThemedText type="body" style={{ color: theme.textSecondary, marginBottom: Spacing.md }}>
            Already have a phone number (including international like NZ +64)? Enter it below to link it to an agent.
          </ThemedText>
          <View style={styles.searchRow}>
            <TextInput
              style={styles.input}
              placeholder="+64 21 000 0000"
              placeholderTextColor={theme.textSecondary}
              value={existingNumber}
              onChangeText={setExistingNumber}
              keyboardType="phone-pad"
            />
            <Pressable
              style={[styles.searchButton, { backgroundColor: theme.success }]}
              onPress={handleAddExisting}
              disabled={addExistingMutation.isPending}
            >
              {addExistingMutation.isPending ? (
                <ActivityIndicator color={theme.text} />
              ) : (
                <Feather name="plus" size={20} color={theme.text} />
              )}
            </Pressable>
          </View>
        </View>

        <View style={styles.section}>
          <ThemedText type="h3" style={styles.sectionTitle}>
            Search Available Numbers
          </ThemedText>
          <View style={styles.searchRow}>
            <TextInput
              style={styles.input}
              placeholder="Area code (e.g., 415)"
              placeholderTextColor={theme.textSecondary}
              value={areaCode}
              onChangeText={setAreaCode}
              keyboardType="number-pad"
              maxLength={3}
            />
            <Pressable
              style={styles.searchButton}
              onPress={handleSearch}
              disabled={isSearching}
            >
              {isSearching ? (
                <ActivityIndicator color={theme.text} />
              ) : (
                <Feather name="search" size={20} color={theme.text} />
              )}
            </Pressable>
          </View>

          {searchResults.length > 0 && (
            <>
              <ThemedText type="body" style={{ marginBottom: Spacing.md, color: theme.textSecondary }}>
                {searchResults.length} numbers available
              </ThemedText>
              {searchResults.map((num) => (
                <GlassCard key={num.phoneNumber} style={styles.numberCard}>
                  <View style={styles.numberRow}>
                    <View style={styles.numberInfo}>
                      <ThemedText style={styles.numberText}>{num.friendlyName}</ThemedText>
                      <ThemedText style={styles.locationText}>
                        {num.locality}, {num.region}
                      </ThemedText>
                    </View>
                    <Pressable
                      style={styles.actionButton}
                      onPress={() => handlePurchase(num.phoneNumber)}
                      disabled={purchaseMutation.isPending}
                    >
                      {purchaseMutation.isPending ? (
                        <ActivityIndicator color={theme.text} size="small" />
                      ) : (
                        <ThemedText type="body" style={{ fontWeight: "600" }}>
                          Buy
                        </ThemedText>
                      )}
                    </Pressable>
                  </View>
                </GlassCard>
              ))}
            </>
          )}
        </View>

        <View style={styles.section}>
          <ThemedText type="h3" style={styles.sectionTitle}>
            Your Phone Numbers
          </ThemedText>

          {isLoadingNumbers ? (
            <ActivityIndicator color={theme.primary} />
          ) : phoneNumbers.length === 0 ? (
            <ThemedText style={styles.emptyText}>
              No phone numbers yet. Search and purchase one above.
            </ThemedText>
          ) : (
            phoneNumbers.map((num) => (
              <GlassCard key={num.id} style={styles.numberCard}>
                <View style={styles.numberRow}>
                  <View style={styles.numberInfo}>
                    <ThemedText style={styles.numberText}>{num.phoneNumber}</ThemedText>
                    <ThemedText style={styles.locationText}>
                      {getAssignedAgentName(num.agentId)}
                    </ThemedText>
                  </View>
                  <View style={{ flexDirection: "row", gap: Spacing.sm }}>
                    {!num.agentId && (
                      <Pressable
                        style={[styles.actionButton, { backgroundColor: theme.error + "20" }]}
                        onPress={() => handleDelete(num)}
                        disabled={deleteMutation.isPending}
                      >
                        {deleteMutation.isPending ? (
                          <ActivityIndicator color={theme.error} size="small" />
                        ) : (
                          <Feather name="trash-2" size={18} color={theme.error} />
                        )}
                      </Pressable>
                    )}
                    <Pressable
                      style={[
                        styles.actionButton,
                        num.agentId ? styles.unassignButton : styles.assignButton,
                      ]}
                      onPress={() => handleAssign(num)}
                    >
                      <ThemedText type="body" style={{ fontWeight: "600" }}>
                        {num.agentId ? "Change" : "Assign"}
                      </ThemedText>
                    </Pressable>
                  </View>
                </View>

                {selectedNumber?.id === num.id && (
                  <View style={styles.agentList}>
                    <ThemedText type="body" style={{ marginBottom: Spacing.sm }}>
                      Select an agent:
                    </ThemedText>
                    {agents.map((agent) => (
                      <Pressable
                        key={agent.id}
                        style={styles.agentOption}
                        onPress={() => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          assignMutation.mutate({ phoneNumberId: num.id, agentId: agent.id });
                        }}
                      >
                        <Feather
                          name={num.agentId === agent.id ? "check-circle" : "circle"}
                          size={20}
                          color={num.agentId === agent.id ? theme.success : theme.textSecondary}
                        />
                        <ThemedText style={styles.agentOptionText}>{agent.name}</ThemedText>
                      </Pressable>
                    ))}
                    {num.agentId && (
                      <Pressable
                        style={styles.agentOption}
                        onPress={() => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          assignMutation.mutate({ phoneNumberId: num.id, agentId: null });
                        }}
                      >
                        <Feather name="x-circle" size={20} color={theme.error} />
                        <ThemedText style={styles.agentOptionText}>Unassign</ThemedText>
                      </Pressable>
                    )}
                    <Pressable style={styles.cancelButton} onPress={() => setSelectedNumber(null)}>
                      <ThemedText style={{ color: theme.textSecondary }}>Cancel</ThemedText>
                    </Pressable>
                  </View>
                )}
              </GlassCard>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}
