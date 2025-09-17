// Global query optimization utilities

import { QueryClient } from '@tanstack/react-query';

// Smart cache invalidation patterns
export const CACHE_PATTERNS = {
  POSTS: '/api/posts',
  USERS: '/api/users',
  CONVERSATIONS: '/api/conversations',
  NOTIFICATIONS: '/api/notifications',
  ADMIN: '/api/admin',
} as const;

// Batch invalidation for better performance
export function batchInvalidateQueries(
  queryClient: QueryClient, 
  patterns: string[]
) {
  // Use a single frame to batch all invalidations
  requestAnimationFrame(() => {
    patterns.forEach(pattern => {
      queryClient.invalidateQueries({
        predicate: query => 
          query.queryKey.some(key => 
            typeof key === 'string' && key.includes(pattern)
          ),
      });
    });
  });
}

// Smart prefetching for common navigation patterns
export function prefetchCommonRoutes(queryClient: QueryClient, userId?: number) {
  if (!userId) return;

  // Prefetch user profile (likely to be visited)
  queryClient.prefetchQuery({
    queryKey: [`/api/users/${userId}/profile`],
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  // Prefetch feed data (most common destination)
  queryClient.prefetchQuery({
    queryKey: ['/api/posts', 'all'],
    staleTime: 30 * 1000, // 30 seconds
  });
}

// Cleanup stale queries to free memory
export function cleanupStaleQueries(queryClient: QueryClient) {
  // Remove queries older than 10 minutes
  queryClient.getQueryCache().getAll().forEach(query => {
    const queryAge = Date.now() - (query.state.dataUpdatedAt || 0);
    if (queryAge > 10 * 60 * 1000) {
      queryClient.removeQueries({ queryKey: query.queryKey });
    }
  });
}

// Optimize query cache size
export function optimizeQueryCache(queryClient: QueryClient) {
  const cache = queryClient.getQueryCache();
  const maxQueries = 50; // Limit total queries in cache
  
  if (cache.getAll().length > maxQueries) {
    // Remove oldest queries that aren't currently active
    const sortedQueries = cache.getAll()
      .filter(query => !query.observers.length) // Not actively observed
      .sort((a, b) => (a.state.dataUpdatedAt || 0) - (b.state.dataUpdatedAt || 0));
    
    // Remove oldest 25% of queries
    const toRemove = sortedQueries.slice(0, Math.floor(sortedQueries.length * 0.25));
    toRemove.forEach(query => {
      queryClient.removeQueries({ queryKey: query.queryKey });
    });
  }
}

// Page visibility optimizations
export function setupVisibilityOptimizations(queryClient: QueryClient) {
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      // Page is hidden, reduce activity
      cleanupStaleQueries(queryClient);
    } else {
      // Page is visible, invalidate stale critical data
      const criticalQueries = [
        '/api/posts',
        '/api/conversations/unread-count',
        '/api/notifications/unread-count',
      ];
      
      criticalQueries.forEach(pattern => {
        queryClient.invalidateQueries({
          predicate: query => 
            query.queryKey.some(key => 
              typeof key === 'string' && key.includes(pattern)
            ),
        });
      });
    }
  });
}

// Connection-aware optimizations
export function setupConnectionOptimizations(queryClient: QueryClient) {
  // Listen for online/offline events
  window.addEventListener('online', () => {
    // When back online, refetch critical data
    queryClient.invalidateQueries();
  });

  window.addEventListener('offline', () => {
    // When offline, stop all background fetching
    queryClient.getQueryCache().getAll().forEach(query => {
      query.cancel();
    });
  });

  // Check connection quality and adjust polling
  if ('connection' in navigator) {
    const connection = (navigator as any).connection;
    
    if (connection) {
      const updatePollingBasedOnConnection = () => {
        const effectiveType = connection.effectiveType;
        
        // Adjust default polling intervals based on connection
        if (effectiveType === 'slow-2g' || effectiveType === '2g') {
          // Slow connection: reduce polling frequency
          queryClient.setDefaultOptions({
            queries: {
              refetchInterval: 60000, // 1 minute
            },
          });
        } else if (effectiveType === '3g') {
          // Medium connection: moderate polling
          queryClient.setDefaultOptions({
            queries: {
              refetchInterval: 30000, // 30 seconds
            },
          });
        }
        // 4g and above use default settings
      };
      
      connection.addEventListener('change', updatePollingBasedOnConnection);
      updatePollingBasedOnConnection(); // Initial setup
    }
  }
}