import { useState, useEffect, useMemo, useCallback, memo, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useLocation, useParams } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { PostCard } from "@/components/post-card";
import { ProfileHeader } from "@/components/profile-header";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { realtimeEventBus } from "@/lib/realtime";
import { useToast } from "@/hooks/use-toast";
import { 
  User, 
  Edit, 
  Award, 
  CheckCircle, 
  Clock, 
  X, 
  Gift,
  Shield,
  MapPin,
  Calendar,
  Users,
  FileText,
  Star,
  Plus,
  Camera,
  Key
} from "lucide-react";
import { CommentModal } from "@/components/comment-modal";

interface UserProfile {
  id: number;
  fullName: string;
  username: string;
  email: string;
  bio?: string;
  profilePicture?: string;
  isVerified: boolean;
  verificationStatus: string;
  verificationRequestDate?: string;
  points: number;
  createdAt: string;
  postsCount?: number;
}

export default function UserProfilePage() {
  const { t } = useTranslation();
  const params = useParams();
  const userId = params.id ? parseInt(params.id) : null;
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  
  const [editMode, setEditMode] = useState(false);
  const [editedProfile, setEditedProfile] = useState<Partial<UserProfile>>({});
  const [verificationDialogOpen, setVerificationDialogOpen] = useState(false);
  const [showRedeemHistory, setShowRedeemHistory] = useState(false);
  const [profilePictureFile, setProfilePictureFile] = useState<File | null>(null);
  const [selectedPost, setSelectedPost] = useState<any>(null);
  const [isCommentModalOpen, setIsCommentModalOpen] = useState(false);

  // If no userId provided, show current user's profile
  const targetUserId = userId || currentUser?.id;
  const isOwnProfile = targetUserId === currentUser?.id;

  // Fetch user profile data with optimized polling
  const { data: userProfile, isLoading: profileLoading } = useQuery<UserProfile>({
    queryKey: ["/api/users", targetUserId, "profile"],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/users/${targetUserId}/profile`);
      return await response.json();
    },
    enabled: !!targetUserId,
    refetchInterval: () => document.hidden ? 30000 : 15000, // Smart polling
    refetchOnWindowFocus: true,
    staleTime: 10000, // 10 seconds stale time
  });

  // Fetch user's redemption history with static data optimization
  const { data: redemptionHistory = [] } = useQuery({
    queryKey: ["/api/users", targetUserId, "redemptions"],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/users/${targetUserId}/redemptions`);
      return await response.json();
    },
    enabled: !!targetUserId && isOwnProfile,
    staleTime: 5 * 60 * 1000, // 5 minutes stale time for static data
    gcTime: 10 * 60 * 1000, // 10 minutes cache time
    refetchOnWindowFocus: false, // Don't refetch on focus for historical data
    refetchInterval: false, // No polling for static data
  });

  // Fetch user's posts with visibility-aware polling
  const { data: userPosts = [], isLoading: postsLoading } = useQuery({
    queryKey: ["/api/users", targetUserId, "posts"],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/users/${targetUserId}/posts`);
      return await response.json();
    },
    enabled: !!targetUserId,
    refetchInterval: () => document.hidden ? 30000 : 10000, // Visibility-aware polling: 10s visible, 30s hidden
    refetchOnWindowFocus: true,
    staleTime: 5000, // 5 seconds stale time
  });

  // Use points from user profile (this is the correct source)
  const totalPoints = useMemo(() => userProfile?.points || 0, [userProfile?.points]);

  // Update profile mutation with optimistic updates
  const updateProfileMutation = useMutation({
    mutationFn: async (profileData: Partial<UserProfile>) => {
      const response = await apiRequest("PUT", `/api/users/${currentUser?.id}/profile`, profileData);
      return await response.json();
    },
    onMutate: async (profileData: Partial<UserProfile>) => {
      // Apply optimistic update immediately using real-time event bus
      if (currentUser?.id) {
        realtimeEventBus.publishUserUpdate(currentUser.id, {
          username: profileData.username,
          fullName: profileData.fullName,
          bio: profileData.bio,
          profilePicture: profileData.profilePicture,
        });
      }
      
      // Return previous data for potential rollback
      const previousProfile = queryClient.getQueryData(['/api/users', currentUser?.id, 'profile']);
      return { previousProfile };
    },
    onSuccess: (updatedProfile) => {
      // Server confirmed the update, ensure cache is in sync
      queryClient.setQueryData(["/api/users", currentUser?.id, "profile"], updatedProfile);
      queryClient.setQueryData(["/api/user"], (oldData: any) => {
        if (!oldData) return oldData;
        return { ...oldData, ...updatedProfile };
      });
      
      // Invalidate related queries for fresh data
      queryClient.invalidateQueries({ queryKey: ["/api/posts"], exact: false });
      
      setEditMode(false);
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
      });
    },
    onError: (error: any, profileData, context) => {
      // Rollback optimistic update on error
      if (context?.previousProfile && currentUser?.id) {
        const prevProfile = context.previousProfile as UserProfile;
        queryClient.setQueryData(['/api/users', currentUser.id, 'profile'], prevProfile);
        queryClient.setQueryData(["/api/user"], prevProfile);
        
        // Broadcast rollback to other tabs
        realtimeEventBus.publishUserUpdate(currentUser.id, {
          username: prevProfile.username,
          fullName: prevProfile.fullName,  
          bio: prevProfile.bio,
          profilePicture: prevProfile.profilePicture,
        });
      }
      
      toast({
        title: "Update failed", 
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Request verification mutation
  const requestVerificationMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/users/${currentUser?.id}/request-verification`);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users", currentUser?.id, "profile"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users"], exact: false });
      setVerificationDialogOpen(false);
      toast({
        title: "Verification requested",
        description: "Your verification request has been submitted for review.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Request failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Post actions - with enhanced cache invalidation for profile points
  const givePointMutation = useMutation({
    mutationFn: async (postId: number) => {
      const response = await apiRequest("POST", `/api/posts/${postId}/point`);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users", targetUserId, "posts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users", targetUserId, "profile"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users", currentUser?.id, "profile"] });
      toast({
        title: "Point given!",
        description: "You gave a point to this post.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to give point.",
        variant: "destructive",
      });
    },
  });

  const deletePostMutation = useMutation({
    mutationFn: async (postId: number) => {
      const response = await apiRequest("DELETE", `/api/posts/${postId}`);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users", targetUserId, "posts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users", targetUserId, "profile"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users", currentUser?.id, "profile"] });
      toast({
        title: "Post deleted",
        description: "Your post has been deleted successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete post.",
        variant: "destructive",
      });
    },
  });

  const reportPostMutation = useMutation({
    mutationFn: async (postId: number) => {
      const response = await apiRequest("POST", `/api/posts/${postId}/report`);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      toast({
        title: "Post reported",
        description: "Thank you for reporting. We'll review this post.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to report post.",
        variant: "destructive",
      });
    },
  });

  const handleEditSubmit = useCallback(async () => {
    let profileData = { ...editedProfile };
    
    // Handle profile picture upload if a file is selected
    if (profilePictureFile) {
      try {
        const formData = new FormData();
        formData.append('profilePicture', profilePictureFile);
        
        const uploadResponse = await fetch(`/api/users/${currentUser?.id}/profile-picture`, {
          method: 'POST',
          body: formData,
          credentials: 'include',
        });
        
        if (uploadResponse.ok) {
          const uploadResult = await uploadResponse.json();
          profileData.profilePicture = uploadResult.profilePicture;
        } else {
          throw new Error('Failed to upload profile picture');
        }
      } catch (error) {
        toast({
          title: "Upload failed",
          description: "Failed to upload profile picture. Please try again.",
          variant: "destructive",
        });
        return;
      }
    }
    
    updateProfileMutation.mutate(profileData);
  }, [editedProfile, profilePictureFile, updateProfileMutation, currentUser?.id, toast]);

  const handleRequestVerification = useCallback(() => {
    requestVerificationMutation.mutate();
  }, [requestVerificationMutation]);

  const handleGivePoint = useCallback((postId: number) => {
    givePointMutation.mutate(postId);
  }, [givePointMutation]);

  const handleDeletePost = useCallback((postId: number) => {
    deletePostMutation.mutate(postId);
  }, [deletePostMutation]);

  const handleReportPost = useCallback((postId: number) => {
    reportPostMutation.mutate(postId);
  }, [reportPostMutation]);

  const handleComment = useCallback((post: any) => {
    setSelectedPost(post);
    setIsCommentModalOpen(true);
  }, []);

  const handleUserClick = useCallback((userId: number) => {
    setLocation(`/profile/${userId}`);
  }, [setLocation]);

  const getVerificationButton = useCallback(() => {
    if (!isOwnProfile || userProfile?.isVerified) return null;

    switch (userProfile?.verificationStatus) {
      case "pending":
        return (
          <Button variant="outline" disabled className="w-full">
            <Clock className="h-4 w-4 mr-2" />
            Verification Under Review
          </Button>
        );
      case "rejected":
        return (
          <Dialog open={verificationDialogOpen} onOpenChange={setVerificationDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="w-full text-red-600 border-red-600">
                <X className="h-4 w-4 mr-2" />
                Rejected, Try Again
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Request Verification</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  Make sure your profile contains only sports-related content, enough number of posts, 
                  and has recent activity within the past week. Our team will review your profile.
                </p>
                <Button 
                  onClick={handleRequestVerification}
                  disabled={requestVerificationMutation.isPending}
                  className="w-full"
                >
                  {requestVerificationMutation.isPending ? "Requesting..." : "Request Verification"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        );
      default:
        return (
          <Dialog open={verificationDialogOpen} onOpenChange={setVerificationDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="w-full">
                <Award className="h-4 w-4 mr-2" />
                Verify Yourself
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Request Verification</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  Make sure your profile contains only sports-related content, enough number of posts, 
                  and has recent activity within the past week. Our team will review your profile.
                </p>
                <Button 
                  onClick={handleRequestVerification}
                  disabled={requestVerificationMutation.isPending}
                  className="w-full"
                >
                  {requestVerificationMutation.isPending ? "Requesting..." : "Request Verification"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        );
    }
  }, [isOwnProfile, userProfile?.isVerified, userProfile?.verificationStatus, verificationDialogOpen, handleRequestVerification, requestVerificationMutation.isPending]);

  if (profileLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading profile...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!userProfile) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">User Not Found</h1>
            <p className="text-gray-600 mb-4">The user you're looking for doesn't exist.</p>
            <Button onClick={() => setLocation("/feed")}>Back to Feed</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      <Navbar />
      
      <main className="main-content flex-1 pt-8 pb-6">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Profile Header */}
          <ProfileHeader 
            userProfile={userProfile}
            userPosts={userPosts}
            isOwnProfile={isOwnProfile}
            totalPoints={totalPoints}
            onEditProfile={() => setEditMode(true)}
            getVerificationButton={getVerificationButton}
            onShowRedeemHistory={() => setShowRedeemHistory(true)}
            onChangePassword={() => setLocation("/change-password")}
            onRedeemPoints={() => setLocation("/redeem-points")}
          />

          {/* Posts Section */}
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Posts</h2>
            
            {postsLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading posts...</p>
            </div>
          ) : userPosts.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No posts yet</h3>
                <p className="text-gray-600">
                  {isOwnProfile ? "Start sharing your sports journey!" : "This user hasn't posted anything yet."}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {userPosts.map((post: any) => (
                <PostCard
                  key={post.id}
                  post={post}
                  currentUser={currentUser!}
                  onGivePoint={handleGivePoint}
                  onComment={handleComment}
                  onReport={handleReportPost}
                  onDelete={handleDeletePost}
                  onUserClick={handleUserClick}
                />
              ))}
            </div>
            )}
          </div>
        </div>
      </main>

      {/* Edit Profile Modal */}
      <Dialog open={editMode} onOpenChange={setEditMode}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{t('profile.editProfile')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="fullName">{t('profile.fullName')}</Label>
              <Input
                id="fullName"
                value={editedProfile.fullName || userProfile.fullName}
                onChange={(e) => setEditedProfile({...editedProfile, fullName: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="bio">{t('profile.bio')}</Label>
              <Textarea
                id="bio"
                value={editedProfile.bio || userProfile.bio || ''}
                onChange={(e) => setEditedProfile({...editedProfile, bio: e.target.value})}
                placeholder={t('profile.bioPlaceholder') === 'profile.bioPlaceholder' ? "Tell us about yourself..." : t('profile.bioPlaceholder')}
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="profilePicture">Profile Picture</Label>
              <Input
                id="profilePicture"
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setProfilePictureFile(file);
                    setEditedProfile({...editedProfile, profilePicture: file.name});
                  }
                }}
              />
            </div>
          </div>
          <div className="flex gap-2 pt-4">
            <Button 
              onClick={handleEditSubmit}
              disabled={updateProfileMutation.isPending}
              className="flex-1"
            >
              {updateProfileMutation.isPending ? t('profile.saving') : t('profile.saveChanges')}
            </Button>
            <Button variant="outline" onClick={() => setEditMode(false)} className="flex-1">
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Redeem History Modal */}
      <Dialog open={showRedeemHistory} onOpenChange={setShowRedeemHistory}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Redemption History</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 max-h-[400px] overflow-y-auto">
            {redemptionHistory.length === 0 ? (
              <div className="text-center py-8">
                <Gift className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No redemptions yet</h3>
                <p className="text-gray-600">Your redemption history will appear here.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {redemptionHistory.map((redemption: any) => (
                  <div key={redemption.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-semibold">₹{redemption.moneyAmount}</h4>
                        <p className="text-sm text-gray-600">
                          {redemption.pointsRedeemed} points • {redemption.email}
                        </p>
                      </div>
                      <Badge variant={redemption.status === 'approved' ? 'default' : redemption.status === 'rejected' ? 'destructive' : 'secondary'}>
                        {redemption.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-500">
                      Requested: {new Date(redemption.requestedAt).toLocaleDateString()}
                    </p>
                    {redemption.processedAt && (
                      <p className="text-xs text-gray-500">
                        Processed: {new Date(redemption.processedAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Comment Modal */}
      {selectedPost && (
        <CommentModal
          isOpen={isCommentModalOpen}
          onClose={() => setIsCommentModalOpen(false)}
          post={selectedPost}
        />
      )}

      <Footer />
    </div>
  );
}