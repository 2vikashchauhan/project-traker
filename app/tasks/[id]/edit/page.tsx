'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Box, Typography } from '@mui/material';
import TaskForm from '@/components/forms/TaskForm';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import ErrorDisplay from '@/components/common/ErrorDisplay';
import { useTask, useUpdateTask } from '@/hooks/useTasks';
import { CreateTaskInput } from '@/types/task.types';

export default function EditTaskPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const { data: task, isLoading, error } = useTask(id);
  const updateTask = useUpdateTask(id);
  const [serverError, setServerError] = useState<string>('');

  const handleSubmit = async (data: CreateTaskInput) => {
    setServerError('');
    try {
      await updateTask.mutateAsync(data);
      router.push(`/tasks/${id}`);
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosError = err as { response?: { data?: { message?: string } } };
        setServerError(
          axiosError.response?.data?.message || 'Failed to update task. Please try again.'
        );
      } else {
        setServerError('Failed to update task. Please try again.');
      }
    }
  };

  if (isLoading) {
    return <LoadingSpinner label="Loading task" />;
  }

  if (error || !task) {
    return (
      <ErrorDisplay
        message="Failed to load task data."
        onRetry={() => window.location.reload()}
      />
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" component="h1" sx={{ mb: 3 }}>
        Edit Task
      </Typography>

      <TaskForm
        defaultValues={{
          title: task.title,
          description: task.description ?? undefined,
          priority: task.priority,
          projectId: task.projectId,
          dueDate: task.dueDate ?? undefined,
          assignedTo: task.assignedTo ?? undefined,
        }}
        onSubmit={handleSubmit}
        isSubmitting={updateTask.isPending}
        serverError={serverError}
      />
    </Box>
  );
}
