'use client';

import { useState } from 'react';
import { Box, Typography } from '@mui/material';
import { useProjects } from '@/hooks/useProjects';
import { ListQueryParams } from '@/types/api.types';
import { LoadingSpinner, ErrorDisplay } from '@/components/common';
import ProjectFilters from './ProjectFilters';
import ProjectCard from './ProjectCard';

export default function ProjectList() {
  const [params, setParams] = useState<ListQueryParams>({});
  const { data: projects, isLoading, isError, error, refetch } = useProjects(params);

  if (isLoading) {
    return <LoadingSpinner label="Loading projects" />;
  }

  if (isError) {
    return (
      <ErrorDisplay
        message={error?.message ?? 'Failed to load projects.'}
        onRetry={() => refetch()}
      />
    );
  }

  return (
    <Box>
      <ProjectFilters params={params} onChange={setParams} />

      {projects && projects.length > 0 ? (
        projects.map((project) => (
          <ProjectCard key={project.id} project={project} />
        ))
      ) : (
        <Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
          No projects found.
        </Typography>
      )}
    </Box>
  );
}
