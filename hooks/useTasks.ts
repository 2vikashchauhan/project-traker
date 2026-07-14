'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { Task, CreateTaskInput, UpdateTaskInput } from '@/types/task.types';
import { ListQueryParams } from '@/types/api.types';

/**
 * Query key factory for tasks.
 */
export const taskKeys = {
  all: ['tasks'] as const,
  lists: () => [...taskKeys.all] as const,
  list: (params?: ListQueryParams) => [...taskKeys.all, params] as const,
  details: () => [...taskKeys.all, 'detail'] as const,
  detail: (id: string) => ['tasks', id] as const,
};

/**
 * Fetch all tasks with optional search, filter, and sort parameters.
 */
export function useTasks(params?: ListQueryParams) {
  return useQuery({
    queryKey: taskKeys.list(params),
    queryFn: async () => {
      const { data } = await apiClient.get<Task[]>('/tasks', { params });
      return data;
    },
  });
}

/**
 * Fetch a single task by ID.
 */
export function useTask(id: string) {
  return useQuery({
    queryKey: taskKeys.detail(id),
    queryFn: async () => {
      const { data } = await apiClient.get<Task>(`/tasks/${id}`);
      return data;
    },
    enabled: !!id,
  });
}

/**
 * Create a new task. Invalidates task, project, and dashboard queries on success.
 */
export function useCreateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateTaskInput) => {
      const { data } = await apiClient.post<Task>('/tasks', input);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

/**
 * Update an existing task. Invalidates task, project, and dashboard queries on success.
 */
export function useUpdateTask(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateTaskInput) => {
      const { data } = await apiClient.put<Task>(`/tasks/${id}`, input);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

/**
 * Delete a task. Invalidates task, project, and dashboard queries on success.
 */
export function useDeleteTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await apiClient.delete<{ id: string }>(`/tasks/${id}`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}
