'use client';

import {
  Box,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  ToggleButtonGroup,
  ToggleButton,
} from '@mui/material';
import { ArrowUpward, ArrowDownward } from '@mui/icons-material';
import { PROJECT_STATUSES, PRIORITIES } from '@/types/common.types';
import { ListQueryParams } from '@/types/api.types';

interface ProjectFiltersProps {
  /** Current filter/sort parameters */
  params: ListQueryParams;
  /** Callback when any filter value changes */
  onChange: (params: ListQueryParams) => void;
}

export default function ProjectFilters({ params, onChange }: ProjectFiltersProps) {
  const handleSearchChange = (value: string) => {
    onChange({ ...params, search: value || undefined });
  };

  const handleStatusChange = (value: string) => {
    onChange({ ...params, status: value || undefined });
  };

  const handlePriorityChange = (value: string) => {
    onChange({ ...params, priority: value || undefined });
  };

  const handleSortOrderChange = (
    _: React.MouseEvent<HTMLElement>,
    newOrder: 'asc' | 'desc' | null,
  ) => {
    if (newOrder) {
      onChange({ ...params, sortBy: 'dueDate', sortOrder: newOrder });
    } else {
      // Toggled off — remove sort
      const { sortBy, sortOrder, ...rest } = params;
      onChange(rest);
    }
  };

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
        label="Search projects"
        size="small"
        value={params.search ?? ''}
        onChange={(e) => handleSearchChange(e.target.value)}
        sx={{ minWidth: 200, flexGrow: 1 }}
        inputProps={{ 'aria-label': 'Search projects' }}
      />

      <FormControl size="small" sx={{ minWidth: 150 }}>
        <InputLabel id="status-filter-label">Status</InputLabel>
        <Select
          labelId="status-filter-label"
          label="Status"
          value={params.status ?? ''}
          onChange={(e) => handleStatusChange(e.target.value)}
        >
          <MenuItem value="">All</MenuItem>
          {PROJECT_STATUSES.map((status) => (
            <MenuItem key={status} value={status}>
              {status}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <FormControl size="small" sx={{ minWidth: 150 }}>
        <InputLabel id="priority-filter-label">Priority</InputLabel>
        <Select
          labelId="priority-filter-label"
          label="Priority"
          value={params.priority ?? ''}
          onChange={(e) => handlePriorityChange(e.target.value)}
        >
          <MenuItem value="">All</MenuItem>
          {PRIORITIES.map((priority) => (
            <MenuItem key={priority} value={priority}>
              {priority}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <ToggleButtonGroup
        value={params.sortOrder ?? null}
        exclusive
        onChange={handleSortOrderChange}
        size="small"
        aria-label="Sort by due date"
      >
        <ToggleButton value="asc" aria-label="Sort ascending">
          <ArrowUpward fontSize="small" sx={{ mr: 0.5 }} />
          Due Date
        </ToggleButton>
        <ToggleButton value="desc" aria-label="Sort descending">
          <ArrowDownward fontSize="small" sx={{ mr: 0.5 }} />
          Due Date
        </ToggleButton>
      </ToggleButtonGroup>
    </Box>
  );
}
