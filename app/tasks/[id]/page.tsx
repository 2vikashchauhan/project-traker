'use client';

import { useState } from 'react';
import { Box, Typography, Button, Stack } from '@mui/material';
import { Edit, Delete } from '@mui/icons-material';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useTask, useDeleteTask } from '@/hooks/useTasks';
import { LoadingSpinner, ErrorDisplay, ConfirmDialog } from '@/components/common';
import TaskDetail from '@/features/tasks/TaskDetail';

export default function TaskDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const { data: task, isLoading, error, refetch } = useTask(id);
  const deleteTask = useDeleteTask();

  const [confirmOpen, setConfirmOpen] = useState(false);

  const handleDelete = () => {
    deleteTask.mutate(id, {
      onSuccess: () => {
        router.push('/tasks');
      },
    });
  };

  if (isLoading) {
    return <LoadingSpinner label="Loading task details" />;
  }

  if (error || !task) {
    return (
      <Box sx={{ p: 3 }}>
        <ErrorDisplay
          message={error?.message || 'Task not found'}
          onRetry={() => refetch()}
        />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h4" component="h1">
          Task Details
        </Typography>
        <Stack direction="row" spacing={1}>
          <Button
            component={Link}
            href={`/tasks/${id}/edit`}
            variant="outlined"
            startIcon={<Edit />}
            sx={{ minWidth: 44, minHeight: 44 }}
          >
            Edit
          </Button>
          <Button
            variant="outlined"
            color="error"
            startIcon={<Delete />}
            onClick={() => setConfirmOpen(true)}
            sx={{ minWidth: 44, minHeight: 44 }}
          >
            Delete
          </Button>
        </Stack>
      </Box>

      <TaskDetail task={task} />

      <ConfirmDialog
        open={confirmOpen}
        title="Delete Task"
        message="Are you sure you want to delete this task? This action cannot be undone."
        onConfirm={handleDelete}
        onCancel={() => setConfirmOpen(false)}
      />
    </Box>
  );
}
