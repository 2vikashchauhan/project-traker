'use client';

import { Box, TextField, FormControl, InputLabel, Select, MenuItem, IconButton, Tooltip } from '@mui/material';
import { ArrowUpward, ArrowDownward } from '@mui/icons-material';
import { TASK_STATUSES, PRIORITIES } from '@/types/common.types';

interface TaskFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  status: string;
  onStatusChange: (value: string) => void;
  priority: string;
  onPriorityChange: (value: string) => void;
  sortOrder: 'asc' | 'desc';
  onSortOrderChange: (value: 'asc' | 'desc') => void;
}

export default function TaskFilters({
  search,
  onSearchChange,
  status,
  onStatusChange,
  priority,
  onPriorityChange,
  sortOrder,
  onSortOrderChange,
}: TaskFiltersProps) {
  return (
    <Box
      sx={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 2,
        mb: 3,
        alignItems: 'center',
      }}
    >
      <TextField
        label="Search tasks"
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        size="small"
        sx={{ minWidth: 200, flexGrow: 1 }}
        aria-label="Search tasks by title or description"
      />

      <FormControl size="small" sx={{ minWidth: 150 }}>
        <InputLabel id="task-status-filter-label">Status</InputLabel>
        <Select
          labelId="task-status-filter-label"
          label="Status"
          value={status}
          onChange={(e) => onStatusChange(e.target.value)}
        >
          <MenuItem value="">All</MenuItem>
          {TASK_STATUSES.map((s) => (
            <MenuItem key={s} value={s}>
              {s}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <FormControl size="small" sx={{ minWidth: 150 }}>
        <InputLabel id="task-priority-filter-label">Priority</InputLabel>
        <Select
          labelId="task-priority-filter-label"
          label="Priority"
          value={priority}
          onChange={(e) => onPriorityChange(e.target.value)}
        >
          <MenuItem value="">All</MenuItem>
          {PRIORITIES.map((p) => (
            <MenuItem key={p} value={p}>
              {p}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <Tooltip title={`Sort by due date ${sortOrder === 'asc' ? 'ascending' : 'descending'}`}>
        <IconButton
          onClick={() => onSortOrderChange(sortOrder === 'asc' ? 'desc' : 'asc')}
          aria-label={`Sort by due date ${sortOrder === 'asc' ? 'ascending' : 'descending'}`}
          sx={{ minWidth: 44, minHeight: 44 }}
        >
          {sortOrder === 'asc' ? <ArrowUpward /> : <ArrowDownward />}
        </IconButton>
      </Tooltip>
    </Box>
  );
}
