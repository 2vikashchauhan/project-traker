'use client';

import { useState } from 'react';
import { Box, Typography, Button, Stack } from '@mui/material';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Edit, Delete, ArrowBack } from '@mui/icons-material';
import { useProject, useDeleteProject } from '@/hooks/useProjects';
import {
  LoadingSpinner,
  ErrorDisplay,
  ConfirmDialog,
} from '@/components/common';
import ProjectDetail from '@/features/projects/ProjectDetail';

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const { data: project, isLoading, error, refetch } = useProject(id);
  const deleteProject = useDeleteProject();

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const handleDelete = () => {
    deleteProject.mutate(id, {
      onSuccess: () => {
        router.push('/projects');
      },
    });
    setDeleteDialogOpen(false);
  };

  if (isLoading) {
    return <LoadingSpinner label="Loading project details" />;
  }

  if (error || !project) {
    return (
      <Box sx={{ p: { xs: 2, md: 3 } }}>
        <ErrorDisplay
          message={
            error?.message || 'Failed to load project. It may not exist.'
          }
          onRetry={() => refetch()}
        />
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 3,
          flexWrap: 'wrap',
          gap: 1,
        }}
      >
        <Button
          component={Link}
          href="/projects"
          startIcon={<ArrowBack />}
          sx={{ minHeight: 44, minWidth: 44 }}
        >
          Back to Projects
        </Button>

        <Stack direction="row" spacing={1}>
          <Button
            variant="outlined"
            startIcon={<Edit />}
            component={Link}
            href={`/projects/${id}/edit`}
            sx={{ minHeight: 44, minWidth: 44 }}
          >
            Edit
          </Button>
          <Button
            variant="outlined"
            color="error"
            startIcon={<Delete />}
            onClick={() => setDeleteDialogOpen(true)}
            sx={{ minHeight: 44, minWidth: 44 }}
          >
            Delete
          </Button>
        </Stack>
      </Box>

      <ProjectDetail project={project} />

      <ConfirmDialog
        open={deleteDialogOpen}
        title="Delete Project"
        message={`Are you sure you want to delete "${project.name}"? This will also permanently delete all ${project.tasks.length} associated task(s). This action cannot be undone.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteDialogOpen(false)}
      />
    </Box>
  );
}
