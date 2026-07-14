'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { Project, ProjectWithTasks, CreateProjectInput, UpdateProjectInput } from '@/types/project.types';
import { ListQueryParams } from '@/types/api.types';

export const PROJECTS_KEY = ['projects'];
export const DASHBOARD_KEY = ['dashboard'];

/**
 * Fetches a list of projects with optional search, filter, and sort parameters.
 */
export function useProjects(params?: ListQueryParams) {
  return useQuery({
    queryKey: [...PROJECTS_KEY, params],
    queryFn: async () => {
      const { data } = await apiClient.get<Project[]>('/projects', { params });
      return data;
    },
  });
}

/**
 * Fetches a single project by ID, including its associated tasks.
 */
export function useProject(id: string) {
  return useQuery({
    queryKey: [...PROJECTS_KEY, id],
    queryFn: async () => {
      const { data } = await apiClient.get<ProjectWithTasks>(`/projects/${id}`);
      return data;
    },
    enabled: !!id,
  });
}

/**
 * Creates a new project. Invalidates project and dashboard queries on success.
 */
export function useCreateProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateProjectInput) => {
      const { data } = await apiClient.post<Project>('/projects', input);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PROJECTS_KEY });
      queryClient.invalidateQueries({ queryKey: DASHBOARD_KEY });
    },
  });
}

/**
 * Updates an existing project. Invalidates project and dashboard queries on success.
 */
export function useUpdateProject(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: UpdateProjectInput) => {
      const { data } = await apiClient.put<Project>(`/projects/${id}`, input);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PROJECTS_KEY });
      queryClient.invalidateQueries({ queryKey: DASHBOARD_KEY });
    },
  });
}

/**
 * Deletes a project by ID. Invalidates project and dashboard queries on success.
 */
export function useDeleteProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await apiClient.delete<{ id: string }>(`/projects/${id}`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PROJECTS_KEY });
      queryClient.invalidateQueries({ queryKey: DASHBOARD_KEY });
    },
  });
}
