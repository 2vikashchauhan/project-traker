'use client';

import {
  Box,
  Typography,
  Paper,
  Stack,
  Divider,
  List,
  ListItem,
  ListItemText,
} from '@mui/material';
import Link from 'next/link';
import {
  StatusBadge,
  PriorityBadge,
  ProgressBar,
} from '@/components/common';
import { ProjectWithTasks } from '@/types/project.types';

interface ProjectDetailProps {
  project: ProjectWithTasks;
}

export default function ProjectDetail({ project }: ProjectDetailProps) {
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString();
  };

  return (
    <Box>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Stack spacing={2}>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              flexWrap: 'wrap',
              gap: 1,
            }}
          >
            <Typography variant="h5" component="h2">
              {project.name}
            </Typography>
            <Stack direction="row" spacing={1}>
              <StatusBadge status={project.status} />
              <PriorityBadge priority={project.priority} />
            </Stack>
          </Box>

          {project.description && (
            <Typography variant="body1" color="text.secondary">
              {project.description}
            </Typography>
          )}

          <Box>
            <Typography variant="subtitle2" gutterBottom>
              Progress
            </Typography>
            <ProgressBar value={project.progress} />
          </Box>

          <Divider />

          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={{ xs: 1, sm: 4 }}
          >
            <Box>
              <Typography variant="caption" color="text.secondary">
                Start Date
              </Typography>
              <Typography variant="body2">
                {formatDate(project.startDate)}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">
                Due Date
              </Typography>
              <Typography variant="body2">
                {formatDate(project.dueDate)}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">
                Created
              </Typography>
              <Typography variant="body2">
                {formatDate(project.createdAt)}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">
                Updated
              </Typography>
              <Typography variant="body2">
                {formatDate(project.updatedAt)}
              </Typography>
            </Box>
          </Stack>
        </Stack>
      </Paper>

      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" component="h3" gutterBottom>
          Tasks ({project.tasks.length})
        </Typography>

        {project.tasks.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            No tasks have been added to this project yet.
          </Typography>
        ) : (
          <List disablePadding>
            {project.tasks.map((task) => (
              <ListItem
                key={task.id}
                component={Link}
                href={`/tasks/${task.id}`}
                sx={{
                  borderBottom: '1px solid',
                  borderColor: 'divider',
                  textDecoration: 'none',
                  color: 'inherit',
                  '&:last-child': { borderBottom: 'none' },
                  '&:hover': { bgcolor: 'action.hover' },
                  px: 1,
                }}
              >
                <ListItemText
                  primary={task.title}
                  secondary={
                    task.dueDate
                      ? `Due: ${formatDate(task.dueDate)}`
                      : undefined
                  }
                />
                <Stack direction="row" spacing={1} sx={{ ml: 1 }}>
                  <StatusBadge status={task.status} />
                  <PriorityBadge priority={task.priority} />
                </Stack>
              </ListItem>
            ))}
          </List>
        )}
      </Paper>
    </Box>
  );
}
