import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { formatDistanceToNow } from "date-fns";
import { Navbar } from "@/components/navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Loader2, FileText, Image, Video, Eye, Trash2, AlertTriangle, XCircle, ArrowLeft } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface PostStats {
  totalPosts: number;
  newPosts: number;
}

interface PostDetails {
  id: number;
  user: any;
  type: string;
  content: string;
  mediaUrl?: string;
  mediaType?: string;
  points: number;
  comments: number;
  createdAt: string;
  mentions: any[];
  tags: any[];
}

interface ReportedPost {
  id: number;
  post: PostDetails;
  reportedByUser: any;
  reason?: string;
  createdAt: string;
}

export default function PostManagementPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [selectedPost, setSelectedPost] = useState<PostDetails | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  // Fetch post statistics
  const { data: stats, isLoading: isLoadingStats } = useQuery<PostStats>({
    queryKey: ["/api/admin/posts/stats"],
    refetchInterval: 5000, // Auto-update every 5 seconds
  });

  // Fetch all posts
  const { 
    data: posts = [], 
    isLoading: isLoadingPosts 
  } = useQuery<PostDetails[]>({
    queryKey: ["/api/admin/posts"],
    refetchInterval: 10000, // Auto-update every 10 seconds
  });

  // Fetch reported posts
  const { 
    data: reportedPosts = [], 
    isLoading: isLoadingReported 
  } = useQuery<ReportedPost[]>({
    queryKey: ["/api/admin/reported-posts"],
    refetchInterval: 5000, // Real-time updates for reports
  });

  // Delete post mutation (admin can delete any post)
  const deletePostMutation = useMutation({
    mutationFn: async (postId: number) => {
      const response = await apiRequest("DELETE", `/api/posts/${postId}`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message);
      }
      return response.json();
    },
    onSuccess: () => {
      // Invalidate all related queries for real-time updates across all pages
      queryClient.invalidateQueries({ queryKey: ["/api/admin/posts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/posts/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/reported-posts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      toast({
        title: "Post deleted",
        description: "Post has been permanently removed from all locations including feed, database, and reports.",
      });
      setIsViewModalOpen(false);
    },
    onError: (error: any) => {
      console.error("Delete post error:", error);
      toast({
        title: "Failed to delete post",
        description: error.message || "An error occurred while deleting the post",
        variant: "destructive",
      });
    },
  });

  // Ignore reported post mutation (removes report but keeps post)
  const ignoreReportMutation = useMutation({
    mutationFn: async (reportId: number) => {
      const response = await apiRequest("DELETE", `/api/admin/reported-posts/${reportId}`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message);
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/reported-posts"] });
      toast({
        title: "Report dismissed",
        description: "Report has been ignored and removed from the list. The post remains live.",
      });
    },
    onError: (error: any) => {
      console.error("Ignore report error:", error);
      toast({
        title: "Failed to ignore report", 
        description: error.message || "An error occurred while dismissing the report",
        variant: "destructive",
      });
    },
  });

  const handleViewPost = (post: PostDetails) => {
    setSelectedPost(post);
    setIsViewModalOpen(true);
  };

  const handleDeletePost = (postId: number) => {
    if (confirm("⚠️ ADMIN ACTION: Are you sure you want to permanently delete this post?\n\nThis will:\n• Remove it from the feed\n• Delete from database\n• Remove from reports\n• Delete associated media\n\nThis action cannot be undone.")) {
      deletePostMutation.mutate(postId);
    }
  };

  const handleIgnoreReport = (reportId: number) => {
    if (confirm("Are you sure you want to ignore this report?\n\nThis will:\n• Remove the report from the list\n• Keep the post live on the platform\n• Mark the report as dismissed")) {
      ignoreReportMutation.mutate(reportId);
    }
  };

  const getPostIcon = (type: string) => {
    switch (type) {
      case "photo": return <Image className="h-4 w-4" />;
      case "video": return <Video className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const getPostTypeColor = (type: string) => {
    switch (type) {
      case "photo": return "bg-green-100 text-green-800";
      case "video": return "bg-purple-100 text-purple-800";
      default: return "bg-blue-100 text-blue-800";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <main className="max-w-7xl mx-auto pt-20 pb-6 px-4 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center">
          <Button
            variant="ghost"
            onClick={() => setLocation("/admin")}
            className="mr-4 p-2 text-gray-500 hover:text-gray-700"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Post Management</h1>
            <p className="mt-2 text-gray-600">Manage all posts and handle reports</p>
          </div>
        </div>

        {/* Section A: Total Activities */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Total Activities</h2>
          
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Total Posts</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">
                  {isLoadingStats ? (
                    <Loader2 className="h-6 w-6 animate-spin" />
                  ) : (
                    stats?.totalPosts || 0
                  )}
                </div>
                <p className="text-sm text-gray-600">Text + Photo + Video</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">New Posts (Last 24 Hrs)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {isLoadingStats ? (
                    <Loader2 className="h-6 w-6 animate-spin" />
                  ) : (
                    stats?.newPosts || 0
                  )}
                </div>
                <p className="text-sm text-gray-600">Auto-updating</p>
              </CardContent>
            </Card>
          </div>

          {/* Posts List */}
          <Card>
            <CardHeader>
              <CardTitle>All Posts</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingPosts ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                </div>
              ) : posts.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No posts found</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {posts.map((post) => (
                    <div
                      key={post.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex items-center space-x-4 flex-1 min-w-0">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback>
                            {post.user.fullName.split(' ').map((n: string) => n[0]).join('').toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="font-medium text-gray-900">@{post.user.username}</span>
                            <span className="text-gray-600">{post.user.fullName}</span>
                            <Badge className={`text-xs ${getPostTypeColor(post.type)}`}>
                              <span className="flex items-center space-x-1">
                                {getPostIcon(post.type)}
                                <span>{post.type}</span>
                              </span>
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 truncate">
                            {post.content || "No caption"}
                          </p>
                          <div className="flex items-center space-x-4 text-xs text-gray-500 mt-1">
                            <span>{post.points} points</span>
                            <span>{post.comments} comments</span>
                            <span>{formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewPost(post)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeletePost(post.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Section B: Reported Posts */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Reported Posts
            {reportedPosts.length > 0 && (
              <Badge variant="destructive" className="ml-2">
                {reportedPosts.length}
              </Badge>
            )}
          </h2>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                <span>Posts Under Review</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingReported ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                </div>
              ) : reportedPosts.length === 0 ? (
                <div className="text-center py-8">
                  <AlertTriangle className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No reported posts</p>
                  <p className="text-sm text-gray-400">Reports will appear here in real-time</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {reportedPosts.map((report) => (
                    <div
                      key={report.id}
                      className="flex items-center justify-between p-4 border border-red-200 rounded-lg bg-red-50"
                    >
                      <div className="flex items-center space-x-4 flex-1 min-w-0">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback>
                            {report.post.user.fullName.split(' ').map((n: string) => n[0]).join('').toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="font-medium text-gray-900">@{report.post.user.username}</span>
                            <Badge className={`text-xs ${getPostTypeColor(report.post.type)}`}>
                              <span className="flex items-center space-x-1">
                                {getPostIcon(report.post.type)}
                                <span>{report.post.type}</span>
                              </span>
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 truncate">
                            {report.post.content || "No caption"}
                          </p>
                          <div className="flex items-center space-x-4 text-xs text-gray-500 mt-1">
                            <span>Reported by: @{report.reportedByUser.username} ({report.reportedByUser.fullName})</span>
                            <span>{formatDistanceToNow(new Date(report.createdAt), { addSuffix: true })}</span>
                            {report.reason && <span className="text-red-600 font-medium">Reason: {report.reason}</span>}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewPost(report.post)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeletePost(report.post.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Delete
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleIgnoreReport(report.id)}
                          className="text-gray-600 hover:text-gray-700"
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Ignore
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      {/* View Post Modal */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Post Details</DialogTitle>
          </DialogHeader>
          
          {selectedPost && (
            <div className="space-y-4">
              {/* User Info */}
              <div className="flex items-center space-x-3">
                <Avatar className="h-12 w-12">
                  <AvatarFallback>
                    {selectedPost.user.fullName.split(' ').map((n: string) => n[0]).join('').toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold text-gray-900">{selectedPost.user.fullName}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                    <span>@{selectedPost.user.username}</span>
                    <span>•</span>
                    <span>{formatDistanceToNow(new Date(selectedPost.createdAt), { addSuffix: true })}</span>
                  </div>
                </div>
              </div>

              {/* Media Preview */}
              {selectedPost.mediaUrl && (
                <div className="rounded-lg overflow-hidden border">
                  <div className="bg-gray-100 px-3 py-2 text-sm text-gray-600 font-medium">
                    Media Content ({selectedPost.mediaType})
                  </div>
                  {selectedPost.mediaType?.startsWith('image/') ? (
                    <img
                      src={selectedPost.mediaUrl}
                      alt="Post media"
                      className="w-full max-h-96 object-contain bg-black"
                    />
                  ) : selectedPost.mediaType?.startsWith('video/') ? (
                    <video
                      src={selectedPost.mediaUrl}
                      controls
                      autoPlay={false}
                      muted
                      className="w-full max-h-96 object-contain bg-black"
                      onError={(e) => {
                        console.error("Video load error:", e);
                      }}
                    >
                      Your browser does not support the video tag.
                    </video>
                  ) : (
                    <div className="p-4 text-center text-gray-500">
                      <p>Media file type not supported for preview</p>
                      <p className="text-sm">{selectedPost.mediaType}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Content */}
              {selectedPost.content && (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">Caption:</h4>
                  <p className="text-gray-700">{selectedPost.content}</p>
                </div>
              )}

              {/* Stats */}
              <div className="flex items-center space-x-6 text-sm text-gray-500 border-t pt-4">
                <div>{selectedPost.points} points</div>
                <div>{selectedPost.comments} comments</div>
                <div>{selectedPost.mentions?.length || 0} mentions</div>
                <div>{selectedPost.tags?.length || 0} tags</div>
              </div>

              {/* Actions */}
              <div className="flex justify-end space-x-2 border-t pt-4">
                <Button
                  variant="outline"
                  onClick={() => setIsViewModalOpen(false)}
                >
                  Close
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => handleDeletePost(selectedPost.id)}
                  disabled={deletePostMutation.isPending}
                >
                  {deletePostMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete Post
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}