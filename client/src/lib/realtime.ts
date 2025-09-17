import { queryClient } from '@/lib/queryClient';

// Types for real-time events
interface UserUpdateEvent {
  userId: number;
  patch: {
    username?: string;
    fullName?: string;
    bio?: string;
    profilePicture?: string;
  };
}

interface RealtimeEventData {
  'user.updated': UserUpdateEvent;
  'heartbeat': { timestamp: number };
  'connected': { timestamp: number };
}

// Real-time event bus class
class RealtimeEventBus {
  private eventSource: EventSource | null = null;
  private broadcastChannel: BroadcastChannel;
  private isConnected = false;
  private reconnectAttempts = 0;
  private reconnectDelay = 1000;

  constructor() {
    this.broadcastChannel = new BroadcastChannel('sportsapp-realtime');
    this.broadcastChannel.addEventListener('message', this.handleBroadcastMessage.bind(this));
  }

  // Initialize SSE connection
  connect() {
    if (this.eventSource?.readyState === EventSource.OPEN) {
      return;
    }

    // Close existing connection if any to prevent duplicates
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }

    try {
      this.eventSource = new EventSource('/api/events', { 
        withCredentials: true 
      });

      this.eventSource.onopen = () => {
        this.isConnected = true;
        this.reconnectAttempts = 0;
      };

      this.eventSource.onerror = () => {
        this.isConnected = false;
        this.handleReconnect();
      };

      this.eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleSSEMessage(event.type || 'message', data);
        } catch (error) {
          // Silently handle parsing errors in production
        }
      };

      // Listen for specific event types
      this.eventSource.addEventListener('user.updated', (event) => {
        try {
          const data: UserUpdateEvent = JSON.parse(event.data);
          this.handleUserUpdate(data);
          // Broadcast to other tabs
          this.broadcastChannel.postMessage({ type: 'user.updated', data });
        } catch (error) {
          // Silently handle user update errors in production
        }
      });

      this.eventSource.addEventListener('heartbeat', (event) => {
        // Keep connection alive
        try {
          const data = JSON.parse(event.data);
          // Optional: update last heartbeat timestamp
        } catch (error) {
          // Silently handle heartbeat errors in production
        }
      });

      this.eventSource.addEventListener('connected', () => {
        // Connection confirmed
      });

    } catch (error) {
      this.handleReconnect();
    }
  }

  // Handle reconnection logic with infinite attempts
  private handleReconnect() {
    this.reconnectAttempts++;
    const delay = Math.min(this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1), 30000); // Cap at 30s
    
    setTimeout(() => {
      this.connect();
    }, delay);
  }

  // Reset reconnection attempts (call when auth state changes)
  resetReconnectAttempts() {
    this.reconnectAttempts = 0;
  }

  // Handle messages from other browser tabs
  private handleBroadcastMessage(event: MessageEvent) {
    const { type, data } = event.data;
    
    switch (type) {
      case 'user.updated':
        this.handleUserUpdate(data);
        break;
      default:
        // Unknown broadcast message type
    }
  }

  // Handle SSE messages
  private handleSSEMessage(type: string, data: any) {
    // Handle different message types if needed
  }

  // Smart cache update helper for user profile changes
  private handleUserUpdate(eventData: UserUpdateEvent) {
    const { userId, patch } = eventData;
    
    // Updating user profile cache
    
    // Update user profile cache
    queryClient.setQueryData(['/api/users', userId, 'profile'], (oldData: any) => {
      if (!oldData) return oldData;
      return { ...oldData, ...patch };
    });

    // Update current user cache if it matches
    queryClient.setQueryData(['/api/user'], (oldData: any) => {
      if (!oldData || oldData.id !== userId) return oldData;
      return { ...oldData, ...patch };
    });

    // Update posts caches - find all post-related queries and update user info
    queryClient.getQueryCache().getAll().forEach((query) => {
      const queryKey = query.queryKey;
      
      // Update main posts feed
      if (queryKey[0] === '/api/posts') {
        queryClient.setQueryData(queryKey, (oldData: any) => {
          if (!oldData || !Array.isArray(oldData)) return oldData;
          
          return oldData.map((post: any) => {
            if (post.userId === userId || post.user?.id === userId) {
              return {
                ...post,
                user: post.user ? { ...post.user, ...patch } : post.user,
                // Also update direct user fields on posts if they exist
                ...(post.userId === userId && patch.username && { username: patch.username }),
                ...(post.userId === userId && patch.profilePicture && { profilePicture: patch.profilePicture }),
              };
            }
            return post;
          });
        });
      }
      
      // Update user-specific posts
      if (queryKey[0] === '/api/users' && queryKey[2] === 'posts' && parseInt(queryKey[1] as string) === userId) {
        queryClient.setQueryData(queryKey, (oldData: any) => {
          if (!oldData || !Array.isArray(oldData)) return oldData;
          
          return oldData.map((post: any) => ({
            ...post,
            user: post.user ? { ...post.user, ...patch } : post.user,
            // Update direct user fields on posts if they exist
            ...(patch.username && { username: patch.username }),
            ...(patch.profilePicture && { profilePicture: patch.profilePicture }),
          }));
        });
      }
    });

    // Optionally invalidate related queries for fresh data
    queryClient.invalidateQueries({ 
      queryKey: ['/api/posts'],
      exact: false 
    });
    
    // Profile cache updated successfully
  }

  // Publish events for optimistic updates
  publishUserUpdate(userId: number, patch: UserUpdateEvent['patch']) {
    // Apply optimistic update immediately
    this.handleUserUpdate({ userId, patch });
    
    // Broadcast to other tabs for immediate cross-tab sync
    this.broadcastChannel.postMessage({ 
      type: 'user.updated', 
      data: { userId, patch } 
    });
  }

  // Disconnect and cleanup
  disconnect() {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
    this.isConnected = false;
    // Real-time connection closed
  }

  // Get connection status
  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      readyState: this.eventSource?.readyState,
      reconnectAttempts: this.reconnectAttempts
    };
  }
}

// Export singleton instance
export const realtimeEventBus = new RealtimeEventBus();

// Export for manual control if needed
export default realtimeEventBus;