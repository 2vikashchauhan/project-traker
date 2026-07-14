'use client';

import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { DashboardResponse } from '@/types/api.types';

export function useDashboard() {
  return useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const { data } = await apiClient.get<DashboardResponse>('/dashboard');
      return data;
    },
    staleTime: 30 * 1000, // 30 seconds
  });
}
