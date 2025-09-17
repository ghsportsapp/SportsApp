import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useAdminAuth } from "@/hooks/use-admin-auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Loader2, Play, Check, X, Eye, Filter, Search, ArrowLeft } from "lucide-react";
import { Navbar } from "@/components/navbar";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const SPORTS = ["Cricket", "Football", "Hockey", "Badminton", "Kabaddi", "Athletics", "Tennis"];

interface User {
  id: number;
  username: string;
  fullName: string;
  points: number;
}

interface Drill {
  id: number;
  sport: string;
  drillNumber: number;
  title: string;
  description: string;
}

interface UserDrill {
  id: number;
  userId: number;
  drillId: number;
  videoUrl?: string;
  status: "not_submitted" | "under_review" | "accepted" | "rejected";
  submittedAt?: string;
  reviewedAt?: string;
  reviewedBy?: number;
  user: User;
  drill: Drill;
}

export default function DrillManagementPage() {
  const [, setLocation] = useLocation();
  const { isAdmin } = useAdminAuth();
  const { toast } = useToast();
  const [selectedSport, setSelectedSport] = useState<string>("");
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [usernameFilter, setUsernameFilter] = useState<string>("");
  const [selectedDrill, setSelectedDrill] = useState<UserDrill | null>(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);

  const { 
    data: drills = [], 
    isLoading: isLoadingDrills,
    refetch: refetchDrills 
  } = useQuery({
    queryKey: ["/api/admin/drills", selectedSport, selectedStatus, usernameFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedSport && selectedSport !== "all") params.append("sport", selectedSport);
      if (selectedStatus && selectedStatus !== "all") params.append("status", selectedStatus);
      if (usernameFilter) params.append("username", usernameFilter);
      
      const response = await apiRequest("GET", `/api/admin/drills?${params.toString()}`);
      return await response.json();
    },
    enabled: !!isAdmin,
    refetchInterval: 2000, // Auto-refresh every 2 seconds for real-time updates
  });

  // Auto-refresh when drill actions are taken
  useEffect(() => {
    if (isAdmin) {
      const interval = setInterval(() => {
        refetchDrills();
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [isAdmin, refetchDrills]);

  const approveDrillMutation = useMutation({
    mutationFn: async (userDrillId: number) => {
      return apiRequest("POST", `/api/admin/drills/${userDrillId}/approve`);
    },
    onSuccess: (response, userDrillId) => {
      // Invalidate drill management queries
      queryClient.invalidateQueries({ queryKey: ["/api/admin/drills"] });
      
      // Invalidate user profile queries to update points immediately
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      
      // Invalidate current user session data
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      
      // Invalidate drill page queries for real-time status updates
      queryClient.invalidateQueries({ queryKey: ["/api/drills"] });
      
      // Invalidate notification queries
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      
      setViewModalOpen(false);
      toast({
        title: "Drill approved!",
        description: "The drill has been approved and the user has been awarded 10 points.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to approve drill",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    },
  });

  const rejectDrillMutation = useMutation({
    mutationFn: async (userDrillId: number) => {
      return apiRequest("POST", `/api/admin/drills/${userDrillId}/reject`);
    },
    onSuccess: (response, userDrillId) => {
      // Invalidate drill management queries
      queryClient.invalidateQueries({ queryKey: ["/api/admin/drills"] });
      
      // Invalidate user profile queries for real-time updates
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      
      // Invalidate current user session data
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      
      // Invalidate drill page queries for real-time status updates
      queryClient.invalidateQueries({ queryKey: ["/api/drills"] });
      
      // Invalidate notification queries
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      
      setViewModalOpen(false);
      toast({
        title: "Drill rejected",
        description: "The drill has been rejected and the user has been notified.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to reject drill",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    },
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "under_review":
        return <Badge variant="outline" className="text-yellow-600 border-yellow-600">Under Review</Badge>;
      case "accepted":
        return <Badge variant="default" className="bg-green-600 hover:bg-green-700">Accepted</Badge>;
      case "rejected":
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleString();
  };

  const clearFilters = () => {
    setSelectedSport("all");
    setSelectedStatus("all");
    setUsernameFilter("");
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto pt-20 pb-6 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex items-center">
          <Button
            variant="ghost"
            onClick={() => setLocation("/admin")}
            className="mr-4 p-2 text-gray-500 hover:text-gray-700"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Drill Management</h1>
            <p className="text-gray-600">
              Review and manage user-submitted drill videos
            </p>
          </div>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Filter className="h-5 w-5 mr-2" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sport</label>
                <Select value={selectedSport} onValueChange={setSelectedSport}>
                  <SelectTrigger>
                    <SelectValue placeholder="All sports" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All sports</SelectItem>
                    {SPORTS.map((sport) => (
                      <SelectItem key={sport} value={sport}>
                        {sport}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All statuses</SelectItem>
                    <SelectItem value="under_review">Under Review</SelectItem>
                    <SelectItem value="accepted">Accepted</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                <Input
                  value={usernameFilter}
                  onChange={(e) => setUsernameFilter(e.target.value)}
                  placeholder="Search by username"
                  className="w-full"
                />
              </div>

              <div className="flex items-end">
                <Button variant="outline" onClick={clearFilters} className="w-full">
                  Clear Filters
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Drills List */}
        {isLoadingDrills ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        ) : (
          <div className="space-y-4">
            {drills.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-gray-500">No drills found matching your filters.</p>
                </CardContent>
              </Card>
            ) : (
              drills.map((userDrill: UserDrill) => (
                <Card key={userDrill.id} className="overflow-hidden">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {userDrill.drill.title}
                          </h3>
                          {getStatusBadge(userDrill.status)}
                        </div>
                        <p className="text-gray-600 mb-2">{userDrill.drill.description}</p>
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <span>
                            <strong>User:</strong> {userDrill.user.username} ({userDrill.user.fullName})
                          </span>
                          <span>
                            <strong>Sport:</strong> {userDrill.drill.sport}
                          </span>
                          <span>
                            <strong>Points:</strong> {userDrill.user.points}
                          </span>
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                          <span>
                            <strong>Submitted:</strong> {formatDate(userDrill.submittedAt)}
                          </span>
                          {userDrill.reviewedAt && (
                            <span>
                              <strong>Reviewed:</strong> {formatDate(userDrill.reviewedAt)}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2 ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedDrill(userDrill);
                            setViewModalOpen(true);
                          }}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                        
                        {userDrill.status === "under_review" && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => approveDrillMutation.mutate(userDrill.id)}
                              disabled={approveDrillMutation.isPending}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <Check className="h-4 w-4 mr-1" />
                              Approve
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => rejectDrillMutation.mutate(userDrill.id)}
                              disabled={rejectDrillMutation.isPending}
                            >
                              <X className="h-4 w-4 mr-1" />
                              Reject
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}

        {/* View Drill Modal */}
        <Dialog open={viewModalOpen} onOpenChange={setViewModalOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {selectedDrill?.drill.title}
              </DialogTitle>
              <DialogDescription>
                Submitted by {selectedDrill?.user.username} ({selectedDrill?.user.fullName})
              </DialogDescription>
            </DialogHeader>
            
            {selectedDrill && (
              <div className="space-y-4">
                {/* Video */}
                {selectedDrill.videoUrl && (
                  <div>
                    <video
                      src={selectedDrill.videoUrl}
                      controls
                      autoPlay
                      className="w-full rounded-lg bg-black"
                      style={{ maxHeight: "400px" }}
                    />
                  </div>
                )}
                
                {/* Details */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <strong>Sport:</strong> {selectedDrill.drill.sport}
                  </div>
                  <div>
                    <strong>Status:</strong> {getStatusBadge(selectedDrill.status)}
                  </div>
                  <div>
                    <strong>User Points:</strong> {selectedDrill.user.points}
                  </div>
                  <div>
                    <strong>Submitted:</strong> {formatDate(selectedDrill.submittedAt)}
                  </div>
                  {selectedDrill.reviewedAt && (
                    <div className="col-span-2">
                      <strong>Reviewed:</strong> {formatDate(selectedDrill.reviewedAt)}
                    </div>
                  )}
                </div>
                
                <div>
                  <strong>Description:</strong>
                  <p className="text-gray-600 mt-1">{selectedDrill.drill.description}</p>
                </div>

                {/* Action Buttons */}
                {selectedDrill.status === "under_review" && (
                  <div className="flex justify-end space-x-2 pt-4 border-t">
                    <Button
                      onClick={() => rejectDrillMutation.mutate(selectedDrill.id)}
                      disabled={rejectDrillMutation.isPending}
                      variant="destructive"
                    >
                      {rejectDrillMutation.isPending ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Rejecting...
                        </>
                      ) : (
                        <>
                          <X className="h-4 w-4 mr-2" />
                          Reject
                        </>
                      )}
                    </Button>
                    <Button
                      onClick={() => approveDrillMutation.mutate(selectedDrill.id)}
                      disabled={approveDrillMutation.isPending}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      {approveDrillMutation.isPending ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Approving...
                        </>
                      ) : (
                        <>
                          <Check className="h-4 w-4 mr-2" />
                          Approve
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}