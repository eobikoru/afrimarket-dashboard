'use client';

import { keepPreviousData, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from './api';

export function useApi<T>(path: string | null) {
  const client = useQueryClient();
  const query = useQuery({
    queryKey: ['admin', path],
    queryFn: () => api<T>(path as string),
    enabled: Boolean(path),
    placeholderData: keepPreviousData,
  });

  return {
    data: path ? ((query.data ?? null) as T | null) : null,
    error: path ? query.error : null,
    loading: Boolean(path) && query.isLoading,
    fetching: Boolean(path) && query.isFetching && !query.isLoading,
    reload: () => {
      if (!path) return;
      void client.invalidateQueries({ queryKey: ['admin', path] });
    },
  };
}
