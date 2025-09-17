import { useState, useCallback, memo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useIsMobile } from "@/hooks/use-mobile";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { CalendarDays, Clock, MapPin, Users, Upload, CheckCircle, XCircle, Clock4 } from "lucide-react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { QUERY_CONFIGS } from "@/utils/performance";

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
  deleted?: boolean;
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
  tryout: Tryout;
}

const applicationSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  contactNumber: z.string().min(10, "Contact number must be at least 10 digits"),
  email: z.string().email("Please enter a valid email address"),
  video: z.any().refine((files) => files?.length > 0, "Video file is required"),
});

type ApplicationFormData = z.infer<typeof applicationSchema>;

export default function TryoutsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();
  const [selectedTryout, setSelectedTryout] = useState<Tryout | null>(null);
  const [isApplyDialogOpen, setIsApplyDialogOpen] = useState(false);

  // Fetch all tryouts
  const { data: tryouts = [], isLoading: tryoutsLoading } = useQuery({
    queryKey: ["/api/tryouts"],
  });

  // Fetch user applications with optimized polling
  const { data: userApplications = [], refetch: refetchApplications } = useQuery({
    queryKey: ["/api/user/tryout-applications"],
    enabled: !!user?.id,
    ...QUERY_CONFIGS.frequent, // Use optimized frequent data configuration
  });

  // Apply for tryout mutation
  const applyMutation = useMutation({
    mutationFn: async (data: { tryoutId: number; formData: FormData }) => {
      const response = await fetch(`/api/tryouts/${data.tryoutId}/apply`, {
        method: "POST",
        body: data.formData,
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to apply for tryout");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success!",
        description: "Your application has been submitted successfully",
      });
      setIsApplyDialogOpen(false);
      // Force immediate refresh and invalidate cache for real-time sync
      refetchApplications();
      queryClient.invalidateQueries({ queryKey: ["/api/user/tryout-applications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/tryout-applications"] });
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

  const form = useForm<ApplicationFormData>({
    resolver: zodResolver(applicationSchema),
    defaultValues: {
      fullName: "",
      contactNumber: "",
      email: "",
    },
  });

  const onSubmit = (data: ApplicationFormData) => {
    if (!selectedTryout) return;

    const formData = new FormData();
    formData.append("fullName", data.fullName);
    formData.append("contactNumber", data.contactNumber);
    formData.append("email", data.email);
    formData.append("video", data.video[0]);

    applyMutation.mutate({
      tryoutId: selectedTryout.id,
      formData,
    });
  };

  const handleApply = (tryout: Tryout) => {
    setSelectedTryout(tryout);
    setIsApplyDialogOpen(true);
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

  const renderHighlights = (highlights: string) => {
    return highlights.split(',').map((highlight, index) => (
      <span key={index} className="inline-block bg-blue-50 text-blue-700 px-2 py-1 rounded-md text-xs mr-1 mb-1">
        {highlight.trim()}
      </span>
    ));
  };

  // Filter available tryouts (not applied or rejected applications only, and not deleted)
  const availableTryouts = (tryouts as Tryout[]).filter((tryout: Tryout) => {
    // Exclude deleted tryouts from available tryouts
    if (tryout.deleted) return false;
    
    const application = (userApplications as TryoutApplication[]).find((app: TryoutApplication) => app.tryoutId === tryout.id);
    return !application || application.status === "rejected";
  });

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      <Navbar />
      <div className="main-content flex-1 max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className={`mb-8 ${isMobile ? 'mt-6' : 'mt-4'}`}>
          <h1 className="text-3xl font-bold text-gray-900">{t('tryouts.title')}</h1>
          <p className="text-gray-600 mt-2">Apply for sports tryouts and track your applications</p>
        </div>

        <Tabs defaultValue="apply" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 h-12 bg-gray-100 rounded-lg p-1 relative">
            <TabsTrigger 
              value="apply"
              className="relative rounded-md font-semibold transition-all duration-300 data-[state=active]:tab-gradient-active data-[state=inactive]:text-gray-600 data-[state=inactive]:hover:text-gray-800"
            >
{t('tryouts.applyTab')}
            </TabsTrigger>
            <TabsTrigger 
              value="applications"
              className="relative rounded-md font-semibold transition-all duration-300 data-[state=active]:tab-gradient-active data-[state=inactive]:text-gray-600 data-[state=inactive]:hover:text-gray-800"
            >
{t('tryouts.applicationsTab')}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="apply" className="space-y-6">
            {tryoutsLoading ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {[...Array(6)].map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardHeader>
                      <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="h-4 bg-gray-200 rounded"></div>
                        <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : availableTryouts.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center">
                  <p className="text-gray-500">No tryouts available at the moment</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {availableTryouts.map((tryout: Tryout) => (
                  <Card key={tryout.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <CardTitle className="text-lg">{tryout.name}</CardTitle>
                      <CardDescription className="text-sm line-clamp-2">
                        {tryout.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center text-gray-600">
                          <div className="w-4 h-4 mr-2 shrink-0 rounded-full" style={{
                            backgroundImage: 'linear-gradient(to right, #4B79A1 0%, #283E51 51%, #4B79A1 100%)'
                          }}>
                            <MapPin className="w-3 h-3 text-white m-0.5" />
                          </div>
                          <span className="truncate">{tryout.location}</span>
                        </div>
                        <div className="flex items-center text-gray-600">
                          <div className="w-4 h-4 mr-2 shrink-0 rounded-full" style={{
                            backgroundImage: 'linear-gradient(to right, #4B79A1 0%, #283E51 51%, #4B79A1 100%)'
                          }}>
                            <CalendarDays className="w-3 h-3 text-white m-0.5" />
                          </div>
                          <span>{tryout.date}</span>
                        </div>
                        <div className="flex items-center text-gray-600">
                          <div className="w-4 h-4 mr-2 shrink-0 rounded-full" style={{
                            backgroundImage: 'linear-gradient(to right, #4B79A1 0%, #283E51 51%, #4B79A1 100%)'
                          }}>
                            <Clock className="w-3 h-3 text-white m-0.5" />
                          </div>
                          <span>{tryout.timing}</span>
                        </div>
                        <div className="flex items-center text-gray-600">
                          <div className="w-4 h-4 mr-2 shrink-0 rounded-full" style={{
                            backgroundImage: 'linear-gradient(to right, #4B79A1 0%, #283E51 51%, #4B79A1 100%)'
                          }}>
                            <Users className="w-3 h-3 text-white m-0.5" />
                          </div>
                          <span className="truncate">{tryout.eligibility}</span>
                        </div>
                      </div>
                      
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-2">Venue:</p>
                        <p className="text-sm text-gray-600">{tryout.venue}</p>
                      </div>

                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-2">Highlights:</p>
                        <div className="flex flex-wrap gap-1">
                          {tryout.highlights.split(',').map((highlight, index) => (
                            <span key={index} className="inline-block text-black px-2 py-1 rounded-md text-xs mr-1 mb-1" style={{
                              backgroundColor: '#e8f2ff'
                            }}>
                              {highlight.trim()}
                            </span>
                          ))}
                        </div>
                      </div>

                      <Button 
                        className="w-full text-white font-semibold shadow-lg transform transition-all duration-200 hover:scale-[1.02]"
                        onClick={() => handleApply(tryout)}
                        disabled={applyMutation.isPending}
                        style={{
                          backgroundImage: 'linear-gradient(to right, #4B79A1 0%, #283E51 51%, #4B79A1 100%)',
                          backgroundSize: '200% auto',
                          transition: 'background-position 0.5s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundPosition = 'right center';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundPosition = 'left center';
                        }}
                      >
                        Apply
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="applications" className="space-y-6">
            {(userApplications as TryoutApplication[]).length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center">
                  <p className="text-gray-500">You haven't applied for any tryouts yet</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {(userApplications as TryoutApplication[]).map((application: TryoutApplication) => (
                  <Card key={application.id}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-lg">{application.tryout.name}</CardTitle>
                        <div className="whitespace-nowrap">
                          {getStatusBadge(application.status)}
                        </div>
                      </div>
                      <CardDescription className="text-sm">
                        Applied on {new Date(application.appliedAt).toLocaleDateString()}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center text-gray-600">
                          <div className="w-4 h-4 mr-2 shrink-0 rounded-full" style={{
                            backgroundImage: 'linear-gradient(to right, #4B79A1 0%, #283E51 51%, #4B79A1 100%)'
                          }}>
                            <CalendarDays className="w-3 h-3 text-white m-0.5" />
                          </div>
                          <span>{application.tryout.date}</span>
                        </div>
                        <div className="flex items-center text-gray-600">
                          <div className="w-4 h-4 mr-2 shrink-0 rounded-full" style={{
                            backgroundImage: 'linear-gradient(to right, #4B79A1 0%, #283E51 51%, #4B79A1 100%)'
                          }}>
                            <MapPin className="w-3 h-3 text-white m-0.5" />
                          </div>
                          <span className="truncate">{application.tryout.location}</span>
                        </div>
                      </div>

                      {application.status === "approved" && (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                          <p className="text-green-800 font-medium text-sm">🎉 Congratulations!</p>
                          <p className="text-green-700 text-sm mt-1">
                            You've been selected for this tryout. Check your email for further details.
                          </p>
                        </div>
                      )}

                      {application.tryout.deleted && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                          <p className="text-red-800 font-medium text-sm">⚠️ Tryout Deleted</p>
                          <p className="text-red-700 text-sm mt-1">
                            This tryout has been deleted by admin. You cannot re-apply for this tryout.
                          </p>
                        </div>
                      )}

                      {application.status === "rejected" && !application.tryout.deleted && (
                        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                          <p className="text-orange-800 font-medium text-sm">Try Again</p>
                          <p className="text-orange-700 text-sm mt-1 mb-2">
                            Upload a better video or try for another tryout.
                          </p>
                          <Button 
                            size="sm"
                            onClick={() => handleApply(application.tryout)}
                            className="text-white font-semibold shadow-lg transform transition-all duration-200 hover:scale-[1.02]"
                            style={{
                              backgroundImage: 'linear-gradient(to right, #4B79A1 0%, #283E51 51%, #4B79A1 100%)',
                              backgroundSize: '200% auto',
                              transition: 'background-position 0.5s ease'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundPosition = 'right center';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundPosition = 'left center';
                            }}
                          >
                            Re-apply
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Apply Dialog */}
        <Dialog open={isApplyDialogOpen} onOpenChange={setIsApplyDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Apply for {selectedTryout?.name}</DialogTitle>
              <DialogDescription>
                Fill out the form below to submit your application for this tryout.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-sm font-medium text-gray-700">Full Name</Label>
                <Input
                  id="fullName"
                  {...form.register("fullName")}
                  placeholder="Enter your full name"
                  className="mt-2"
                />
                {form.formState.errors.fullName && (
                  <p className="text-sm text-red-600 mt-1">{form.formState.errors.fullName.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="contactNumber" className="text-sm font-medium text-gray-700">Contact Number</Label>
                <Input
                  id="contactNumber"
                  {...form.register("contactNumber")}
                  placeholder="Enter your contact number"
                  className="mt-2"
                />
                {form.formState.errors.contactNumber && (
                  <p className="text-sm text-red-600 mt-1">{form.formState.errors.contactNumber.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-gray-700">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  {...form.register("email")}
                  placeholder="Enter your email address"
                  className="mt-2"
                />
                {form.formState.errors.email && (
                  <p className="text-sm text-red-600 mt-1">{form.formState.errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="video" className="text-sm font-medium text-gray-700">Upload Tryout Video</Label>
                <Input
                  id="video"
                  type="file"
                  accept="video/*"
                  {...form.register("video")}
                  className="mt-2"
                />
                {form.formState.errors.video && (
                  <p className="text-sm text-red-600 mt-1">{String(form.formState.errors.video.message)}</p>
                )}
              </div>

              <div className="flex justify-end space-x-2 pt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsApplyDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={applyMutation.isPending}
                  className="text-white font-semibold shadow-lg transform transition-all duration-200 hover:scale-[1.02]"
                  style={{
                    backgroundImage: 'linear-gradient(to right, #4B79A1 0%, #283E51 51%, #4B79A1 100%)',
                    backgroundSize: '200% auto',
                    transition: 'background-position 0.5s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundPosition = 'right center';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundPosition = 'left center';
                  }}
                >
                  {applyMutation.isPending ? "Submitting..." : "Submit Application"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Footer />
    </div>
  );
}