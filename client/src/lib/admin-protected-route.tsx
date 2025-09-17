import { useEffect } from "react";
import { useAdminAuth } from "@/hooks/use-admin-auth";
import { Loader2, Shield, AlertTriangle } from "lucide-react";
import { Redirect, Route } from "wouter";

export function AdminProtectedRoute({
  path,
  children,
}: {
  path: string;
  children: React.ReactNode;
}) {
  const { isAdmin, isLoading } = useAdminAuth();
  
  // Only clear localStorage if definitively not authenticated (not during loading)
  useEffect(() => {
    if (!isLoading && isAdmin === false) {
      localStorage.removeItem("adminSession");
    }
  }, [isAdmin, isLoading]);

  if (isLoading) {
    return (
      <Route path={path}>
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-gray-600 mx-auto mb-4" />
            <p className="text-gray-600">Verifying admin credentials...</p>
          </div>
        </div>
      </Route>
    );
  }

  if (!isAdmin) {
    return (
      <Route path={path}>
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
          <div className="text-center max-w-md p-8">
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
            <p className="text-gray-600 mb-6">
              You don't have permission to access this admin area.
            </p>
            <div className="space-y-2">
              <a 
                href="/admin-login" 
                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                <Shield className="h-4 w-4" />
                Admin Login
              </a>
              <br />
              <a 
                href="/feed" 
                className="inline-flex items-center gap-2 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Back to Feed
              </a>
            </div>
          </div>
        </div>
      </Route>
    );
  }

  return (
    <Route path={path}>
      {children}
    </Route>
  );
}