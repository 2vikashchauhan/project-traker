'use client';

import { Card, CardContent, Typography } from '@mui/material';
import { ProgressBar } from '@/components/common';

interface ProgressOverviewProps {
  averageProgress: number;
}

export default function ProgressOverview({ averageProgress }: ProgressOverviewProps) {
  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Average Progress
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          {averageProgress.toFixed(1)}% across all projects
        </Typography>
        <ProgressBar value={Math.round(averageProgress)} />
      </CardContent>
    </Card>
  );
}
