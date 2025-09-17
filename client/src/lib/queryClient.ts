import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
  options?: RequestInit,
): Promise<Response> {
  // Check if data is FormData
  const isFormData = data instanceof FormData;
  
  const res = await fetch(url, {
    method,
    headers: isFormData ? {} : (data ? { "Content-Type": "application/json" } : {}),
    body: isFormData ? data : (data ? JSON.stringify(data) : undefined),
    credentials: "include",
    ...options, // Merge additional options like signal
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey.join("/") as string, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

// Performance-optimized query client configuration
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes default stale time
      gcTime: 10 * 60 * 1000, // 10 minutes garbage collection time
      retry: (failureCount, error: any) => {
        // Only retry on network errors, not server errors
        if (error?.message?.includes('500') || error?.message?.includes('404')) {
          return false;
        }
        return failureCount < 2;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
    mutations: {
      retry: false,
      onError: (error: any) => {
        // Global error handling for mutations
        console.error('Mutation error:', error);
      },
    },
  },
});

// Setup periodic cache cleanup
setInterval(() => {
  const cache = queryClient.getQueryCache();
  const queries = cache.getAll();
  
  // Remove stale queries older than 15 minutes
  queries.forEach(query => {
    const age = Date.now() - (query.state.dataUpdatedAt || 0);
    const isStale = age > 15 * 60 * 1000; // 15 minutes
    const hasNoObservers = query.observers.length === 0;
    
    if (isStale && hasNoObservers) {
      cache.remove(query);
    }
  });
}, 5 * 60 * 1000); // Run every 5 minutes
