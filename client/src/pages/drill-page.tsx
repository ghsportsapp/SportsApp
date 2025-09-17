import { useState, useRef, useEffect, useCallback, memo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/use-auth";
import { useIsMobile } from "@/hooks/use-mobile";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Upload, Play, Check, X, AlertTriangle } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { QUERY_CONFIGS } from "@/utils/performance";

const SPORTS = ["Cricket", "Football", "Hockey", "Badminton", "Kabaddi", "Athletics", "Tennis"];

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
  drill: Drill;
}

export default function DrillPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const [selectedSport, setSelectedSport] = useState<string | null>(null);
  const [uploadingDrillId, setUploadingDrillId] = useState<number | null>(null);
  const fileInputRefs = useRef<{ [key: number]: HTMLInputElement | null }>({});

  // Check for sport in URL query parameters
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const sportParam = urlParams.get('sport');
    if (sportParam && SPORTS.includes(sportParam)) {
      setSelectedSport(sportParam);
    }
  }, []);

  const { 
    data: drills = [], 
    isLoading: isLoadingDrills,
    refetch: refetchDrills 
  } = useQuery({
    queryKey: ["/api/drills", selectedSport],
    queryFn: () => selectedSport ? apiRequest("GET", `/api/drills/${selectedSport}`).then(res => res.json()) : Promise.resolve([]),
    enabled: !!selectedSport,
    refetchInterval: () => document.hidden ? 30000 : 15000, // Smart polling based on visibility
    staleTime: 10000, // 10 seconds stale time
  });

  // Memoized mutation handlers for better performance
  const uploadVideoMutation = useMutation({
    mutationFn: async ({ drillId, file }: { drillId: number; file: File }) => {
      const formData = new FormData();
      formData.append('video', file);
      const response = await apiRequest("POST", `/api/drills/${drillId}/upload`, formData);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Upload failed");
      }
      return response.json();
    },
    onSuccess: () => {
      // Smart cache invalidation - only invalidate specific sport
      queryClient.invalidateQueries({ queryKey: ["/api/drills", selectedSport] });
      setUploadingDrillId(null);
      toast({
        title: "Video uploaded successfully!",
        description: "You can now submit this drill for review.",
      });
    },
    onError: (error: any) => {
      setUploadingDrillId(null);
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload video",
        variant: "destructive",
      });
    },
  });

  const submitDrillMutation = useMutation({
    mutationFn: async (drillId: number) => {
      const response = await apiRequest("POST", `/api/drills/${drillId}/submit`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Submission failed");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/drills", selectedSport] });
      toast({
        title: "Drill submitted!",
        description: "Your drill has been submitted for admin review.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Submission failed",
        description: error.message || "Failed to submit drill",
        variant: "destructive",
      });
    },
  });

  const handleVideoUpload = (drillId: number) => {
    const input = fileInputRefs.current[drillId];
    if (input) {
      input.click();
    }
  };

  const handleFileChange = (drillId: number, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('video/')) {
        toast({
          title: "Invalid file type",
          description: "Please select a video file (MP4, MOV, etc.)",
          variant: "destructive",
        });
        return;
      }

      // Validate file size (50MB max)
      if (file.size > 50 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please select a video file smaller than 50MB",
          variant: "destructive",
        });
        return;
      }

      setUploadingDrillId(drillId);
      uploadVideoMutation.mutate({ drillId, file });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "not_submitted":
        return <Badge variant="secondary">{t('drills.status.notSubmitted')}</Badge>;
      case "under_review":
        return <Badge variant="outline" className="text-yellow-600 border-yellow-600">{t('drills.status.underReview')}</Badge>;
      case "accepted":
        return <Badge variant="default" className="bg-green-600 hover:bg-green-700">{t('drills.status.accepted')}</Badge>;
      case "rejected":
        return <Badge variant="destructive">{t('drills.status.rejected')}</Badge>;
      default:
        return <Badge variant="secondary">{t('drills.status.unknown')}</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "under_review":
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case "accepted":
        return <Check className="h-4 w-4 text-green-600" />;
      case "rejected":
        return <X className="h-4 w-4 text-red-600" />;
      default:
        return null;
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      <Navbar />
      
      <main className="main-content flex-1 pt-8 pb-6">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Page Header */}
          <div className={`mb-8 ${isMobile ? 'mt-6' : 'mt-4'}`}>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('drills.pageTitle')}</h1>
            <p className="text-gray-600">
              {t('drills.pageDescription')}
            </p>
          </div>

          {/* Sports Selection / Drill List */}
          <div className="mb-8">
            {!selectedSport ? (
              <div className="animate-fadeIn">
                <h2 className={`text-xl font-semibold text-gray-900 mb-6 ${isMobile ? 'text-center' : ''}`}>{t('drills.selectSport')}</h2>
                <div className={`grid gap-4 ${isMobile ? 'grid-cols-2' : 'grid-cols-4'}`}>
                  {SPORTS.map((sport, index) => {
                const getSportConfig = (sport: string) => {
                  switch (sport) {
                    case 'Cricket':
                      return { 
                        bg: 'bg-gradient-to-br from-green-500 to-green-700', 
                        icon: '🏏🥎',
                        animation: 'cricket-hit'
                      };
                    case 'Football':
                      return { 
                        bg: 'bg-gradient-to-br from-blue-500 to-blue-700', 
                        icon: '⚽',
                        animation: 'football-spin'
                      };
                    case 'Tennis':
                      return { 
                        bg: 'bg-gradient-to-br from-yellow-500 to-orange-600', 
                        icon: '🎾🏓',
                        animation: 'tennis-bounce'
                      };
                    case 'Badminton':
                      return { 
                        bg: 'bg-gradient-to-br from-purple-500 to-purple-700', 
                        icon: '🏸🏸',
                        animation: 'badminton-shuttle'
                      };
                    case 'Hockey':
                      return { 
                        bg: 'bg-gradient-to-br from-red-500 to-red-700', 
                        icon: '🏑⚫',
                        animation: 'hockey-hit'
                      };
                    case 'Kabaddi':
                      return { 
                        bg: 'bg-gradient-to-br from-orange-500 to-red-600', 
                        icon: '🤼‍♂️',
                        animation: 'kabaddi-pulse'
                      };
                    case 'Athletics':
                      return { 
                        bg: 'bg-gradient-to-br from-indigo-500 to-indigo-700', 
                        icon: '🏃‍♂️👟',
                        animation: 'athletics-run'
                      };
                    default:
                      return { 
                        bg: 'bg-gradient-to-br from-gray-500 to-gray-700', 
                        icon: '🏃',
                        animation: 'animate-pulse'
                      };
                  }
                };

                const config = getSportConfig(sport);
                
                return (
                  <div
                    key={sport}
                    className={`
                      relative aspect-square rounded-xl cursor-pointer transform transition-all duration-300 hover:scale-105 hover:shadow-2xl
                      ${config.bg} ${selectedSport === sport ? 'ring-4 ring-white shadow-2xl scale-105' : 'shadow-lg'}
                      ${isMobile && index === 6 ? 'col-span-2 mx-auto max-w-[160px]' : ''}
                    `}
                    onClick={() => setSelectedSport(sport)}
                  >
                    <div className="absolute inset-0 bg-black/10 rounded-xl"></div>
                    <div className="relative z-10 h-full flex flex-col items-center justify-center p-4 text-center">
                      <div className={`text-4xl mb-4 ${config.animation}`} style={{ animationDuration: '2s', animationIterationCount: 'infinite' }}>
                        {config.icon}
                      </div>
                      <h3 className="text-white font-bold text-lg leading-tight drop-shadow-lg">
                        {t(`drills.sports.${sport.toLowerCase()}`)}
                      </h3>
                    </div>
                  </div>
                  );
                  })}
                </div>
              </div>
            ) : (
              <div className="animate-slideDown">
                {/* Back Button */}
                <button
                  onClick={() => setSelectedSport(null)}
                  className="flex items-center text-gray-600 hover:text-gray-900 mb-4 transition-colors duration-200"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  {t('drills.backToSports')}
                </button>
                
                {/* Drill List */}
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">
                    {t(`drills.sports.${selectedSport.toLowerCase()}`)} {t('drills.drillsLabel')}
                  </h2>
                  
                  {isLoadingDrills ? (
                    <div className="flex justify-center items-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {drills.map((userDrill: UserDrill) => (
                  <Card key={userDrill.drill.id} className="overflow-hidden">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg text-gray-900 mb-1">
                            {userDrill.drill.title}
                          </CardTitle>
                          <p className="text-gray-600 text-sm">
                            {userDrill.drill.description}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2 ml-4">
                          {getStatusIcon(userDrill.status)}
                          {getStatusBadge(userDrill.status)}
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="pt-0">
                      <div className="flex flex-col sm:flex-row gap-3">
                        {/* Video Preview/Upload */}
                        <div className="flex-1">
                          {userDrill.status === "under_review" || userDrill.status === "accepted" ? (
                            <div className="space-y-2">
                              {userDrill.status === "under_review" && (
                                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-center">
                                  <div className="flex items-center justify-center space-x-2">
                                    <AlertTriangle className="h-5 w-5 text-yellow-600" />
                                    <p className="text-yellow-800 text-sm font-medium">
                                      {t('drills.drillSubmittedForReview')}
                                    </p>
                                  </div>
                                </div>
                              )}
                              {userDrill.status === "accepted" && (
                                <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-center">
                                  <div className="flex items-center justify-center space-x-2">
                                    <Check className="h-5 w-5 text-green-600" />
                                    <p className="text-green-800 text-sm font-medium">
                                      {t('drills.drillAcceptedWellDone')}
                                    </p>
                                  </div>
                                </div>
                              )}
                            </div>
                          ) : userDrill.videoUrl ? (
                            <div className="space-y-2">
                              <video
                                src={userDrill.videoUrl}
                                controls
                                className="w-full h-32 rounded-lg bg-black object-cover"
                              />
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleVideoUpload(userDrill.drill.id)}
                                disabled={uploadingDrillId === userDrill.drill.id}
                                className="w-full"
                              >
                                {uploadingDrillId === userDrill.drill.id ? (
                                  <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    {t('drills.uploading')}
                                  </>
                                ) : (
                                  <>
                                    <Upload className="h-4 w-4 mr-2" />
                                    {t('drills.changeVideo')}
                                  </>
                                )}
                              </Button>
                            </div>
                          ) : (
                            <Button
                              variant="outline"
                              onClick={() => handleVideoUpload(userDrill.drill.id)}
                              disabled={uploadingDrillId === userDrill.drill.id}
                              className="w-full h-32 border-dashed"
                            >
                              {uploadingDrillId === userDrill.drill.id ? (
                                <>
                                  <Loader2 className="h-6 w-6 mr-2 animate-spin" />
                                  {t('drills.uploading')}
                                </>
                              ) : (
                                <>
                                  <Upload className="h-6 w-6 mr-2" />
                                  {t('drills.uploadVideo')}
                                </>
                              )}
                            </Button>
                          )}
                          
                          {/* Hidden file input */}
                          <input
                            ref={(el) => (fileInputRefs.current[userDrill.drill.id] = el)}
                            type="file"
                            accept="video/*"
                            onChange={(e) => handleFileChange(userDrill.drill.id, e)}
                            className="hidden"
                          />
                        </div>

                        {/* Submit Button - Hide for approved drills */}
                        {userDrill.status !== "accepted" && (
                          <div className="flex items-end">
                            <Button
                              onClick={() => submitDrillMutation.mutate(userDrill.drill.id)}
                              disabled={
                                !userDrill.videoUrl || 
                                userDrill.status === "under_review" || 
                                submitDrillMutation.isPending
                              }
                              className={`text-white font-semibold shadow-lg transform transition-all duration-200 hover:scale-[1.02] ${isMobile ? 'w-full h-10' : ''}`}
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
                            {submitDrillMutation.isPending ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                {t('drills.submitting')}
                              </>
                            ) : (
                              t('drills.submitDrill')
                            )}
                            </Button>
                          </div>
                        )}
                      </div>

                      {/* Rejection Message */}
                      {userDrill.status === "rejected" && (
                        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                          <p className="text-red-800 text-sm">
                            {t('drills.rejectedMessage')}
                          </p>
                        </div>
                      )}
                    </CardContent>
                      </Card>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}