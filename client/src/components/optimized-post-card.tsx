import React, { memo, useCallback } from 'react';
import { PostCard } from './post-card';

interface OptimizedPostCardProps {
  post: any;
  user: any;
  onGivePoint: (postId: number) => void;
  onReportPost: (postId: number) => void;
  onDeletePost: (postId: number) => void;
  onCommentClick: (post: any) => void;
  onUsernameClick: (userId: number) => void;
}

// Memoized PostCard to prevent unnecessary re-renders
export const OptimizedPostCard = memo<OptimizedPostCardProps>(({
  post,
  user,
  onGivePoint,
  onReportPost,
  onDeletePost,
  onCommentClick,
  onUsernameClick
}) => {
  // Stable callback handlers
  const handleGivePoint = useCallback(() => {
    onGivePoint(post.id);
  }, [onGivePoint, post.id]);

  const handleReportPost = useCallback(() => {
    onReportPost(post.id);
  }, [onReportPost, post.id]);

  const handleDeletePost = useCallback(() => {
    onDeletePost(post.id);
  }, [onDeletePost, post.id]);

  const handleCommentClick = useCallback(() => {
    onCommentClick(post);
  }, [onCommentClick, post]);

  const handleUsernameClick = useCallback((userId: number) => {
    onUsernameClick(userId);
  }, [onUsernameClick]);

  return (
    <PostCard
      post={post}
      currentUser={user}
      onGivePoint={handleGivePoint}
      onReport={handleReportPost}
      onDelete={handleDeletePost}
      onComment={handleCommentClick}
      onUserClick={handleUsernameClick}
    />
  );
}, (prevProps, nextProps) => {
  // Custom comparison function for better memoization
  return (
    prevProps.post.id === nextProps.post.id &&
    prevProps.post.points === nextProps.post.points &&
    prevProps.post.commentCount === nextProps.post.commentCount &&
    prevProps.user?.id === nextProps.user?.id
  );
});