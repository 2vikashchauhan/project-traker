'use client';

import {
  Card,
  CardContent,
  Typography,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
} from '@mui/material';
import { UpcomingDeadline } from '@/types/api.types';

interface UpcomingDeadlinesProps {
  deadlines: UpcomingDeadline[];
}

function formatDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export default function UpcomingDeadlines({ deadlines }: UpcomingDeadlinesProps) {
  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Upcoming Deadlines
        </Typography>
        {deadlines.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            No upcoming deadlines.
          </Typography>
        ) : (
          <TableContainer>
            <Table size="small" aria-label="Upcoming deadlines">
              <TableHead>
                <TableRow>
                  <TableCell>Task</TableCell>
                  <TableCell>Due Date</TableCell>
                  <TableCell>Project</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {deadlines.map((deadline) => (
                  <TableRow key={deadline.id}>
                    <TableCell>{deadline.title}</TableCell>
                    <TableCell>{formatDate(deadline.dueDate)}</TableCell>
                    <TableCell>{deadline.projectName}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </CardContent>
    </Card>
  );
}
