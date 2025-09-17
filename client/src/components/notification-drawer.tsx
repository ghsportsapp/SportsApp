import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
// No longer using Dialog components - using direct div structure like search popup
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { X, Bell, CheckCircle, XCircle, MessageCircle, Award, Target, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { useIsMobile } from "@/hooks/use-mobile";

type Notification = {
  id: number;
  userId: number;
  type: "point" | "comment" | "verification_approved" | "verification_rejected" | "drill_approved" | "drill_rejected" | "tryout_approved" | "tryout_rejected";
  message: string;
  isRead: boolean;
  createdAt: string;
  fromUser?: {
    id: number;
    username: string;
    fullName: string;
    profilePicture?: string;
  };
  post?: {
    id: number;
    type: string;
    content: string;
    mediaUrl?: string;
    user: {
      id: number;
      username: string;
      fullName: string;
    };
  };
  comment?: {
    id: number;
    content: string;
  };
};

export function NotificationDrawer({
  isOpen,
  onClose,
  onPostClick,
  onProfileClick,
}: {
  isOpen: boolean;
  onClose: () => void;
  onPostClick: (postId: number) => void;
  onProfileClick: (userId: number) => void;
}) {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();

  const { data: notifications = [], isLoading, isError, error } = useQuery<Notification[]>({
    queryKey: ['/api/notifications'],
    enabled: isOpen, // Only fetch when drawer is open
    refetchInterval: isOpen ? 2000 : false, // Real-time updates only when open
    staleTime: 1000, // Consider data stale after 1 second
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
    retry: 1, // Only retry once on failure
  });

  // Mark all notifications as seen when drawer opens
  const markAllAsSeenMutation = useMutation({
    mutationFn: () => apiRequest("PATCH", "/api/notifications/mark-all-seen"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      queryClient.invalidateQueries({ queryKey: ['/api/notifications/unread-count'] });
    },
    onError: () => {
      // Failed to mark notifications as seen
    },
  });

  useEffect(() => {
    if (isOpen && notifications.length > 0) {
      // Mark all notifications as seen when drawer opens and notifications are loaded
      markAllAsSeenMutation.mutate();
    }
  }, [isOpen, notifications.length]);

  const markAsReadMutation = useMutation({
    mutationFn: (notificationId: number) => 
      apiRequest("PATCH", `/api/notifications/${notificationId}/read`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      queryClient.invalidateQueries({ queryKey: ['/api/notifications/unread-count'] });
    },
  });

  const handleNotificationClick = (notification: Notification) => {
    // Mark as read if not already read
    if (!notification.isRead) {
      markAsReadMutation.mutate(notification.id);
    }

    // Navigate based on notification type
    if (notification.type === "verification_approved" || notification.type === "verification_rejected") {
      onProfileClick(notification.userId || 0);
    } else if (notification.type === "drill_approved" || notification.type === "drill_rejected") {
      const sportMatch = notification.message.match(/for (\w+) -/);
      const sport = sportMatch ? sportMatch[1] : null;
      
      if (sport) {
        setLocation(`/drills?sport=${sport}`);
      } else {
        setLocation("/drills");
      }
      onClose();
    } else if (notification.type === "tryout_approved" || notification.type === "tryout_rejected") {
      setLocation("/tryouts");
      onClose();
    } else if (notification.post) {
      onPostClick(notification.post.id);
    }

    if (notification.type !== "drill_approved" && notification.type !== "drill_rejected" && notification.type !== "tryout_approved" && notification.type !== "tryout_rejected") {
      onClose();
    }
  };

  const getNotificationIcon = (notification: Notification) => {
    // For point and comment notifications, show user's profile picture if available
    if ((notification.type === "point" || notification.type === "comment") && notification.fromUser) {
      if (notification.fromUser.profilePicture) {
        return (
          <Avatar className="h-10 w-10">
            <AvatarImage src={notification.fromUser.profilePicture} alt={notification.fromUser.fullName} />
            <AvatarFallback>{notification.fromUser.fullName.charAt(0)}</AvatarFallback>
          </Avatar>
        );
      } else {
        return (
          <Avatar className="h-10 w-10">
            <AvatarFallback>{notification.fromUser.fullName.charAt(0)}</AvatarFallback>
          </Avatar>
        );
      }
    }

    // For system notifications, show appropriate icon with proper colors
    const iconMap = {
      point: <Star className="h-5 w-5 text-yellow-500" />,
      comment: <MessageCircle className="h-5 w-5 text-blue-500" />,
      verification_approved: <CheckCircle className="h-5 w-5 text-green-500" />,
      verification_rejected: <XCircle className="h-5 w-5 text-red-500" />,
      drill_approved: <Award className="h-5 w-5 text-green-500" />,
      drill_rejected: <XCircle className="h-5 w-5 text-red-500" />,
      tryout_approved: <Target className="h-5 w-5 text-green-500" />,
      tryout_rejected: <XCircle className="h-5 w-5 text-red-500" />,
    };

    return (
      <div className="h-10 w-10 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
        {iconMap[notification.type] || <Bell className="h-5 w-5 text-gray-600" />}
      </div>
    );
  };

  const getPostThumbnail = (post?: Notification['post']) => {
    if (!post) return null;

    if (post.type === "photo" && post.mediaUrl) {
      return (
        <div className="w-12 h-12 rounded bg-gray-100 overflow-hidden flex-shrink-0">
          <img 
            src={post.mediaUrl} 
            alt="Post thumbnail" 
            className="w-full h-full object-cover"
          />
        </div>
      );
    }

    if (post.type === "video" && post.mediaUrl) {
      return (
        <div className="w-12 h-12 rounded bg-gray-100 overflow-hidden flex-shrink-0 relative">
          <video className="w-full h-full object-cover">
            <source src={post.mediaUrl} />
          </video>
          <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center">
            <div className="w-4 h-4 bg-white rounded-full flex items-center justify-center">
              <div className="w-2 h-2 bg-black rounded-full"></div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="w-12 h-12 rounded bg-blue-100 flex-shrink-0 flex items-center justify-center">
        <span className="text-xs text-blue-600 font-semibold">T</span>
      </div>
    );
  };

  const NotificationContent = () => (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Notifications
        </h2>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onClose();
          }} 
          className="h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-sm text-gray-500">Loading notifications...</p>
          </div>
        ) : isError ? (
          <div className="text-center py-8 text-red-500 dark:text-red-400">
            <Bell className="h-12 w-12 mx-auto mb-4 text-red-300 dark:text-red-600" />
            <p>Failed to load notifications</p>
            <p className="text-xs mt-2 text-gray-500">{error?.message || 'Please try again'}</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <Bell className="h-12 w-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
            <p>No notifications yet</p>
            <p className="text-xs mt-2">You'll see updates about posts, comments, and more here.</p>
          </div>
        ) : (
          <div className="p-4 space-y-3">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                onClick={() => handleNotificationClick(notification)}
                className={cn(
                  "flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-colors",
                  notification.isRead 
                    ? "bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700" 
                    : "bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/40 border border-blue-200 dark:border-blue-700"
                )}
              >
                {/* Left: Profile picture or icon */}
                <div className="flex-shrink-0">
                  {getNotificationIcon(notification)}
                </div>

                {/* Center: Message */}
                <div className="flex-1 min-w-0">
                  <p className={cn(
                    "text-sm leading-relaxed",
                    notification.isRead 
                      ? "text-gray-700 dark:text-gray-300" 
                      : "text-gray-900 dark:text-white font-medium"
                  )}>
                    {notification.message}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {format(new Date(notification.createdAt), "MMM d, h:mm a")}
                  </p>
                </div>

                {/* Right: Post thumbnail */}
                {notification.post && (
                  <div className="flex-shrink-0">
                    {getPostThumbnail(notification.post)}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  // Don't render if not open
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={(e) => {
          e.preventDefault();
          onClose();
        }}
      />
      
      {/* Popup */}
      <div 
        className={`
          relative bg-white dark:bg-gray-900 shadow-xl z-50 overflow-hidden transition-transform duration-200
          ${isMobile 
            ? 'w-full h-full' 
            : 'ml-auto w-1/3 min-w-[400px] h-full'
          }
        `}
        onClick={(e) => e.stopPropagation()}
      >
        <NotificationContent />
      </div>
    </div>
  );
}