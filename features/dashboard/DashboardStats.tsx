'use client';

import { Card, CardContent, Typography } from '@mui/material';
import Grid from '@mui/material/Grid2';

interface DashboardStatsProps {
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  overdueTasks: number;
}

export default function DashboardStats({
  totalProjects,
  activeProjects,
  completedProjects,
  overdueTasks,
}: DashboardStatsProps) {
  const stats = [
    { label: 'Total Projects', value: totalProjects, color: 'primary.main' },
    { label: 'Active Projects', value: activeProjects, color: 'info.main' },
    { label: 'Completed Projects', value: completedProjects, color: 'success.main' },
    { label: 'Overdue Tasks', value: overdueTasks, color: 'error.main' },
  ];

  return (
    <Grid container spacing={2}>
      {stats.map((stat) => (
        <Grid size={{ xs: 12, sm: 6, md: 3 }} key={stat.label}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {stat.label}
              </Typography>
              <Typography variant="h4" sx={{ color: stat.color }}>
                {stat.value}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
}
