import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useAdminAuth } from "@/hooks/use-admin-auth";
import { Navbar } from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { CalendarDays, Clock, MapPin, Users, Plus, CheckCircle, XCircle, Clock4, Trophy, Trash2, Eye, ArrowLeft } from "lucide-react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

interface Tryout {
  id: number;
  name: string;
  description: string;
  location: string;
  date: string;
  eligibility: string;
  timing: string;
  venue: string;
  highlights: string;
  createdAt: string;
}

interface TryoutApplication {
  id: number;
  userId: number;
  tryoutId: number;
  fullName: string;
  contactNumber: string;
  email: string;
  videoUrl: string;
  status: "under_review" | "approved" | "rejected";
  appliedAt: string;
  user: {
    id: number;
    fullName: string;
    username: string;
    email: string;
  };
  tryout: Tryout;
}

const createTryoutSchema = z.object({
  name: z.string().min(5, "Name must be at least 5 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  location: z.string().min(3, "Location is required"),
  date: z.string().min(1, "Date is required"),
  eligibility: z.string().min(5, "Eligibility criteria is required"),
  timing: z.string().min(5, "Timing is required"),
  venue: z.string().min(5, "Venue is required"),
  highlights: z.string().min(10, "Highlights are required"),
});

type CreateTryoutFormData = z.infer<typeof createTryoutSchema>;

export default function TryoutManagementPage() {
  const [, setLocation] = useLocation();
  const { isAdmin } = useAdminAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<TryoutApplication | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Fetch all tryouts
  const { data: tryouts = [], refetch: refetchTryouts } = useQuery({
    queryKey: ["/api/tryouts"],
    enabled: !!isAdmin,
  });

  // Fetch tryout applications with real-time polling
  const { data: applications = [], refetch: refetchApplications } = useQuery({
    queryKey: ["/api/admin/tryout-applications", statusFilter === "all" ? undefined : statusFilter],
    enabled: !!isAdmin,
    refetchInterval: 2000, // Poll every 2 seconds for real-time updates
    refetchIntervalInBackground: true, // Continue polling even when tab is not active
  });

  // Create tryout mutation
  const createTryoutMutation = useMutation({
    mutationFn: async (data: CreateTryoutFormData) => {
      const response = await apiRequest("POST", "/api/tryouts", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success!",
        description: "Tryout created successfully",
      });
      setIsCreateDialogOpen(false);
      refetchTryouts();
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    },
  });

  // Delete tryout mutation
  const deleteTryoutMutation = useMutation({
    mutationFn: async (tryoutId: number) => {
      await apiRequest("DELETE", `/api/tryouts/${tryoutId}`);
    },
    onSuccess: () => {
      toast({
        title: "Success!",
        description: "Tryout deleted successfully",
      });
      refetchTryouts();
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    },
  });

  // Update application status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ applicationId, status }: { applicationId: number; status: string }) => {
      await apiRequest("PATCH", `/api/admin/tryout-applications/${applicationId}/status`, { status });
    },
    onSuccess: () => {
      toast({
        title: "Success!",
        description: "Application status updated successfully",
      });
      // Force immediate refresh of applications
      refetchApplications();
      // Invalidate all related queries to ensure real-time sync
      queryClient.invalidateQueries({ queryKey: ["/api/admin/tryout-applications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/tryout-applications"] });
      setIsViewDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    },
  });

  const form = useForm<CreateTryoutFormData>({
    resolver: zodResolver(createTryoutSchema),
    defaultValues: {
      name: "",
      description: "",
      location: "",
      date: "",
      eligibility: "",
      timing: "",
      venue: "",
      highlights: "",
    },
  });

  const onSubmit = (data: CreateTryoutFormData) => {
    createTryoutMutation.mutate(data);
  };

  const handleDeleteTryout = (tryoutId: number) => {
    if (confirm("Are you sure you want to delete this tryout? This action cannot be undone.")) {
      deleteTryoutMutation.mutate(tryoutId);
    }
  };

  const handleViewApplication = (application: TryoutApplication) => {
    setSelectedApplication(application);
    setIsViewDialogOpen(true);
  };

  const handleUpdateStatus = (status: string) => {
    if (selectedApplication) {
      updateStatusMutation.mutate({
        applicationId: selectedApplication.id,
        status,
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-4 h-4 mr-1" />Approved</Badge>;
      case "rejected":
        return <Badge className="bg-red-100 text-red-800"><XCircle className="w-4 h-4 mr-1" />Rejected</Badge>;
      default:
        return <Badge className="bg-yellow-100 text-yellow-800"><Clock4 className="w-4 h-4 mr-1" />Under Review</Badge>;
    }
  };

  const filteredApplications = statusFilter === "all" 
    ? (applications as TryoutApplication[])
    : (applications as TryoutApplication[]).filter((app: TryoutApplication) => app.status === statusFilter);

  if (!isAdmin) {
    return <div>Access denied</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto pt-20 pb-6 px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-center">
          <Button
            variant="ghost"
            onClick={() => setLocation("/admin")}
            className="mr-4 p-2 text-gray-500 hover:text-gray-700"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Tryout Management</h1>
            <p className="text-gray-600 mt-2">Manage tryouts and review applications</p>
          </div>
        </div>

        <Tabs defaultValue="tryouts" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="tryouts">Manage Tryouts</TabsTrigger>
            <TabsTrigger value="applications">Review Applications</TabsTrigger>
          </TabsList>

          <TabsContent value="tryouts" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Active Tryouts</h2>
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Create New Tryout
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Create New Tryout</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="name">Tryout Name</Label>
                        <Input
                          id="name"
                          {...form.register("name")}
                          placeholder="e.g., Football Academy Tryouts"
                        />
                        {form.formState.errors.name && (
                          <p className="text-sm text-red-600 mt-1">{form.formState.errors.name.message}</p>
                        )}
                      </div>
                      <div>
                        <Label htmlFor="location">Location</Label>
                        <Input
                          id="location"
                          {...form.register("location")}
                          placeholder="e.g., Mumbai, Maharashtra"
                        />
                        {form.formState.errors.location && (
                          <p className="text-sm text-red-600 mt-1">{form.formState.errors.location.message}</p>
                        )}
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        {...form.register("description")}
                        placeholder="Describe the tryout, requirements, and what participants can expect"
                        rows={3}
                      />
                      {form.formState.errors.description && (
                        <p className="text-sm text-red-600 mt-1">{form.formState.errors.description.message}</p>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="date">Date</Label>
                        <Input
                          id="date"
                          {...form.register("date")}
                          placeholder="e.g., 15th August 2025"
                        />
                        {form.formState.errors.date && (
                          <p className="text-sm text-red-600 mt-1">{form.formState.errors.date.message}</p>
                        )}
                      </div>
                      <div>
                        <Label htmlFor="timing">Timing</Label>
                        <Input
                          id="timing"
                          {...form.register("timing")}
                          placeholder="e.g., 9:00 AM - 1:00 PM"
                        />
                        {form.formState.errors.timing && (
                          <p className="text-sm text-red-600 mt-1">{form.formState.errors.timing.message}</p>
                        )}
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="venue">Venue</Label>
                      <Input
                        id="venue"
                        {...form.register("venue")}
                        placeholder="e.g., Shivaji Sports Ground, Mumbai"
                      />
                      {form.formState.errors.venue && (
                        <p className="text-sm text-red-600 mt-1">{form.formState.errors.venue.message}</p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="eligibility">Eligibility Criteria</Label>
                      <Input
                        id="eligibility"
                        {...form.register("eligibility")}
                        placeholder="e.g., Age group 16-21 (boys & girls)"
                      />
                      {form.formState.errors.eligibility && (
                        <p className="text-sm text-red-600 mt-1">{form.formState.errors.eligibility.message}</p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="highlights">Highlights (comma-separated)</Label>
                      <Textarea
                        id="highlights"
                        {...form.register("highlights")}
                        placeholder="e.g., Professional coaching, Selection for state team, Training equipment provided"
                        rows={2}
                      />
                      {form.formState.errors.highlights && (
                        <p className="text-sm text-red-600 mt-1">{form.formState.errors.highlights.message}</p>
                      )}
                    </div>

                    <div className="flex justify-end space-x-2 pt-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsCreateDialogOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={createTryoutMutation.isPending}
                      >
                        {createTryoutMutation.isPending ? "Creating..." : "Create Tryout"}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {(tryouts as Tryout[]).map((tryout: Tryout) => (
                <Card key={tryout.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">{tryout.name}</CardTitle>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteTryout(tryout.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    <CardDescription className="text-sm line-clamp-2">
                      {tryout.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center text-gray-600">
                        <MapPin className="w-4 h-4 mr-2 shrink-0" />
                        <span className="truncate">{tryout.location}</span>
                      </div>
                      <div className="flex items-center text-gray-600">
                        <CalendarDays className="w-4 h-4 mr-2 shrink-0" />
                        <span>{tryout.date}</span>
                      </div>
                      <div className="flex items-center text-gray-600">
                        <Clock className="w-4 h-4 mr-2 shrink-0" />
                        <span>{tryout.timing}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="applications" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Tryout Applications</h2>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Applications</SelectItem>
                  <SelectItem value="under_review">Under Review</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredApplications.map((application: TryoutApplication) => (
                <Card key={application.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">{application.fullName}</CardTitle>
                      {getStatusBadge(application.status)}
                    </div>
                    <CardDescription className="text-sm">
                      Applied for: {application.tryout.name}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="font-medium">Username:</span> @{application.user.username}
                      </div>
                      <div>
                        <span className="font-medium">Contact:</span> {application.contactNumber}
                      </div>
                      <div>
                        <span className="font-medium">Email:</span> {application.email}
                      </div>
                      <div>
                        <span className="font-medium">Applied:</span> {new Date(application.appliedAt).toLocaleDateString()}
                      </div>
                    </div>

                    <Button 
                      className="w-full" 
                      onClick={() => handleViewApplication(application)}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      View Details
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {/* View Application Dialog */}
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Application Details</DialogTitle>
            </DialogHeader>
            {selectedApplication && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="font-medium">Applicant Name</Label>
                    <p className="text-sm">{selectedApplication.fullName}</p>
                  </div>
                  <div>
                    <Label className="font-medium">Username</Label>
                    <p className="text-sm">@{selectedApplication.user.username}</p>
                  </div>
                  <div>
                    <Label className="font-medium">Contact Number</Label>
                    <p className="text-sm">{selectedApplication.contactNumber}</p>
                  </div>
                  <div>
                    <Label className="font-medium">Email</Label>
                    <p className="text-sm">{selectedApplication.email}</p>
                  </div>
                </div>

                <div>
                  <Label className="font-medium">Tryout</Label>
                  <p className="text-sm">{selectedApplication.tryout.name}</p>
                  <p className="text-xs text-gray-600">{selectedApplication.tryout.location} • {selectedApplication.tryout.date}</p>
                </div>

                <div>
                  <Label className="font-medium">Application Status</Label>
                  <div className="mt-1">{getStatusBadge(selectedApplication.status)}</div>
                </div>

                <div>
                  <Label className="font-medium">Submitted Video</Label>
                  <div className="mt-2">
                    <video 
                      className="w-full max-h-64 rounded-lg border" 
                      controls
                      src={selectedApplication.videoUrl}
                    >
                      Your browser does not support the video tag.
                    </video>
                  </div>
                </div>

                {selectedApplication.status === "under_review" && (
                  <div className="flex space-x-2 pt-4">
                    <Button
                      className="flex-1 bg-green-600 hover:bg-green-700"
                      onClick={() => handleUpdateStatus("approved")}
                      disabled={updateStatusMutation.isPending}
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Approve
                    </Button>
                    <Button
                      variant="destructive"
                      className="flex-1"
                      onClick={() => handleUpdateStatus("rejected")}
                      disabled={updateStatusMutation.isPending}
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Reject
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