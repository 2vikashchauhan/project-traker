'use client';

import { Card, CardContent, Typography, Box, Stack } from '@mui/material';
import Link from 'next/link';
import { StatusBadge, PriorityBadge, ProgressBar } from '@/components/common';
import { Project } from '@/types/project.types';

interface ProjectCardProps {
  project: Project;
}

export default function ProjectCard({ project }: ProjectCardProps) {
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString();
  };

  return (
    <Card variant="outlined" sx={{ mb: 2 }}>
      <CardContent>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            flexWrap: 'wrap',
            gap: 1,
            mb: 1,
          }}
        >
          <Typography
            variant="h6"
            component={Link}
            href={`/projects/${project.id}`}
            sx={{ textDecoration: 'none', color: 'primary.main' }}
          >
            {project.name}
          </Typography>
          <Stack direction="row" spacing={1}>
            <StatusBadge status={project.status} />
            <PriorityBadge priority={project.priority} />
          </Stack>
        </Box>

        <Box sx={{ mb: 1.5 }}>
          <ProgressBar value={project.progress} />
        </Box>

        <Stack
          direction="row"
          spacing={2}
          sx={{ color: 'text.secondary' }}
        >
          <Typography variant="body2">
            Start: {formatDate(project.startDate)}
          </Typography>
          <Typography variant="body2">
            Due: {formatDate(project.dueDate)}
          </Typography>
        </Stack>
      </CardContent>
    </Card>
  );
}
