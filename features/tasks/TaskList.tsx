'use client';

import { useState } from 'react';
import { Box, Typography } from '@mui/material';
import { useTasks } from '@/hooks/useTasks';
import { LoadingSpinner, ErrorDisplay } from '@/components/common';
import TaskFilters from './TaskFilters';
import TaskCard from './TaskCard';
import type { ListQueryParams } from '@/types/api.types';

export default function TaskList() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [priority, setPriority] = useState('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const params: ListQueryParams = {
    ...(search.trim() && { search: search.trim() }),
    ...(status && { status }),
    ...(priority && { priority }),
    sortBy: 'dueDate',
    sortOrder,
  };

  const { data: tasks, isLoading, isError, error, refetch } = useTasks(params);

  if (isLoading) {
    return <LoadingSpinner label="Loading tasks" />;
  }

  if (isError) {
    return (
      <ErrorDisplay
        message={error?.message || 'Failed to load tasks'}
        onRetry={() => refetch()}
      />
    );
  }

  return (
    <Box>
      <TaskFilters
        search={search}
        onSearchChange={setSearch}
        status={status}
        onStatusChange={setStatus}
        priority={priority}
        onPriorityChange={setPriority}
        sortOrder={sortOrder}
        onSortOrderChange={setSortOrder}
      />

      {tasks && tasks.length > 0 ? (
        tasks.map((task) => <TaskCard key={task.id} task={task} />)
      ) : (
        <Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
          No tasks found.
        </Typography>
      )}
    </Box>
  );
}
