import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useLocation } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  CheckCircle, 
  X, 
  Eye, 
  Clock,
  Shield,
  User,
  Mail,
  ArrowLeft
} from "lucide-react";
import { Navbar } from "@/components/navbar";

interface VerificationRequest {
  id: number;
  fullName: string;
  username: string;
  email: string;
  verificationStatus: string;
  verificationRequestDate: string;
  postsCount: number;
}

export default function VerificationManagementPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // Fetch pending verification requests with real-time updates
  const { data: verificationRequests = [], isLoading } = useQuery<VerificationRequest[]>({
    queryKey: ["/api/admin/verification-requests"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/admin/verification-requests");
      return await response.json();
    },
    refetchInterval: 2000, // Auto-refresh every 2 seconds for real-time updates
  });

  // Verify user mutation
  const verifyUserMutation = useMutation({
    mutationFn: async (userId: number) => {
      const response = await apiRequest("POST", `/api/admin/verify-user/${userId}`);
      return await response.json();
    },
    onSuccess: (_, userId) => {
      // Invalidate verification requests list
      queryClient.invalidateQueries({ queryKey: ["/api/admin/verification-requests"] });
      // Invalidate user profile queries to update verification status immediately
      queryClient.invalidateQueries({ queryKey: ["/api/users", userId, "profile"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      // Invalidate any other user-related queries
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      
      toast({
        title: "User verified",
        description: "User has been successfully verified.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Verification failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Reject user mutation
  const rejectUserMutation = useMutation({
    mutationFn: async (userId: number) => {
      const response = await apiRequest("POST", `/api/admin/reject-user/${userId}`);
      return await response.json();
    },
    onSuccess: (_, userId) => {
      // Invalidate verification requests list
      queryClient.invalidateQueries({ queryKey: ["/api/admin/verification-requests"] });
      // Invalidate user profile queries to update verification status immediately
      queryClient.invalidateQueries({ queryKey: ["/api/users", userId, "profile"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      // Invalidate any other user-related queries
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      
      toast({
        title: "User verification rejected",
        description: "User verification has been rejected.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Rejection failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleVerify = (userId: number) => {
    verifyUserMutation.mutate(userId);
  };

  const handleReject = (userId: number) => {
    rejectUserMutation.mutate(userId);
  };

  const handleViewProfile = (userId: number) => {
    setLocation(`/profile/${userId}`);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto pt-20 pb-6 px-4 sm:px-6 lg:px-8">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Button
                variant="ghost"
                onClick={() => setLocation("/admin")}
                className="mr-4 p-2 text-gray-500 hover:text-gray-700"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <h2 className="text-2xl font-bold text-gray-900">Verification Management</h2>
            </div>
        <Badge variant="secondary" className="bg-blue-100 text-blue-800">
          {verificationRequests.length} Pending
        </Badge>
      </div>

      {verificationRequests.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Shield className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Pending Requests</h3>
            <p className="text-gray-600">
              All verification requests have been processed.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {verificationRequests.map((request) => (
            <Card key={request.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    {/* User Avatar */}
                    <Avatar className="h-12 w-12">
                      <AvatarFallback>
                        {request.fullName.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>

                    {/* User Info */}
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-900">{request.fullName}</h3>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <User className="h-4 w-4" />
                          @{request.username}
                        </div>
                        <div className="flex items-center gap-1">
                          <Mail className="h-4 w-4" />
                          {request.email}
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span>{request.postsCount} posts</span>
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          Requested {new Date(request.verificationRequestDate).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewProfile(request.id)}
                      className="flex items-center gap-1"
                    >
                      <Eye className="h-4 w-4" />
                      View Profile
                    </Button>
                    
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => handleVerify(request.id)}
                      disabled={verifyUserMutation.isPending}
                      className="bg-green-600 hover:bg-green-700 flex items-center gap-1"
                    >
                      <CheckCircle className="h-4 w-4" />
                      Verify
                    </Button>
                    
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleReject(request.id)}
                      disabled={rejectUserMutation.isPending}
                      className="flex items-center gap-1"
                    >
                      <X className="h-4 w-4" />
                      Reject
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
        </div>
      </div>
    </div>
  );
}