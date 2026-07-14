'use client';

import { Alert, Button, Box } from '@mui/material';

interface ErrorDisplayProps {
  /** Error message to display */
  message: string;
  /** Callback for retry action */
  onRetry?: () => void;
}

export default function ErrorDisplay({ message, onRetry }: ErrorDisplayProps) {
  return (
    <Box sx={{ my: 2 }}>
      <Alert
        severity="error"
        action={
          onRetry ? (
            <Button
              color="inherit"
              size="small"
              onClick={onRetry}
              aria-label="Retry loading data"
            >
              Retry
            </Button>
          ) : undefined
        }
      >
        {message}
      </Alert>
    </Box>
  );
}
