import React, { createContext, useContext, useState, ReactNode } from "react";

type UserRole = "owner" | "agent" | "distributor" | null;
type BusinessType = "product" | "service" | null;

interface BusinessTarget {
  metric: "revenue" | "units";
  target: number;
  period: string;
  progress: number;
}

interface PersonalTarget {
  type: "sales" | "revenue";
  target: number;
  period: string;
  progress: number;
}

interface AuthState {
  isAuthenticated: boolean;
  role: UserRole;
  businessType: BusinessType;
  userName: string;
  businessName: string;
  isAuthorized: boolean;
  businessTarget: BusinessTarget | null;
  personalTarget: PersonalTarget | null;
  /** For agents: the businessId of the owner they are linked to. */
  linkedBusinessId: string | null;
  /** Stable id for the current user (used to key per-user mock data). */
  userId: string;
}

interface AuthContextType extends AuthState {
  loginAsOwner: (businessName: string, ownerName: string, businessType?: BusinessType) => void;
  loginAsAgent: (agentName: string, businessName: string, authorized?: boolean, businessType?: BusinessType) => void;
  loginAsDistributor: (businessName: string, ownerName: string) => void;
  setAuthorized: (authorized: boolean) => void;
  setBusinessTarget: (target: BusinessTarget | null) => void;
  setPersonalTarget: (target: PersonalTarget | null) => void;
  setBusinessType: (type: BusinessType) => void;
  setLinkedBusiness: (businessId: string | null, businessName?: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [auth, setAuth] = useState<AuthState>({
    isAuthenticated: false,
    role: null,
    businessType: null,
    userName: "",
    businessName: "",
    isAuthorized: false,
    businessTarget: null,
    personalTarget: null,
    linkedBusinessId: null,
    userId: "",
  });

  const loginAsOwner = (businessName: string, ownerName: string, businessType: BusinessType = "product") => {
    setAuth((prev) => ({ ...prev, isAuthenticated: true, role: "owner", businessType, userName: ownerName, businessName, isAuthorized: true, userId: `owner-${businessName}` }));
  };

  const loginAsAgent = (agentName: string, businessName: string, authorized = false, businessType: BusinessType = "product") => {
    setAuth((prev) => ({ ...prev, isAuthenticated: true, role: "agent", businessType, userName: agentName, businessName, isAuthorized: authorized, userId: `agent-${agentName}` }));
  };

  const loginAsDistributor = (businessName: string, ownerName: string) => {
    setAuth((prev) => ({ ...prev, isAuthenticated: true, role: "distributor", businessType: null, userName: ownerName, businessName, isAuthorized: true, userId: `distributor-${businessName}` }));
  };

  const setBusinessType = (type: BusinessType) => {
    setAuth((prev) => ({ ...prev, businessType: type }));
  };

  const setAuthorized = (authorized: boolean) => {
    setAuth((prev) => ({ ...prev, isAuthorized: authorized }));
  };

  const setBusinessTarget = (target: BusinessTarget | null) => {
    setAuth((prev) => ({ ...prev, businessTarget: target }));
  };

  const setPersonalTarget = (target: PersonalTarget | null) => {
    setAuth((prev) => ({ ...prev, personalTarget: target }));
  };

  const setLinkedBusiness = (businessId: string | null, businessName?: string) => {
    setAuth((prev) => ({
      ...prev,
      linkedBusinessId: businessId,
      businessName: businessName ?? prev.businessName,
    }));
  };

  const logout = () => {
    setAuth({ isAuthenticated: false, role: null, businessType: null, userName: "", businessName: "", isAuthorized: false, businessTarget: null, personalTarget: null, linkedBusinessId: null, userId: "" });
  };

  return (
    <AuthContext.Provider value={{ ...auth, loginAsOwner, loginAsAgent, loginAsDistributor, setAuthorized, setBusinessTarget, setPersonalTarget, setBusinessType, setLinkedBusiness, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
