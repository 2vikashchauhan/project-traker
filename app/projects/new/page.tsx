'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Container, Typography, Paper } from '@mui/material';
import { ProjectForm } from '@/components/forms/ProjectForm';
import { useCreateProject } from '@/hooks/useProjects';
import type { CreateProjectInput } from '@/types/project.types';

export default function NewProjectPage() {
  const router = useRouter();
  const createProject = useCreateProject();
  const [serverError, setServerError] = useState<string>('');

  const handleSubmit = async (data: CreateProjectInput) => {
    setServerError('');
    try {
      await createProject.mutateAsync(data);
      router.push('/projects');
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Failed to create project';
      setServerError(message);
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Create New Project
      </Typography>
      <Paper sx={{ p: 3 }}>
        <ProjectForm
          onSubmit={handleSubmit}
          isSubmitting={createProject.isPending}
          serverError={serverError}
        />
      </Paper>
    </Container>
  );
}
