'use client';

import { Box, CircularProgress } from '@mui/material';

interface LoadingSpinnerProps {
  /** Accessible label for the loading indicator */
  label?: string;
  /** Size of the spinner in pixels */
  size?: number;
}

export default function LoadingSpinner({
  label = 'Loading',
  size = 40,
}: LoadingSpinnerProps) {
  return (
    <Box
      display="flex"
      justifyContent="center"
      alignItems="center"
      minHeight={120}
      role="status"
      aria-label={label}
    >
      <CircularProgress size={size} aria-hidden="true" />
    </Box>
  );
}
