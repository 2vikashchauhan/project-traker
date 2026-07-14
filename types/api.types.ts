/**
 * API response and request types for the Project Tracker application.
 */

/**
 * Dashboard statistics response from GET /api/dashboard.
 */
export interface DashboardResponse {
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  overdueTasks: number;
  upcomingDeadlines: UpcomingDeadline[];
  averageProgress: number;
}

/**
 * A single upcoming deadline entry in the dashboard response.
 */
export interface UpcomingDeadline {
  id: string;
  title: string;
  dueDate: string;
  projectId: string;
  projectName: string;
}

/**
 * Consistent error response format used across all API endpoints.
 */
export interface ErrorResponse {
  error: string;
  message: string;
  fieldErrors?: FieldError[];
}

/**
 * Individual field-level validation error.
 */
export interface FieldError {
  field: string;
  message: string;
}

/**
 * Query parameters for list endpoints supporting search, filter, and sort.
 */
export interface ListQueryParams {
  search?: string;
  status?: string;
  priority?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

/**
 * Generic paginated response wrapper (for future pagination support).
 */
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
