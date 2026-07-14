'use client';

import { Card, CardContent, Box, Typography, Chip } from '@mui/material';
import Link from 'next/link';
import { StatusBadge, PriorityBadge } from '@/components/common';
import type { Task } from '@/types/task.types';

interface TaskCardProps {
  task: Task;
}

export default function TaskCard({ task }: TaskCardProps) {
  const formattedDueDate = task.dueDate
    ? new Date(task.dueDate).toLocaleDateString()
    : null;

  return (
    <Card variant="outlined" sx={{ mb: 2 }}>
      <CardContent>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1, mb: 1 }}>
          <Typography
            variant="h6"
            component={Link}
            href={`/tasks/${task.id}`}
            sx={{
              textDecoration: 'none',
              color: 'primary.main',
              '&:hover': { textDecoration: 'underline' },
              flexGrow: 1,
            }}
          >
            {task.title}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1 }}>
          <StatusBadge status={task.status} />
          <PriorityBadge priority={task.priority} />
          {formattedDueDate && (
            <Typography variant="body2" color="text.secondary">
              Due: {formattedDueDate}
            </Typography>
          )}
          {task.assignedTo && (
            <Chip
              label={task.assignedTo}
              size="small"
              variant="outlined"
              aria-label={`Assigned to ${task.assignedTo}`}
            />
          )}
        </Box>
      </CardContent>
    </Card>
  );
}
