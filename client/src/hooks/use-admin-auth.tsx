import { createContext, ReactNode, useContext } from "react";
import { useQuery, useMutation, UseMutationResult } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

type AdminAuthContextType = {
  isAdmin: boolean | null;
  isLoading: boolean;
  error: Error | null;
  logoutMutation: UseMutationResult<void, Error, void>;
};

export const AdminAuthContext = createContext<AdminAuthContextType | null>(null);

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  
  const {
    data: adminStatus,
    error,
    isLoading,
  } = useQuery<{ isAdmin: boolean } | undefined, Error>({
    queryKey: ["/api/admin/status"],
    queryFn: async () => {
      try {
        const response = await apiRequest("GET", "/api/admin/status");
        if (response.status === 401) {
          localStorage.removeItem("adminSession");
          return { isAdmin: false };
        }
        const result = await response.json();
        
        // Set localStorage flag based on server response
        if (result.isAdmin) {
          localStorage.setItem("adminSession", "true");
        } else {
          localStorage.removeItem("adminSession");
        }
        
        return result;
      } catch (error) {
        localStorage.removeItem("adminSession");
        return { isAdmin: false };
      }
    },
    retry: false,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    staleTime: 0, // Always check server on mount
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/admin/logout");
    },
    onSuccess: () => {
      // Clear admin status immediately
      queryClient.setQueryData(["/api/admin/status"], { isAdmin: false });
      // Clear localStorage admin flag
      localStorage.removeItem("adminSession");
      // Clear all query cache
      queryClient.clear();
      toast({
        title: "Admin logged out",
        description: "Admin session has been terminated.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Logout failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <AdminAuthContext.Provider
      value={{
        isAdmin: adminStatus?.isAdmin ?? null,
        isLoading,
        error,
        logoutMutation,
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error("useAdminAuth must be used within an AdminAuthProvider");
  }
  return context;
}