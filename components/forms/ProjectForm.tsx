"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Box,
  Button,
  TextField,
  MenuItem,
  Alert,
  Stack,
  CircularProgress,
} from "@mui/material";
import { PRIORITIES } from "@/types/common.types";
import type { CreateProjectInput } from "@/types/project.types";

/**
 * Client-side form schema for project creation/editing.
 * Mirrors the server-side createProjectSchema but without .strict()
 * to avoid rejecting React Hook Form's internal fields during validation.
 */
const projectFormSchema = z
  .object({
    name: z
      .string({ required_error: "Name is required" })
      .trim()
      .min(1, "Name is required and must not be empty")
      .max(100, "Name must not exceed 100 characters"),
    description: z
      .string()
      .trim()
      .max(500, "Description must not exceed 500 characters")
      .optional()
      .or(z.literal("")),
    priority: z.enum(["Low", "Medium", "High"], {
      required_error: "Priority is required",
      invalid_type_error: "Priority must be Low, Medium, or High",
    }),
    startDate: z
      .string()
      .refine(
        (val) => {
          if (!val) return true;
          const date = new Date(val);
          return !isNaN(date.getTime());
        },
        { message: "Invalid date format" }
      )
      .optional()
      .or(z.literal("")),
    dueDate: z
      .string()
      .refine(
        (val) => {
          if (!val) return true;
          const date = new Date(val);
          return !isNaN(date.getTime());
        },
        { message: "Invalid date format" }
      )
      .optional()
      .or(z.literal("")),
  })
  .refine(
    (data) => {
      if (data.startDate && data.dueDate) {
        return new Date(data.dueDate) >= new Date(data.startDate);
      }
      return true;
    },
    {
      message: "Due date must be greater than or equal to start date",
      path: ["dueDate"],
    }
  );

type ProjectFormData = z.infer<typeof projectFormSchema>;

export interface ProjectFormProps {
  defaultValues?: Partial<CreateProjectInput>;
  onSubmit: (data: CreateProjectInput) => Promise<void>;
  isSubmitting?: boolean;
  serverError?: string;
}

/**
 * ProjectForm component for creating and editing projects.
 * Uses React Hook Form with Zod resolver for client-side validation.
 * Pre-populates fields in edit mode and disables submit during submission.
 */
export function ProjectForm({
  defaultValues,
  onSubmit,
  isSubmitting = false,
  serverError,
}: ProjectFormProps) {
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ProjectFormData>({
    resolver: zodResolver(projectFormSchema),
    defaultValues: {
      name: defaultValues?.name ?? "",
      description: defaultValues?.description ?? "",
      priority: defaultValues?.priority ?? undefined,
      startDate: defaultValues?.startDate ?? "",
      dueDate: defaultValues?.dueDate ?? "",
    },
    mode: "onChange",
  });

  const handleFormSubmit = async (data: ProjectFormData) => {
    const submitData: CreateProjectInput = {
      name: data.name,
      priority: data.priority,
      ...(data.description && { description: data.description }),
      ...(data.startDate && { startDate: data.startDate }),
      ...(data.dueDate && { dueDate: data.dueDate }),
    };
    await onSubmit(submitData);
  };

  return (
    <Box
      component="form"
      onSubmit={handleSubmit(handleFormSubmit)}
      noValidate
      aria-label="Project form"
    >
      <Stack spacing={3}>
        {serverError && (
          <Alert severity="error" role="alert">
            {serverError}
          </Alert>
        )}

        <Controller
          name="name"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              label="Project Name"
              required
              fullWidth
              error={!!errors.name}
              helperText={errors.name?.message}
              inputProps={{
                "aria-label": "Project Name",
                "aria-required": "true",
                "aria-invalid": !!errors.name,
              }}
            />
          )}
        />

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
                "aria-label": "Description",
                "aria-invalid": !!errors.description,
              }}
            />
          )}
        />

        <Controller
          name="priority"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              select
              label="Priority"
              required
              fullWidth
              value={field.value ?? ""}
              error={!!errors.priority}
              helperText={errors.priority?.message}
              inputProps={{
                "aria-label": "Priority",
                "aria-required": "true",
                "aria-invalid": !!errors.priority,
              }}
            >
              {PRIORITIES.map((priority) => (
                <MenuItem key={priority} value={priority}>
                  {priority}
                </MenuItem>
              ))}
            </TextField>
          )}
        />

        <Controller
          name="startDate"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              type="date"
              label="Start Date"
              fullWidth
              error={!!errors.startDate}
              helperText={errors.startDate?.message}
              slotProps={{
                inputLabel: { shrink: true },
                htmlInput: {
                  "aria-label": "Start Date",
                  "aria-invalid": !!errors.startDate,
                },
              }}
            />
          )}
        />

        <Controller
          name="dueDate"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              type="date"
              label="Due Date"
              fullWidth
              error={!!errors.dueDate}
              helperText={errors.dueDate?.message}
              slotProps={{
                inputLabel: { shrink: true },
                htmlInput: {
                  "aria-label": "Due Date",
                  "aria-invalid": !!errors.dueDate,
                },
              }}
            />
          )}
        />

        <Button
          type="submit"
          variant="contained"
          size="large"
          disabled={isSubmitting}
          sx={{ minHeight: 44, minWidth: 44 }}
          aria-label={isSubmitting ? "Submitting..." : "Submit project"}
        >
          {isSubmitting ? (
            <CircularProgress size={24} color="inherit" />
          ) : defaultValues?.name ? (
            "Update Project"
          ) : (
            "Create Project"
          )}
        </Button>
      </Stack>
    </Box>
  );
}
