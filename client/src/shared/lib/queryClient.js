import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,   // 5 minutes baseline fresh time
      gcTime: 30 * 60 * 1000,      // 30 minutes cache retention
      cacheTime: 30 * 60 * 1000,   // backwards-compatibility alias for TanStack Query
      refetchOnWindowFocus: false, // Prevent refetch on window focus
      refetchOnMount: false,       // Use cached data on mount if fresh
      retry: 1,                    // Retry once on failure before throwing
    },
  },
});
