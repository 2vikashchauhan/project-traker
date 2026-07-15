'use client';

import { Box, Typography, Button } from '@mui/material';
import Link from 'next/link';
import { Add } from '@mui/icons-material';
import ProjectList from '@/features/projects/ProjectList';

export default function ProjectsPage() {
  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 3,
        }}
      >
        <Typography variant="h4" component="h1">
          Projects
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          component={Link}
          href="/projects/new"
          sx={{ minHeight: 44, minWidth: 44 }}
        >
          New Project
        </Button>
      </Box>

      <ProjectList />
    </Box>
  );
}
