import { createContext, ReactNode, useContext, useEffect } from "react";
import {
  useQuery,
  useMutation,
  UseMutationResult,
} from "@tanstack/react-query";
import { insertUserSchema, User as SelectUser, InsertUser } from "@shared/schema";
import { getQueryFn, apiRequest, queryClient } from "../lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

type AuthContextType = {
  user: SelectUser | null;
  isLoading: boolean;
  error: Error | null;
  loginMutation: UseMutationResult<SelectUser, Error, LoginData>;
  logoutMutation: UseMutationResult<void, Error, void>;
  registerMutation: UseMutationResult<SelectUser, Error, InsertUser>;
  quickLoginMutation: UseMutationResult<SelectUser, Error, { rememberToken: string }>;
};

type LoginData = Pick<InsertUser, "username" | "password">;

export const AuthContext = createContext<AuthContextType | null>(null);
export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const {
    data: user,
    error,
    isLoading,
  } = useQuery<SelectUser | undefined, Error>({
    queryKey: ["/api/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginData) => {
      const res = await apiRequest("POST", "/api/login", credentials);
      return await res.json();
    },
    onSuccess: (user: SelectUser) => {
      queryClient.setQueryData(["/api/user"], user);
    },
    onError: (error: Error) => {
      toast({
        title: "Login failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (credentials: InsertUser) => {
      const res = await apiRequest("POST", "/api/register", credentials);
      return await res.json();
    },
    onSuccess: (user: SelectUser) => {
      queryClient.setQueryData(["/api/user"], user);
    },
    onError: (error: Error) => {
      toast({
        title: "Registration failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const quickLoginMutation = useMutation({
    mutationFn: async ({ rememberToken }: { rememberToken: string }) => {
      const res = await apiRequest("POST", "/api/quick-login", { rememberToken });
      return await res.json();
    },
    onSuccess: (user: SelectUser) => {
      queryClient.setQueryData(["/api/user"], user);
    },
    onError: (error: Error) => {
      // Silently fail for quick login to avoid showing unnecessary error messages
      console.warn("Quick login failed:", error.message);
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/logout");
      return await res.json();
    },
    onSuccess: (response) => {
      // Clear user session
      queryClient.setQueryData(["/api/user"], null);
      // Clear admin session and flag
      queryClient.setQueryData(["/api/admin/status"], { isAdmin: false });
      localStorage.removeItem("adminSession");
      // Clear saved logins when user logs out
      localStorage.removeItem("sportsapp_logins");
      // Clear all cache to ensure fresh state
      queryClient.clear();
      // Always redirect to login page after logout
      setLocation("/login");
    },
    onError: (error: Error) => {
      toast({
        title: "Logout failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Attempt quick login on app initialization
  useEffect(() => {
    // Only attempt quick login if user is not already authenticated
    if (!user && !isLoading) {
      const savedLogins = localStorage.getItem("sportsapp_logins");
      if (savedLogins) {
        try {
          const logins = JSON.parse(savedLogins);
          // Try the first (most recent) saved login
          if (logins.length > 0 && logins[0].token) {
            quickLoginMutation.mutate({ rememberToken: logins[0].token });
          }
        } catch (error) {
          console.warn("Failed to parse saved logins for quick login:", error);
        }
      }
    }
  }, [user, isLoading, quickLoginMutation]);

  return (
    <AuthContext.Provider
      value={{
        user: user ?? null,
        isLoading,
        error,
        loginMutation,
        logoutMutation,
        registerMutation,
        quickLoginMutation,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
