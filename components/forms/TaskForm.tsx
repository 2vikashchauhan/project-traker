'use client';

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Box,
  Button,
  TextField,
  MenuItem,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  FormHelperText,
} from '@mui/material';
import { PRIORITIES } from '@/types/common.types';
import { CreateTaskInput } from '@/types/task.types';
import { useProjects } from '@/hooks/useProjects';

/**
 * Client-side Zod schema for task form validation.
 * Matches the server-side createTaskSchema rules but adapted for form inputs
 * (e.g., dueDate as date string from input type="date" rather than full ISO datetime).
 */
const taskFormSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'Title is required')
    .max(150, 'Title must not exceed 150 characters'),
  description: z
    .string()
    .max(1000, 'Description must not exceed 1000 characters')
    .optional()
    .or(z.literal('')),
  priority: z.enum(PRIORITIES, {
    errorMap: () => ({
      message: `Priority is required. Must be one of: ${PRIORITIES.join(', ')}`,
    }),
  }),
  projectId: z
    .string()
    .min(1, 'Project is required')
    .uuid('Project must be a valid selection'),
  dueDate: z.string().optional().or(z.literal('')),
  assignedTo: z
    .string()
    .max(100, 'Assigned to must not exceed 100 characters')
    .optional()
    .or(z.literal('')),
});

type TaskFormValues = z.infer<typeof taskFormSchema>;

export interface TaskFormProps {
  defaultValues?: Partial<CreateTaskInput>;
  onSubmit: (data: CreateTaskInput) => Promise<void>;
  isSubmitting?: boolean;
  serverError?: string;
}

/**
 * TaskForm component for creating and editing tasks.
 * Uses React Hook Form with Zod resolver for client-side validation.
 * Supports both create and edit modes via defaultValues prop.
 */
export default function TaskForm({
  defaultValues,
  onSubmit,
  isSubmitting = false,
  serverError,
}: TaskFormProps) {
  const { data: projects = [], isLoading: projectsLoading } = useProjects();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<TaskFormValues>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      title: defaultValues?.title ?? '',
      description: defaultValues?.description ?? '',
      priority: defaultValues?.priority ?? '' as unknown as TaskFormValues['priority'],
      projectId: defaultValues?.projectId ?? '',
      dueDate: defaultValues?.dueDate
        ? defaultValues.dueDate.substring(0, 10)
        : '',
      assignedTo: defaultValues?.assignedTo ?? '',
    },
    mode: 'onChange',
  });

  const handleFormSubmit = async (values: TaskFormValues) => {
    const payload: CreateTaskInput = {
      title: values.title,
      priority: values.priority,
      projectId: values.projectId,
    };

    if (values.description && values.description.trim().length > 0) {
      payload.description = values.description;
    }

    if (values.dueDate) {
      // Convert date input (YYYY-MM-DD) to ISO 8601 datetime for the API
      payload.dueDate = new Date(values.dueDate).toISOString();
    }

    if (values.assignedTo && values.assignedTo.trim().length > 0) {
      payload.assignedTo = values.assignedTo;
    }

    await onSubmit(payload);
  };

  return (
    <Box
      component="form"
      onSubmit={handleSubmit(handleFormSubmit)}
      noValidate
      sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, maxWidth: 600 }}
    >
      {serverError && (
        <Alert severity="error" aria-live="polite">
          {serverError}
        </Alert>
      )}

      {/* Title field */}
      <Controller
        name="title"
        control={control}
        render={({ field }) => (
          <TextField
            {...field}
            label="Title"
            required
            fullWidth
            error={!!errors.title}
            helperText={errors.title?.message}
            inputProps={{
              'aria-label': 'Task title',
              'aria-required': 'true',
              maxLength: 150,
            }}
          />
        )}
      />

      {/* Description field */}
      <Controller
        name="description"
        control={control}
        render={({ field }) => (
          <TextField
            {...field}
            label="Description"
            fullWidth
            multiline
            rows={4}
            error={!!errors.description}
            helperText={errors.description?.message}
            inputProps={{
              'aria-label': 'Task description',
              maxLength: 1000,
            }}
          />
        )}
      />

      {/* Priority select */}
      <Controller
        name="priority"
        control={control}
        render={({ field }) => (
          <FormControl fullWidth required error={!!errors.priority}>
            <InputLabel id="priority-label">Priority</InputLabel>
            <Select
              {...field}
              labelId="priority-label"
              label="Priority"
              aria-label="Task priority"
              aria-required="true"
            >
              {PRIORITIES.map((priority) => (
                <MenuItem key={priority} value={priority}>
                  {priority}
                </MenuItem>
              ))}
            </Select>
            {errors.priority && (
              <FormHelperText>{errors.priority.message}</FormHelperText>
            )}
          </FormControl>
        )}
      />

      {/* Project select */}
      <Controller
        name="projectId"
        control={control}
        render={({ field }) => (
          <FormControl fullWidth required error={!!errors.projectId}>
            <InputLabel id="project-label">Project</InputLabel>
            <Select
              {...field}
              labelId="project-label"
              label="Project"
              aria-label="Task project"
              aria-required="true"
              disabled={projectsLoading}
            >
              {projectsLoading && (
                <MenuItem value="" disabled>
                  Loading projects...
                </MenuItem>
              )}
              {projects.map((project) => (
                <MenuItem key={project.id} value={project.id}>
                  {project.name}
                </MenuItem>
              ))}
            </Select>
            {errors.projectId && (
              <FormHelperText>{errors.projectId.message}</FormHelperText>
            )}
          </FormControl>
        )}
      />

      {/* Due Date field */}
      <Controller
        name="dueDate"
        control={control}
        render={({ field }) => (
          <TextField
            {...field}
            label="Due Date"
            type="date"
            fullWidth
            error={!!errors.dueDate}
            helperText={errors.dueDate?.message}
            slotProps={{
              inputLabel: { shrink: true },
              htmlInput: { 'aria-label': 'Task due date' },
            }}
          />
        )}
      />

      {/* Assigned To field */}
      <Controller
        name="assignedTo"
        control={control}
        render={({ field }) => (
          <TextField
            {...field}
            label="Assigned To"
            fullWidth
            error={!!errors.assignedTo}
            helperText={errors.assignedTo?.message}
            inputProps={{
              'aria-label': 'Task assignee',
              maxLength: 100,
            }}
          />
        )}
      />

      {/* Submit button */}
      <Button
        type="submit"
        variant="contained"
        color="primary"
        disabled={isSubmitting}
        aria-label={defaultValues ? 'Update task' : 'Create task'}
        sx={{ alignSelf: 'flex-start', minWidth: 120, minHeight: 44 }}
      >
        {isSubmitting ? (
          <CircularProgress size={24} color="inherit" />
        ) : defaultValues ? (
          'Update Task'
        ) : (
          'Create Task'
        )}
      </Button>
    </Box>
  );
}
