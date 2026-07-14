'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Typography } from '@mui/material';
import TaskForm from '@/components/forms/TaskForm';
import { useCreateTask } from '@/hooks/useTasks';
import { CreateTaskInput } from '@/types/task.types';

export default function NewTaskPage() {
  const router = useRouter();
  const createTask = useCreateTask();
  const [serverError, setServerError] = useState<string>('');

  const handleSubmit = async (data: CreateTaskInput) => {
    setServerError('');
    try {
      await createTask.mutateAsync(data);
      router.push('/tasks');
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { data?: { message?: string } } };
        setServerError(
          axiosError.response?.data?.message || 'Failed to create task. Please try again.'
        );
      } else {
        setServerError('Failed to create task. Please try again.');
      }
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" component="h1" sx={{ mb: 3 }}>
        Create New Task
      </Typography>

      <TaskForm
        onSubmit={handleSubmit}
        isSubmitting={createTask.isPending}
        serverError={serverError}
      />
    </Box>
  );
}
