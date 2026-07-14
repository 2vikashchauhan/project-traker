'use client';

import { Box, Typography, Paper, Stack, Divider, Chip } from '@mui/material';
import Link from 'next/link';
import { StatusBadge, PriorityBadge } from '@/components/common';
import type { Task } from '@/types/task.types';

interface TaskDetailProps {
  task: Task;
}

export default function TaskDetail({ task }: TaskDetailProps) {
  const formattedDueDate = task.dueDate
    ? new Date(task.dueDate).toLocaleDateString()
    : 'Not set';

  const formattedCreatedAt = new Date(task.createdAt).toLocaleString();
  const formattedUpdatedAt = new Date(task.updatedAt).toLocaleString();

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h5" component="h2" gutterBottom>
        {task.title}
      </Typography>

      <Stack direction="row" spacing={1} sx={{ mb: 3 }}>
        <StatusBadge status={task.status} />
        <PriorityBadge priority={task.priority} />
      </Stack>

      <Divider sx={{ mb: 3 }} />

      <Stack spacing={2}>
        {task.description && (
          <Box>
            <Typography variant="subtitle2" color="text.secondary">
              Description
            </Typography>
            <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
              {task.description}
            </Typography>
          </Box>
        )}

        <Box>
          <Typography variant="subtitle2" color="text.secondary">
            Due Date
          </Typography>
          <Typography variant="body1">{formattedDueDate}</Typography>
        </Box>

        <Box>
          <Typography variant="subtitle2" color="text.secondary">
            Assigned To
          </Typography>
          {task.assignedTo ? (
            <Chip
              label={task.assignedTo}
              size="small"
              variant="outlined"
              aria-label={`Assigned to ${task.assignedTo}`}
            />
          ) : (
            <Typography variant="body1" color="text.secondary">
              Unassigned
            </Typography>
          )}
        </Box>

        <Box>
          <Typography variant="subtitle2" color="text.secondary">
            Project
          </Typography>
          <Typography
            component={Link}
            href={`/projects/${task.projectId}`}
            sx={{
              textDecoration: 'none',
              color: 'primary.main',
              '&:hover': { textDecoration: 'underline' },
            }}
          >
            View Project
          </Typography>
        </Box>

        <Divider />

        <Box sx={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          <Box>
            <Typography variant="subtitle2" color="text.secondary">
              Created
            </Typography>
            <Typography variant="body2">{formattedCreatedAt}</Typography>
          </Box>
          <Box>
            <Typography variant="subtitle2" color="text.secondary">
              Last Updated
            </Typography>
            <Typography variant="body2">{formattedUpdatedAt}</Typography>
          </Box>
        </Box>
      </Stack>
    </Paper>
  );
}
