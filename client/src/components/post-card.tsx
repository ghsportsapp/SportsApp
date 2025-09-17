import { formatDistanceToNow } from "date-fns";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LazyImage } from "@/components/lazy-image";
import { ProgressiveLazyImage } from "@/components/progressive-lazy-image";
import { SmartVideo } from "@/components/smart-video";
import { 
  Heart, 
  MessageCircle, 
  Share2, 
  MoreHorizontal, 
  Flag,
  Trash2,
  Star,
  CheckCircle,
  Users
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { User } from "@shared/schema";

interface PostCardProps {
  post: any;
  currentUser: User;
  onGivePoint: (postId: number) => void;
  onComment: (post: any) => void;
  onReport: (postId: number) => void;
  onDelete: (postId: number) => void;
  onUserClick?: (userId: number) => void;
}

export function PostCard({ 
  post, 
  currentUser, 
  onGivePoint, 
  onComment, 
  onReport, 
  onDelete,
  onUserClick
}: PostCardProps) {
  const { t } = useTranslation();
  
  // Helper function to safely get user initials
  const getInitials = (name?: string, fallback = 'U') => {
    const s = name?.trim().split(/\s+/).map(p => p[0]).join('').slice(0,2);
    return s ? s.toUpperCase() : fallback;
  };
  
  const isOwnPost = post.user.id === currentUser.id;
  
  return (
    <Card className="w-full" data-post-id={post.id}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <Avatar 
              className="h-10 w-10 cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all"
              onClick={() => onUserClick?.(post.user.id)}
            >
              {post.user.profilePicture ? (
                <ProgressiveLazyImage 
                  src={post.user.profilePicture} 
                  alt={post.user.fullName}
                  className="w-full h-full rounded-full object-cover"
                  width={40}
                  height={40}
                  quality={90}
                  priority={true}
                />
              ) : (
                <AvatarFallback>
                  {getInitials(post.user.fullName)}
                </AvatarFallback>
              )}
            </Avatar>
            <div>
              <div className="flex items-center space-x-2">
                <span 
                  className="font-semibold text-gray-900 cursor-pointer hover:text-blue-600 transition-colors"
                  onClick={() => onUserClick?.(post.user.id)}
                >
                  {post.user.fullName}
                </span>
                {post.user.isVerified && (
                  <CheckCircle className="h-4 w-4 text-blue-600" />
                )}
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <span 
                  className="cursor-pointer hover:text-blue-600 transition-colors"
                  onClick={() => onUserClick?.(post.user.id)}
                >
                  @{post.user.username}
                </span>
                <span>•</span>
                <span>{formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}</span>
              </div>
            </div>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {isOwnPost ? (
                <DropdownMenuItem 
                  onClick={() => onDelete(post.id)}
                  className="text-red-600"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  {t('posts.deletePost')}
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem 
                  onClick={() => onReport(post.id)}
                  className="text-red-600"
                >
                  <Flag className="mr-2 h-4 w-4" />
                  {t('posts.reportPost')}
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Post Content */}
        {post.content && (
          <div className="text-gray-900">
            {post.content.split(' ').map((word: string, index: number) => {
              if (word.startsWith('@')) {
                const username = word.slice(1).replace(/[^\w]/g, '');
                const mentionedUser = post.mentions?.find((user: User) => user.username === username);
                return (
                  <span 
                    key={index} 
                    className="text-blue-600 font-medium cursor-pointer hover:text-blue-800 transition-colors"
                    onClick={() => mentionedUser && onUserClick?.(mentionedUser.id)}
                  >
                    {word}{' '}
                  </span>
                );
              }
              return word + ' ';
            })}
          </div>
        )}

        {/* Media Content */}
        {post.mediaUrl && (
          <div className="rounded-lg overflow-hidden relative">
            {post.mediaType?.startsWith('image/') ? (
              <ProgressiveLazyImage
                src={post.mediaUrl}
                alt="Post media"
                className="w-full max-h-96 object-cover rounded-lg"
                sizes="(max-width: 768px) 100vw, 800px"
                width={800}
                height={384}
                quality={85}
              />
            ) : post.mediaType?.startsWith('video/') ? (
              <SmartVideo
                src={post.mediaUrl}
                controls
                className="w-full max-h-96 object-cover"
                autoplayThreshold={0.5}
                rootMargin="0px"
              />
            ) : null}
            
            {/* Tagged Users Icon */}
            {post.tags?.length > 0 && (
              <Button
                variant="secondary"
                size="sm"
                className="absolute bottom-2 right-2 bg-black/60 hover:bg-black/80 text-white border-none"
                onClick={(e) => {
                  e.stopPropagation();
                  // Here we could show a modal with tagged users
                }}
              >
                <Users className="h-4 w-4 mr-1" />
                {post.tags.length}
              </Button>
            )}
          </div>
        )}

        {/* Mentions and Tags */}
        {(post.mentions?.length > 0 || post.tags?.length > 0) && (
          <div className="space-y-2">
            {post.mentions?.length > 0 && (
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">{t('posts.mentions')}:</span>
                <div className="flex flex-wrap gap-1">
                  {post.mentions.map((user: User) => (
                    <Badge 
                      key={user.id} 
                      variant="secondary" 
                      className="text-xs cursor-pointer hover:bg-blue-100 transition-colors"
                      onClick={() => onUserClick?.(user.id)}
                    >
                      @{user.username}
                      {user.isVerified && (
                        <CheckCircle className="h-3 w-3 text-blue-600 ml-1" />
                      )}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            
            {post.tags?.length > 0 && (
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">{t('posts.tagged')}:</span>
                <div className="flex flex-wrap gap-1">
                  {post.tags.map((user: User) => (
                    <Badge 
                      key={user.id} 
                      variant="outline" 
                      className="text-xs cursor-pointer hover:bg-gray-100 transition-colors"
                      onClick={() => onUserClick?.(user.id)}
                    >
                      {user.fullName}
                      {user.isVerified && (
                        <CheckCircle className="h-3 w-3 text-blue-600 ml-1" />
                      )}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Post Stats */}
        <div className="flex items-center space-x-6 text-sm text-gray-500">
          <div className="flex items-center space-x-1">
            <Star className="h-4 w-4" />
            <span>{post.points || 0} {t('posts.points')}</span>
          </div>
          <div className="flex items-center space-x-1">
            <MessageCircle className="h-4 w-4" />
            <span>{post.comments || 0} {t('posts.comments')}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-2 border-t">
          <div className="flex items-center space-x-2">
            <Button
              variant={post.userHasPointed ? "default" : "ghost"}
              size="sm"
              onClick={() => !post.userHasPointed && onGivePoint(post.id)}
              disabled={post.userHasPointed || isOwnPost}
              className={`${
                post.userHasPointed 
                  ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200' 
                  : 'hover:bg-yellow-50 hover:text-yellow-700'
              }`}
            >
              <Star className={`h-4 w-4 mr-1 ${post.userHasPointed ? 'fill-current' : ''}`} />
              {post.userHasPointed ? t('posts.pointed') : t('posts.givePoint')}
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => onComment(post)}
              className="hover:bg-blue-50 hover:text-blue-700"
            >
              <MessageCircle className="h-4 w-4 mr-1" />
              {t('posts.comment')}
            </Button>
          </div>

          {/* Share button removed per user request */}
        </div>
      </CardContent>
    </Card>
  );
}