'use client';

import { Chip } from '@mui/material';
import type { ProjectStatus, TaskStatus } from '@/types/common.types';

type Status = ProjectStatus | TaskStatus;

const STATUS_COLOR_MAP: Record<Status, 'success' | 'info' | 'warning' | 'default' | 'error'> = {
  Completed: 'success',
  Done: 'success',
  'In Progress': 'info',
  'On Hold': 'warning',
  Review: 'warning',
  Planned: 'default',
  Todo: 'default',
  Cancelled: 'error',
};

interface StatusBadgeProps {
  /** The status value to display */
  status: Status;
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const color = STATUS_COLOR_MAP[status] ?? 'default';

  return (
    <Chip
      label={status}
      color={color}
      size="small"
      aria-label={`Status: ${status}`}
    />
  );
}
