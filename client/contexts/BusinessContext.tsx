import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { apiRequest } from "@/lib/query-client";

export interface Business {
  id: string;
  name: string;
  slug: string;
  ownerToken: string;
  email: string | null;
  phone: string | null;
  website: string | null;
  subscriptionTier: string;
  aiCreditsRemaining: number;
  notificationsEnabled: boolean;
  metadata?: any;
  createdAt: string;
}

interface BusinessContextType {
  business: Business | null;
  isLoading: boolean;
  isOnboarded: boolean;
  createBusiness: (name: string, email?: string) => Promise<Business>;
  updateBusinessState: (updatedBusiness: Business) => void;
  logout: () => Promise<void>;
}

const BusinessContext = createContext<BusinessContextType | undefined>(undefined);

const BUSINESS_STORAGE_KEY = "@ai_employee_business";

export function BusinessProvider({ children }: { children: ReactNode }) {
  const [business, setBusiness] = useState<Business | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const updateBusinessState = (updatedBusiness: Business) => {
    setBusiness(updatedBusiness);
    AsyncStorage.setItem(BUSINESS_STORAGE_KEY, JSON.stringify(updatedBusiness));
  };

  useEffect(() => {
    loadSavedBusiness();
  }, []);

  const loadSavedBusiness = async () => {
    try {
      const savedBusiness = await AsyncStorage.getItem(BUSINESS_STORAGE_KEY);
      if (savedBusiness) {
        setBusiness(JSON.parse(savedBusiness));
      }
    } catch (error) {
      console.error("Failed to load saved business:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const createBusiness = async (name: string, email?: string): Promise<Business> => {
    const response = await apiRequest("POST", "/api/businesses", { name, email });
    const newBusiness = await response.json();
    setBusiness(newBusiness);
    await AsyncStorage.setItem(BUSINESS_STORAGE_KEY, JSON.stringify(newBusiness));
    return newBusiness;
  };

  const logout = async () => {
    await AsyncStorage.removeItem(BUSINESS_STORAGE_KEY);
    setBusiness(null);
  };

  return (
    <BusinessContext.Provider
      value={{
        business,
        isLoading,
        isOnboarded: !!business,
        createBusiness,
        updateBusinessState,
        logout,
      }}
    >
      {children}
    </BusinessContext.Provider>
  );
}

export function useBusiness() {
  const context = useContext(BusinessContext);
  if (context === undefined) {
    throw new Error("useBusiness must be used within a BusinessProvider");
  }
  return context;
}
