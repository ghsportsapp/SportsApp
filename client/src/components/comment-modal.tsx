import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Loader2, Send, MessageCircle, Reply, Trash2 } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";

interface CommentModalProps {
  isOpen: boolean;
  onClose: () => void;
  post: any;
}

export function CommentModal({ isOpen, onClose, post }: CommentModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [newComment, setNewComment] = useState("");
  const [replyingTo, setReplyingTo] = useState<number | null>(null);

  const { 
    data: comments = [], 
    isLoading: isLoadingComments 
  } = useQuery({
    queryKey: ["/api/posts", post?.id, "comments"],
    enabled: isOpen && !!post?.id,
    queryFn: () => apiRequest("GET", `/api/posts/${post.id}/comments`).then(res => res.json()),
  });

  const createCommentMutation = useMutation({
    mutationFn: async ({ content, parentId }: { content: string; parentId?: number }) => {
      const response = await apiRequest("POST", `/api/posts/${post.id}/comments`, {
        content,
        parentId: parentId || null,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts", post?.id, "comments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      setNewComment("");
      setReplyingTo(null);
      toast({
        title: "Comment posted!",
        description: "Your comment has been added successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error posting comment",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteCommentMutation = useMutation({
    mutationFn: async (commentId: number) => {
      const response = await apiRequest("DELETE", `/api/comments/${commentId}`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message);
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts", post?.id, "comments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      toast({
        title: "Comment deleted",
        description: "Comment has been removed successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error deleting comment",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmitComment = () => {
    if (!newComment.trim()) return;
    
    createCommentMutation.mutate({
      content: newComment.trim(),
      parentId: replyingTo || undefined,
    });
  };

  const handleReply = (commentId: number) => {
    setReplyingTo(commentId);
    setNewComment("");
  };

  const handleDeleteComment = (commentId: number) => {
    if (confirm("Are you sure you want to delete this comment?")) {
      deleteCommentMutation.mutate(commentId);
    }
  };

  const canDeleteComment = (comment: any) => {
    return user && (comment.userId === user.id || post.userId === user.id);
  };

  if (!post) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Comments</DialogTitle>
        </DialogHeader>

        {/* Post Summary */}
        <div className="border-b pb-4">
          <div className="flex items-center space-x-3 mb-2">
            <Avatar className="h-8 w-8">
              <AvatarFallback>
                {post.user.fullName.split(' ').map((n: string) => n[0]).join('').toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <span className="font-semibold text-sm">{post.user.fullName}</span>
              <span className="text-gray-500 text-sm ml-2">
                {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
              </span>
            </div>
          </div>
          {post.content && (
            <p className="text-gray-700 text-sm">{post.content}</p>
          )}
        </div>

        {/* Comments List */}
        <div className="flex-1 overflow-y-auto space-y-4 py-4">
          {isLoadingComments ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </div>
          ) : comments.length === 0 ? (
            <div className="text-center py-8">
              <MessageCircle className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No comments yet</p>
              <p className="text-sm text-gray-400">Be the first to comment!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {comments.map((comment: any) => (
                <div key={comment.id} className="space-y-2">
                  {/* Main Comment */}
                  <div className="flex space-x-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>
                        {comment.user.fullName.split(' ').map((n: string) => n[0]).join('').toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="bg-gray-50 rounded-lg p-3">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="font-semibold text-sm">{comment.user.fullName}</span>
                          <Badge variant="outline" className="text-xs">
                            {comment.user.userType}
                          </Badge>
                          <span className="text-gray-500 text-xs">
                            {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                          </span>
                        </div>
                        <p className="text-gray-700 text-sm">{comment.content}</p>
                      </div>
                      <div className="flex items-center space-x-2 mt-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleReply(comment.id)}
                          className="text-xs text-gray-500 hover:text-gray-700"
                        >
                          <Reply className="h-3 w-3 mr-1" />
                          Reply
                        </Button>
                        {canDeleteComment(comment) && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteComment(comment.id)}
                            className="text-xs text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="h-3 w-3 mr-1" />
                            Delete
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Replies */}
                  {comment.replies && comment.replies.length > 0 && (
                    <div className="ml-11 space-y-2">
                      {comment.replies.map((reply: any) => (
                        <div key={reply.id} className="flex space-x-3">
                          <Avatar className="h-6 w-6">
                            <AvatarFallback className="text-xs">
                              {reply.user.fullName.split(' ').map((n: string) => n[0]).join('').toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="bg-gray-50 rounded-lg p-2">
                              <div className="flex items-center space-x-2 mb-1">
                                <span className="font-semibold text-xs">{reply.user.fullName}</span>
                                <span className="text-gray-500 text-xs">
                                  {formatDistanceToNow(new Date(reply.createdAt), { addSuffix: true })}
                                </span>
                              </div>
                              <p className="text-gray-700 text-xs">{reply.content}</p>
                            </div>
                            {canDeleteComment(reply) && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteComment(reply.id)}
                                className="text-xs text-red-500 hover:text-red-700 mt-1"
                              >
                                <Trash2 className="h-3 w-3 mr-1" />
                                Delete
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Comment Input */}
        <div className="border-t pt-4">
          {replyingTo && (
            <div className="mb-2 text-sm text-gray-600">
              Replying to comment...
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setReplyingTo(null)}
                className="ml-2 text-xs"
              >
                Cancel
              </Button>
            </div>
          )}
          
          <div className="flex space-x-3">
            <Avatar className="h-8 w-8">
              <AvatarFallback>
                {user?.fullName.split(' ').map(n => n[0]).join('').toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-2">
              <Textarea
                placeholder="Write a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                rows={2}
                className="resize-none"
              />
              <div className="flex justify-end">
                <Button
                  onClick={handleSubmitComment}
                  disabled={!newComment.trim() || createCommentMutation.isPending}
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {createCommentMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Posting...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      {replyingTo ? "Reply" : "Comment"}
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}