'use client';

import { Box, Typography, Button } from '@mui/material';
import Link from 'next/link';
import { Add } from '@mui/icons-material';
import TaskList from '@/features/tasks/TaskList';

export default function TasksPage() {
  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Tasks
        </Typography>
        <Button
          component={Link}
          href="/tasks/new"
          variant="contained"
          startIcon={<Add />}
          sx={{ minWidth: 44, minHeight: 44 }}
        >
          New Task
        </Button>
      </Box>

      <TaskList />
    </Box>
  );
}
