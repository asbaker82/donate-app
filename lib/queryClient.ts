import { QueryClient } from '@tanstack/react-query';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime:           2 * 60 * 1000,  // 2 min — serve cache, refetch in background
      gcTime:              24 * 60 * 60 * 1000, // 24 h in AsyncStorage
      retry:               2,
      refetchOnWindowFocus: false,
    },
  },
});

export const asyncStoragePersister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key:     '@yoink_it/query_cache',
});

export const QUERY_KEYS = {
  items:    ['items']  as const,
  profiles: ['profiles'] as const,
  profile:  (id: string) => ['profiles', id] as const,
  myNotifications: (userId: string) => ['notifications', userId] as const,
};
