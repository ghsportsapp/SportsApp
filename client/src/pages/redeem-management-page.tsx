import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Navbar } from "@/components/navbar";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  ArrowLeft,
  Gift,
  CheckCircle,
  X,
  Clock,
  User,
  Mail,
  Calendar,
  AlertCircle
} from "lucide-react";

interface User {
  id: number;
  fullName: string;
  username: string;
  email: string;
  isVerified: boolean;
}

interface RedemptionRequest {
  id: number;
  pointsRedeemed: number;
  voucherAmount: number;
  status: string;
  email: string;
  createdAt: string;
  user: User;
}

export default function RedeemManagementPage() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [filter, setFilter] = useState<"all" | "under review" | "approved" | "rejected">("under review");

  // Fetch all redemption requests with optimizations
  const { data: redemptions = [], isLoading } = useQuery<RedemptionRequest[]>({
    queryKey: ["/api/admin/redemptions"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/admin/redemptions");
      return await response.json();
    },
    staleTime: 30000, // Consider data fresh for 30 seconds
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
    refetchOnWindowFocus: true,
    refetchInterval: 60000, // Auto-refetch every minute for real-time updates
  });

  // Update redemption status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ redemptionId, status }: { redemptionId: number; status: string }) => {
      const response = await apiRequest("PUT", `/api/admin/redemptions/${redemptionId}/status`, {
        status,
      });
      return await response.json();
    },
    onSuccess: (data, variables) => {
      // Invalidate admin redemption queries
      queryClient.invalidateQueries({ queryKey: ["/api/admin/redemptions"] });
      
      // Invalidate user redemption queries for real-time updates across the platform
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      
      // Find the redemption to get userId for targeted cache invalidation
      const redemption = redemptions.find(r => r.id === variables.redemptionId);
      if (redemption) {
        queryClient.invalidateQueries({ queryKey: ["/api/users", redemption.user.id, "redemptions"] });
        queryClient.invalidateQueries({ queryKey: ["/api/users/profile", redemption.user.id] });
      }
      
      toast({
        title: "Status updated successfully",
        description: "The redemption status has been updated.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleApprove = (redemptionId: number) => {
    updateStatusMutation.mutate({ redemptionId, status: "approved" });
  };

  const handleReject = (redemptionId: number) => {
    updateStatusMutation.mutate({ redemptionId, status: "rejected" });
  };

  const filteredRedemptions = redemptions.filter(redemption => 
    filter === "all" || redemption.status === filter
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-green-600";
      case "rejected":
        return "bg-red-600";
      case "under review":
        return "bg-orange-500";
      default:
        return "bg-gray-500";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "rejected":
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case "under review":
        return <Clock className="h-4 w-4 text-orange-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading redemption requests...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <main className="max-w-7xl mx-auto pt-20 pb-6 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button 
            variant="ghost" 
            onClick={() => setLocation("/admin")}
            className="p-2"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900">Redeem Management</h1>
            <p className="text-gray-600">Review and approve voucher redemption requests</p>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="mb-6 border-b border-gray-200">
          <div className="flex space-x-8">
            {["all", "under review", "approved", "rejected"].map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status as any)}
                className={`py-2 px-1 border-b-2 font-medium text-sm capitalize transition-colors ${
                  filter === status
                    ? "border-orange-500 text-orange-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                {status} ({redemptions.filter(r => status === "all" || r.status === status).length})
              </button>
            ))}
          </div>
        </div>

        {/* Redemption Requests List */}
        {filteredRedemptions.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Gift className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No redemption requests</h3>
              <p className="text-gray-600">
                {filter === "under review" 
                  ? "No pending redemption requests to review." 
                  : `No ${filter} redemption requests found.`
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredRedemptions.map((redemption) => (
              <Card key={redemption.id} className="overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-3">
                      {/* User Info */}
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                          <User className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-900">{redemption.user.fullName}</span>
                            {redemption.user.isVerified && (
                              <CheckCircle className="h-4 w-4 text-blue-500" />
                            )}
                          </div>
                          <div className="text-sm text-gray-600">@{redemption.user.username}</div>
                        </div>
                      </div>

                      {/* Redemption Details */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-gray-50 p-4 rounded-lg">
                        <div className="flex items-center gap-2">
                          <Gift className="h-4 w-4 text-orange-500" />
                          <div>
                            <div className="text-sm text-gray-600">Voucher Amount</div>
                            <div className="font-medium">₹{redemption.voucherAmount}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-blue-500" />
                          <div>
                            <div className="text-sm text-gray-600">Email</div>
                            <div className="font-medium">{redemption.email}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-green-500" />
                          <div>
                            <div className="text-sm text-gray-600">Requested</div>
                            <div className="font-medium">
                              {new Date(redemption.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">Points Redeemed:</span>
                        <span className="font-medium">{redemption.pointsRedeemed}</span>
                      </div>
                    </div>

                    {/* Status and Actions */}
                    <div className="flex flex-col items-end gap-3">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(redemption.status)}
                        <Badge 
                          className={`${getStatusColor(redemption.status)} text-white`}
                        >
                          {redemption.status}
                        </Badge>
                      </div>

                      <div className="flex gap-2 flex-wrap">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setLocation(`/profile/${redemption.user.id}`)}
                        >
                          <User className="h-4 w-4 mr-1" />
                          View Profile
                        </Button>
                        {redemption.status === "under review" && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => handleApprove(redemption.id)}
                              disabled={updateStatusMutation.isPending}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleReject(redemption.id)}
                              disabled={updateStatusMutation.isPending}
                            >
                              <X className="h-4 w-4 mr-1" />
                              Reject
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}