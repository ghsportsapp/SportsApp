import { useState, useEffect, useMemo, useCallback, lazy, Suspense, startTransition, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useIsMobile } from "@/hooks/use-mobile";
import { Navbar } from "@/components/navbar";
import { OptimizedPostCard } from "@/components/optimized-post-card";

// Lazy-loaded components for better performance
const Footer = lazy(() => import("@/components/footer").then(module => ({ default: module.Footer })));
const CreatePostModal = lazy(() => import("@/components/create-post-modal").then(module => ({ default: module.CreatePostModal })));
const CommentModal = lazy(() => import("@/components/comment-modal").then(module => ({ default: module.CommentModal })));
import { Button } from "@/components/ui/button";
import { GradientButton } from "@/components/ui/gradient-button";
import { Loader2, Plus } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { QUERY_CONFIGS } from "@/utils/performance";

type PostType = "all" | "text" | "photo" | "video";

export default function FeedPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const isMobile = useIsMobile();
  const { t } = useTranslation();
  const [activeFilter, setActiveFilter] = useState<PostType>("all");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState<any>(null);
  const [isCommentModalOpen, setIsCommentModalOpen] = useState(false);
  
  // Ref map for optimized scroll-to-post functionality
  const postRefs = useRef<Record<string, HTMLElement | null>>({});

  const { 
    data: posts = [], 
    isLoading: isLoadingPosts 
  } = useQuery({
    queryKey: ["/api/posts", activeFilter],
    queryFn: () => apiRequest("GET", `/api/posts${activeFilter !== "all" ? `?type=${activeFilter}` : ""}`).then(res => res.json()),
    ...QUERY_CONFIGS.frequent, // Optimized polling configuration
    placeholderData: [], // Show empty array to prevent blank states
    refetchOnWindowFocus: false, // Reduce unnecessary refetches
  });

  // Optimized scroll-to-post functionality using refs
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const postId = urlParams.get('postId');
    
    if (postId && posts.length > 0) {
      // Remove the query parameter to clean up URL
      window.history.replaceState({}, '', window.location.pathname);
      
      // Use requestAnimationFrame for smooth scrolling
      requestAnimationFrame(() => {
        const postElement = postRefs.current[postId];
        if (postElement) {
          postElement.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center' 
          });
          // Add highlight effect using classList (stable approach)
          postElement.classList.add('ring-2', 'ring-blue-400', 'ring-opacity-50');
          setTimeout(() => {
            postElement.classList.remove('ring-2', 'ring-blue-400', 'ring-opacity-50');
          }, 3000);
        }
      });
    }
  }, [posts]);

  // Memoized mutation handlers for better performance
  const givePointMutation = useMutation({
    mutationFn: async (postId: number) => {
      await apiRequest("POST", `/api/posts/${postId}/point`);
    },
    onSuccess: () => {
      // Smart cache invalidation - only invalidate current filter
      queryClient.invalidateQueries({ queryKey: ["/api/posts", activeFilter] });
      toast({
        title: "Success",
        description: "Point given successfully!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to give point",
        variant: "destructive",
      });
    },
  });

  const reportPostMutation = useMutation({
    mutationFn: async ({ postId, reason }: { postId: number; reason?: string }) => {
      await apiRequest("POST", `/api/posts/${postId}/report`, { reason });
    },
    onSuccess: () => {
      // Invalidate reported posts for real-time admin updates
      queryClient.invalidateQueries({ queryKey: ["/api/admin/reported-posts"] });
      toast({
        title: "Post reported",
        description: "Thank you for helping keep our community safe. This has been sent to administrators for review.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to report post",
        variant: "destructive",
      });
    },
  });

  const deletePostMutation = useMutation({
    mutationFn: async (postId: number) => {
      await apiRequest("DELETE", `/api/posts/${postId}`);
    },
    onSuccess: () => {
      // Batch invalidation for better performance
      const queries = [
        ["/api/posts"],
        ["/api/admin/posts"],
        ["/api/admin/posts/stats"],
        ["/api/admin/reported-posts"]
      ];
      queries.forEach(queryKey => {
        queryClient.invalidateQueries({ queryKey });
      });
      toast({
        title: "Post deleted",
        description: "Your post has been deleted successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete post",
        variant: "destructive",
      });
    },
  });

  // Memoized callback handlers to prevent re-renders
  const handleGivePoint = useCallback((postId: number) => {
    givePointMutation.mutate(postId);
  }, [givePointMutation]);

  const handleReportPost = useCallback((postId: number) => {
    if (confirm("Are you sure you want to report this post?")) {
      reportPostMutation.mutate({ postId, reason: "Inappropriate content" });
    }
  }, [reportPostMutation]);

  const handleDeletePost = useCallback((postId: number) => {
    if (confirm("Are you sure you want to delete this post?")) {
      deletePostMutation.mutate(postId);
    }
  }, [deletePostMutation]);

  const handleCommentClick = (post: any) => {
    setSelectedPost(post);
    setIsCommentModalOpen(true);
  };

  const handleUserClick = useCallback((userId: number) => {
    setLocation(`/profile/${userId}`);
  }, [setLocation]);

  // Memoized filters to prevent re-renders
  const filters = useMemo(() => [
    { id: "all" as PostType, label: t('feed.allPosts'), active: activeFilter === "all" },
    { id: "text" as PostType, label: t('feed.textPosts'), active: activeFilter === "text" },
    { id: "photo" as PostType, label: t('feed.photoPosts'), active: activeFilter === "photo" },
    { id: "video" as PostType, label: t('feed.videoPosts'), active: activeFilter === "video" },
  ], [t, activeFilter]);

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
        <Navbar />
      
      {/* Main Content */}
      <main className="main-content flex-1 pt-8 pb-6">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Filters and Create Post Button */}
          <div className={`space-y-4 mb-6 ${isMobile ? 'mt-6' : 'mt-4'}`}>
            {/* Filters */}
            <div className="grid grid-cols-4 gap-2">
            {filters.map((filter) => (
              <Button
                key={filter.id}
                variant={filter.active ? "default" : "outline"}
                size="sm"
                onClick={() => startTransition(() => setActiveFilter(filter.id))}
                className={`w-full whitespace-nowrap ${
                  filter.active 
                    ? 'text-white border-none shadow-md hover:opacity-90' 
                    : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
                style={filter.active ? { backgroundColor: '#283E51' } : {}}
              >
                {filter.label}
              </Button>
            ))}
          </div>

          {/* Create Post Button */}
          <GradientButton
            onClick={() => setIsCreateModalOpen(true)}
            className="w-full"
            size="lg"
          >
            <Plus className="h-5 w-5 mr-2" />
            {t('feed.createPost')}
          </GradientButton>
        </div>

        {/* Posts Feed */}
        {isLoadingPosts ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-12">
            <div className="max-w-md mx-auto">
              <div className="h-16 w-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Plus className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('feed.noPostsTitle')}</h3>
              <p className="text-gray-600 mb-4">{t('feed.noPostsDescription')}</p>
              <GradientButton onClick={() => setIsCreateModalOpen(true)}>
                {t('feed.createFirstPost')}
              </GradientButton>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {posts.map((post: any) => (
              <div
                key={post.id}
                ref={(el) => {
                  if (el) {
                    postRefs.current[post.id.toString()] = el;
                  }
                }}
                style={{
                  contentVisibility: 'auto',
                  containIntrinsicSize: '700px 400px'
                }}
              >
                <OptimizedPostCard
                  post={post}
                  user={user}
                  onGivePoint={handleGivePoint}
                  onReportPost={handleReportPost}
                  onDeletePost={handleDeletePost}
                  onCommentClick={handleCommentClick}
                  onUsernameClick={handleUserClick}
                />
              </div>
            ))}
          </div>
        )}
        </div>
      </main>

      {/* Modals with lazy loading */}
      <Suspense fallback={null}>
        {isCreateModalOpen && (
          <CreatePostModal
            isOpen={isCreateModalOpen}
            onClose={() => setIsCreateModalOpen(false)}
          />
        )}
      </Suspense>

      <Suspense fallback={null}>
        {isCommentModalOpen && (
          <CommentModal
            isOpen={isCommentModalOpen}
            onClose={() => setIsCommentModalOpen(false)}
            post={selectedPost}
          />
        )}
      </Suspense>

      <Suspense fallback={<div className="h-16 bg-gray-100 dark:bg-gray-800" />}>
        <Footer />
      </Suspense>
    </div>
  );
}