import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { useMemo } from 'react';
import { QUERY_CONFIGS } from '@/utils/performance';

// Hook for optimized queries with intelligent defaults
export function useOptimizedQuery<T>(
  options: UseQueryOptions<T> & {
    queryType?: 'realtime' | 'frequent' | 'static' | 'admin';
  }
) {
  const { queryType = 'static', ...queryOptions } = options;
  
  const optimizedOptions = useMemo(() => {
    const baseConfig = QUERY_CONFIGS[queryType];
    
    return {
      ...baseConfig,
      ...queryOptions,
      // Smart refetch interval based on page visibility
      refetchInterval: typeof baseConfig.refetchInterval === 'function' 
        ? baseConfig.refetchInterval 
        : baseConfig.refetchInterval && !document.hidden 
          ? baseConfig.refetchInterval 
          : false,
    };
  }, [queryType, queryOptions]);
  
  return useQuery(optimizedOptions);
}

// Hook for intelligent prefetching
export function usePrefetchQuery<T>(
  queryKey: any[],
  queryFn: () => Promise<T>,
  options: {
    condition?: boolean;
    delay?: number;
    queryType?: 'realtime' | 'frequent' | 'static' | 'admin';
  } = {}
) {
  const { condition = true, delay = 0, queryType = 'static' } = options;
  
  useMemo(() => {
    if (!condition) return;
    
    const prefetch = () => {
      // Use query client to prefetch with optimized settings
      const config = QUERY_CONFIGS[queryType];
      // Implementation would go here for prefetching
    };
    
    if (delay > 0) {
      setTimeout(prefetch, delay);
    } else {
      prefetch();
    }
  }, [condition, delay, queryKey, queryFn, queryType]);
}