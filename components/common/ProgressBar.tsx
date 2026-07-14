'use client';

import { Box, LinearProgress, Typography } from '@mui/material';

interface ProgressBarProps {
  /** Progress value between 0 and 100 */
  value: number;
}

export default function ProgressBar({ value }: ProgressBarProps) {
  const clampedValue = Math.min(100, Math.max(0, value));

  return (
    <Box display="flex" alignItems="center" gap={1}>
      <Box sx={{ flexGrow: 1 }}>
        <LinearProgress
          variant="determinate"
          value={clampedValue}
          aria-label={`Progress: ${clampedValue}%`}
          aria-valuenow={clampedValue}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </Box>
      <Typography
        variant="body2"
        color="text.secondary"
        sx={{ minWidth: 40, textAlign: 'right' }}
      >
        {clampedValue}%
      </Typography>
    </Box>
  );
}
