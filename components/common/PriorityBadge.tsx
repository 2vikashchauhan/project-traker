'use client';

import { Chip } from '@mui/material';
import type { Priority } from '@/types/common.types';

const PRIORITY_COLOR_MAP: Record<Priority, 'error' | 'warning' | 'default'> = {
  High: 'error',
  Medium: 'warning',
  Low: 'default',
};

interface PriorityBadgeProps {
  /** The priority value to display */
  priority: Priority;
}

export default function PriorityBadge({ priority }: PriorityBadgeProps) {
  const color = PRIORITY_COLOR_MAP[priority] ?? 'default';

  return (
    <Chip
      label={priority}
      color={color}
      size="small"
      variant="outlined"
      aria-label={`Priority: ${priority}`}
    />
  );
}
