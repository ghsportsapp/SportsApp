import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield, Loader2, Lock } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function AdminLoginPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  // Check if admin is already logged in and redirect
  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        const response = await apiRequest("GET", "/api/admin/status");
        const result = await response.json();
        if (result.isAdmin) {
          setLocation("/admin");
        }
      } catch (error) {
        // If error, user is not logged in, stay on login page
      }
    };
    checkAdminStatus();
  }, [setLocation]);

  const loginMutation = useMutation({
    mutationFn: async (credentials: { username: string; password: string }) => {
      const response = await apiRequest("POST", "/api/admin/login", credentials);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Invalid admin credentials");
      }
      return response.json();
    },
    onSuccess: () => {
      // Invalidate admin status query to refresh
      queryClient.invalidateQueries({ queryKey: ["/api/admin/status"] });
      toast({
        title: "Admin access granted",
        description: "Welcome to the admin dashboard.",
      });
      setLocation("/admin");
    },
    onError: (error: any) => {
      toast({
        title: "Access denied",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      toast({
        title: "Missing credentials",
        description: "Please enter both username and password.",
        variant: "destructive",
      });
      return;
    }
    loginMutation.mutate({ username: username.trim(), password });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-red-600 rounded-full flex items-center justify-center mb-4">
            <Shield className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Admin Portal</h1>
          <p className="text-gray-300">SportsApp Administration</p>
        </div>

        <Card className="bg-white/10 backdrop-blur-md border-white/20">
          <CardHeader className="text-center">
            <CardTitle className="text-white flex items-center justify-center gap-2">
              <Lock className="h-5 w-5" />
              Secure Access Required
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="username" className="text-gray-200">
                  Admin Username
                </Label>
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter admin username"
                  className="bg-white/10 border-white/30 text-white placeholder-gray-400"
                  disabled={loginMutation.isPending}
                />
              </div>
              
              <div>
                <Label htmlFor="password" className="text-gray-200">
                  Admin Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter admin password"
                  className="bg-white/10 border-white/30 text-white placeholder-gray-400"
                  disabled={loginMutation.isPending}
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-red-600 hover:bg-red-700 text-white"
                disabled={loginMutation.isPending}
              >
                {loginMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Authenticating...
                  </>
                ) : (
                  <>
                    <Shield className="mr-2 h-4 w-4" />
                    Access Admin Panel
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
              <p className="text-yellow-200 text-sm text-center">
                ⚠️ Authorized Personnel Only
              </p>
              <p className="text-gray-300 text-xs text-center mt-1">
                This area is restricted to system administrators
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}