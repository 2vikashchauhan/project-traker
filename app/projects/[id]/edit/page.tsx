'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Container, Typography, Paper } from '@mui/material';
import { ProjectForm } from '@/components/forms/ProjectForm';
import { useProject, useUpdateProject } from '@/hooks/useProjects';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import ErrorDisplay from '@/components/common/ErrorDisplay';
import type { CreateProjectInput } from '@/types/project.types';

export default function EditProjectPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const { data: project, isLoading, isError, error, refetch } = useProject(id);
  const updateProject = useUpdateProject(id);
  const [serverError, setServerError] = useState<string>('');

  const handleSubmit = async (data: CreateProjectInput) => {
    setServerError('');
    try {
      await updateProject.mutateAsync(data);
      router.push(`/projects/${id}`);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Failed to update project';
      setServerError(message);
    }
  };

  if (isLoading) {
    return <LoadingSpinner label="Loading project" />;
  }

  if (isError) {
    return (
      <ErrorDisplay
        message={error?.message ?? 'Failed to load project'}
        onRetry={() => refetch()}
      />
    );
  }

  if (!project) {
    return <ErrorDisplay message="Project not found" />;
  }

  const defaultValues = {
    name: project.name,
    description: project.description ?? undefined,
    priority: project.priority,
    startDate: project.startDate ?? undefined,
    dueDate: project.dueDate ?? undefined,
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Edit Project
      </Typography>
      <Paper sx={{ p: 3 }}>
        <ProjectForm
          defaultValues={defaultValues}
          onSubmit={handleSubmit}
          isSubmitting={updateProject.isPending}
          serverError={serverError}
        />
      </Paper>
    </Container>
  );
}
