'use client';

import { Box, Typography } from '@mui/material';
import { useDashboard } from '@/hooks/useDashboard';
import { LoadingSpinner, ErrorDisplay } from '@/components/common';
import DashboardStats from '@/features/dashboard/DashboardStats';
import UpcomingDeadlines from '@/features/dashboard/UpcomingDeadlines';
import ProgressOverview from '@/features/dashboard/ProgressOverview';

export default function DashboardPage() {
  const { data, isLoading, isError, error, refetch } = useDashboard();

  if (isLoading) {
    return <LoadingSpinner label="Loading dashboard" />;
  }

  if (isError) {
    return (
      <ErrorDisplay
        message={error?.message ?? 'Dashboard data could not be loaded.'}
        onRetry={() => refetch()}
      />
    );
  }

  if (!data) {
    return null;
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Typography variant="h4" component="h1">
        Dashboard
      </Typography>

      <DashboardStats
        totalProjects={data.totalProjects}
        activeProjects={data.activeProjects}
        completedProjects={data.completedProjects}
        overdueTasks={data.overdueTasks}
      />

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '2fr 1fr' }, gap: 3 }}>
        <UpcomingDeadlines deadlines={data.upcomingDeadlines} />
        <ProgressOverview averageProgress={data.averageProgress} />
      </Box>
    </Box>
  );
}
