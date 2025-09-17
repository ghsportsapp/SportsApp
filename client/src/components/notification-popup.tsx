import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { X, Bell, CheckCircle, XCircle, MessageCircle, Award, Target, ThumbsUp } from "lucide-react";
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

interface NotificationPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onPostClick: (postId: number) => void;
  onProfileClick: (userId: number) => void;
}

export function NotificationPopup({ isOpen, onClose, onPostClick, onProfileClick }: NotificationPopupProps) {
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  const { data: notifications = [], isLoading } = useQuery<Notification[]>({
    queryKey: ['/api/notifications'],
    enabled: isOpen,
  });

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
      // For verification notifications, redirect to user's own profile
      onProfileClick(notification.userId || 0);
    } else if (notification.type === "drill_approved" || notification.type === "drill_rejected") {
      // Extract sport from the notification message and navigate to drills page
      const sportMatch = notification.message.match(/for (\w+) -/);
      const sport = sportMatch ? sportMatch[1] : null;
      
      if (sport) {
        setLocation(`/drills?sport=${sport}`);
      } else {
        setLocation("/drills");
      }
      onClose();
    } else if (notification.post) {
      onPostClick(notification.post.id);
    }

    if (notification.type !== "drill_approved" && notification.type !== "drill_rejected") {
      onClose();
    }
  };

  const getNotificationIcon = (notification: Notification) => {
    if (notification.fromUser?.profilePicture) {
      return (
        <Avatar className="h-10 w-10">
          <AvatarImage src={notification.fromUser.profilePicture} alt={notification.fromUser.fullName} />
          <AvatarFallback>{notification.fromUser.fullName.charAt(0)}</AvatarFallback>
        </Avatar>
      );
    }

    return (
      <Avatar className="h-10 w-10">
        <AvatarFallback>
          {notification.fromUser?.fullName.charAt(0) || <Bell className="h-5 w-5" />}
        </AvatarFallback>
      </Avatar>
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="fixed top-0 right-0 h-full w-full sm:w-1/3 sm:max-w-none rounded-none sm:rounded-l-lg border-0 sm:border-l p-0 data-[state=open]:slide-in-from-right">
        <DialogHeader className="p-4 border-b flex flex-row items-center justify-between space-y-0">
          <DialogTitle className="text-lg font-semibold">Notifications</DialogTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>

        <ScrollArea className="flex-1 p-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Bell className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No notifications yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={cn(
                    "flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-colors",
                    notification.isRead 
                      ? "bg-gray-50 hover:bg-gray-100" 
                      : "bg-blue-50 hover:bg-blue-100 border border-blue-200"
                  )}
                >
                  {/* Left: Profile picture or icon */}
                  <div className="flex-shrink-0">
                    {getNotificationIcon(notification)}
                  </div>

                  {/* Center: Message */}
                  <div className="flex-1 min-w-0">
                    <p className={cn(
                      "text-sm",
                      notification.isRead ? "text-gray-700" : "text-gray-900 font-medium"
                    )}>
                      {notification.message}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
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
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}