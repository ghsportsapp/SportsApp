import { useMemo } from 'react';

// Debounce utility for performance-critical operations
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number,
  immediate?: boolean
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      if (!immediate) func(...args);
    };
    
    const callNow = immediate && !timeout;
    
    if (timeout !== null) {
      clearTimeout(timeout);
    }
    
    timeout = setTimeout(later, wait);
    
    if (callNow) func(...args);
  };
}

// Throttle utility for limiting function calls
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  
  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

// Performance-optimized memo hook for complex computations
export function useStableMemo<T>(
  factory: () => T,
  deps: React.DependencyList
): T {
  return useMemo(factory, deps);
}

// Smart polling intervals based on page visibility
export function getSmartPollingInterval(baseInterval: number): number {
  if (typeof document === 'undefined') return baseInterval;
  
  return document.hidden ? baseInterval * 3 : baseInterval;
}

// Optimized query configurations for different data types
export const QUERY_CONFIGS = {
  // Real-time data (messages, notifications)
  realtime: {
    refetchInterval: () => getSmartPollingInterval(3000),
    staleTime: 1000,
    cacheTime: 5 * 60 * 1000, // 5 minutes
  },
  
  // Frequently updated data (posts, feeds)
  frequent: {
    refetchInterval: () => getSmartPollingInterval(10000),
    staleTime: 5000,
    cacheTime: 10 * 60 * 1000, // 10 minutes
  },
  
  // Static data (user profiles, settings)
  static: {
    refetchInterval: false,
    staleTime: 30 * 60 * 1000, // 30 minutes
    cacheTime: 60 * 60 * 1000, // 1 hour
  },
  
  // Admin data (management pages)
  admin: {
    refetchInterval: () => getSmartPollingInterval(15000),
    staleTime: 10000,
    cacheTime: 15 * 60 * 1000, // 15 minutes
  },
} as const;

// Intersection Observer for lazy loading
export function createIntersectionObserver(
  callback: IntersectionObserverCallback,
  options?: IntersectionObserverInit
): IntersectionObserver {
  const defaultOptions: IntersectionObserverInit = {
    root: null,
    rootMargin: '50px',
    threshold: 0.1,
    ...options,
  };
  
  return new IntersectionObserver(callback, defaultOptions);
}

// Memory cleanup utilities
export function cleanupQueryCache(queryClient: any, patterns: string[]) {
  patterns.forEach(pattern => {
    queryClient.removeQueries({
      predicate: (query: any) => 
        query.queryKey.some((key: string) => 
          typeof key === 'string' && key.includes(pattern)
        ),
    });
  });
}

// Performance monitoring utility
export function measurePerformance<T>(
  name: string,
  fn: () => T
): T {
  if (typeof performance === 'undefined') return fn();
  
  const start = performance.now();
  const result = fn();
  const end = performance.now();
  
  if (import.meta.env.DEV) {
    console.log(`🚀 Performance: ${name} took ${(end - start).toFixed(2)}ms`);
  }
  
  return result;
}