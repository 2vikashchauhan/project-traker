import { prisma } from "@/lib/prisma";
import {
  TaskStatus as PrismaTaskStatus,
  Priority as PrismaPriority,
  Prisma,
} from "@prisma/client";
import { Task, TaskWithProject, CreateTaskInput, UpdateTaskInput } from "@/types/task.types";
import { TaskStatus, Priority } from "@/types/common.types";
import { ListQueryParams } from "@/types/api.types";

/**
 * Maps application-level TaskStatus string literals to Prisma enum values.
 */
function toTaskStatusEnum(status: TaskStatus): PrismaTaskStatus {
  const map: Record<TaskStatus, PrismaTaskStatus> = {
    "Todo": PrismaTaskStatus.Todo,
    "In Progress": PrismaTaskStatus.InProgress,
    "Review": PrismaTaskStatus.Review,
    "Done": PrismaTaskStatus.Done,
  };
  return map[status];
}

/**
 * Maps Prisma TaskStatus enum values to application-level string literals.
 */
function fromTaskStatusEnum(status: PrismaTaskStatus): TaskStatus {
  const map: Record<PrismaTaskStatus, TaskStatus> = {
    [PrismaTaskStatus.Todo]: "Todo",
    [PrismaTaskStatus.InProgress]: "In Progress",
    [PrismaTaskStatus.Review]: "Review",
    [PrismaTaskStatus.Done]: "Done",
  };
  return map[status];
}

/**
 * Maps application-level Priority string literals to Prisma enum values.
 */
function toPriorityEnum(priority: Priority): PrismaPriority {
  const map: Record<Priority, PrismaPriority> = {
    "Low": PrismaPriority.Low,
    "Medium": PrismaPriority.Medium,
    "High": PrismaPriority.High,
  };
  return map[priority];
}

/**
 * Maps Prisma Priority enum values to application-level string literals.
 */
function fromPriorityEnum(priority: PrismaPriority): Priority {
  const map: Record<PrismaPriority, Priority> = {
    [PrismaPriority.Low]: "Low",
    [PrismaPriority.Medium]: "Medium",
    [PrismaPriority.High]: "High",
  };
  return map[priority];
}

/**
 * Converts a Prisma Task record to the application-level Task interface.
 */
function mapToTask(record: {
  id: string;
  title: string;
  description: string | null;
  status: PrismaTaskStatus;
  priority: PrismaPriority;
  dueDate: Date | null;
  assignedTo: string | null;
  projectId: string;
  createdAt: Date;
  updatedAt: Date;
}): Task {
  return {
    id: record.id,
    title: record.title,
    description: record.description,
    status: fromTaskStatusEnum(record.status),
    priority: fromPriorityEnum(record.priority),
    dueDate: record.dueDate ? record.dueDate.toISOString() : null,
    assignedTo: record.assignedTo,
    projectId: record.projectId,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

/**
 * Converts a Prisma Task record with project relation to TaskWithProject.
 */
function mapToTaskWithProject(record: {
  id: string;
  title: string;
  description: string | null;
  status: PrismaTaskStatus;
  priority: PrismaPriority;
  dueDate: Date | null;
  assignedTo: string | null;
  projectId: string;
  createdAt: Date;
  updatedAt: Date;
  project: {
    id: string;
    name: string;
    description: string | null;
    status: import("@prisma/client").ProjectStatus;
    priority: PrismaPriority;
    startDate: Date | null;
    dueDate: Date | null;
    progress: number;
    createdAt: Date;
    updatedAt: Date;
  };
}): TaskWithProject {
  const projectStatusMap: Record<import("@prisma/client").ProjectStatus, import("@/types/common.types").ProjectStatus> = {
    Planned: "Planned",
    InProgress: "In Progress",
    Completed: "Completed",
    OnHold: "On Hold",
    Cancelled: "Cancelled",
  };

  return {
    ...mapToTask(record),
    project: {
      id: record.project.id,
      name: record.project.name,
      description: record.project.description,
      status: projectStatusMap[record.project.status],
      priority: fromPriorityEnum(record.project.priority),
      startDate: record.project.startDate ? record.project.startDate.toISOString() : null,
      dueDate: record.project.dueDate ? record.project.dueDate.toISOString() : null,
      progress: record.project.progress,
      createdAt: record.project.createdAt.toISOString(),
      updatedAt: record.project.updatedAt.toISOString(),
    },
  };
}

/**
 * Parameters for the findAll method.
 */
export interface FindAllParams extends ListQueryParams {}

/**
 * TaskRepository handles all database operations for the Task entity.
 */
export class TaskRepository {
  /**
   * Retrieves all tasks matching the given filters, search, and sort criteria.
   *
   * - search: case-insensitive substring match on title OR description
   * - status: filter by task status
   * - priority: filter by priority
   * - sortBy "dueDate": sorts by dueDate with null handling
   *   - asc: nulls appear last
   *   - desc: nulls appear first
   */
  async findAll(params: FindAllParams): Promise<Task[]> {
    const where: Prisma.TaskWhereInput = {};

    // Search filter: case-insensitive substring on title OR description
    if (params.search && params.search.trim().length > 0) {
      const searchTerm = params.search.trim();
      where.OR = [
        { title: { contains: searchTerm, mode: "insensitive" } },
        { description: { contains: searchTerm, mode: "insensitive" } },
      ];
    }

    // Status filter
    if (params.status) {
      where.status = toTaskStatusEnum(params.status as TaskStatus);
    }

    // Priority filter
    if (params.priority) {
      where.priority = toPriorityEnum(params.priority as Priority);
    }

    // Sort handling
    let orderBy: Prisma.TaskOrderByWithRelationInput[] | undefined;
    if (params.sortBy === "dueDate") {
      const sortOrder = params.sortOrder || "asc";

      if (sortOrder === "asc") {
        // Nulls last in ascending: use raw query approach with Prisma's sort nulls option
        orderBy = [{ dueDate: { sort: "asc", nulls: "last" } }];
      } else {
        // Nulls first in descending
        orderBy = [{ dueDate: { sort: "desc", nulls: "first" } }];
      }
    }

    const records = await prisma.task.findMany({
      where,
      orderBy,
    });

    return records.map(mapToTask);
  }

  /**
   * Retrieves a single task by ID.
   */
  async findById(id: string): Promise<Task | null> {
    const record = await prisma.task.findUnique({
      where: { id },
    });

    if (!record) return null;
    return mapToTask(record);
  }

  /**
   * Creates a new task in the database.
   */
  async create(data: CreateTaskInput): Promise<Task> {
    const record = await prisma.task.create({
      data: {
        title: data.title,
        description: data.description ?? null,
        status: data.status ? toTaskStatusEnum(data.status) : PrismaTaskStatus.Todo,
        priority: toPriorityEnum(data.priority),
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        assignedTo: data.assignedTo ?? null,
        projectId: data.projectId,
      },
    });

    return mapToTask(record);
  }

  /**
   * Updates an existing task by ID.
   */
  async update(id: string, data: UpdateTaskInput): Promise<Task> {
    const updateData: Prisma.TaskUpdateInput = {};

    if (data.title !== undefined) {
      updateData.title = data.title;
    }
    if (data.description !== undefined) {
      updateData.description = data.description;
    }
    if (data.status !== undefined) {
      updateData.status = toTaskStatusEnum(data.status);
    }
    if (data.priority !== undefined) {
      updateData.priority = toPriorityEnum(data.priority);
    }
    if (data.dueDate !== undefined) {
      updateData.dueDate = data.dueDate ? new Date(data.dueDate) : null;
    }
    if (data.assignedTo !== undefined) {
      updateData.assignedTo = data.assignedTo;
    }
    if (data.projectId !== undefined) {
      updateData.project = { connect: { id: data.projectId } };
    }

    const record = await prisma.task.update({
      where: { id },
      data: updateData,
    });

    return mapToTask(record);
  }

  /**
   * Deletes a task by ID.
   */
  async delete(id: string): Promise<Task> {
    const record = await prisma.task.delete({
      where: { id },
    });

    return mapToTask(record);
  }

  /**
   * Counts tasks for a given project with a specific status.
   * Used for progress calculation (counting "Done" tasks).
   */
  async countByProjectAndStatus(projectId: string, status: TaskStatus): Promise<number> {
    return prisma.task.count({
      where: {
        projectId,
        status: toTaskStatusEnum(status),
      },
    });
  }

  /**
   * Counts all tasks for a given project.
   * Used for progress calculation (total tasks).
   */
  async countByProject(projectId: string): Promise<number> {
    return prisma.task.count({
      where: { projectId },
    });
  }

  /**
   * Counts overdue tasks: tasks where dueDate < today AND status is not "Done".
   */
  async findOverdue(today: Date): Promise<number> {
    return prisma.task.count({
      where: {
        dueDate: { lt: today },
        status: { not: PrismaTaskStatus.Done },
      },
    });
  }

  /**
   * Finds tasks with upcoming deadlines within a date range.
   * Returns tasks with dueDate between today and endDate (inclusive),
   * ordered by dueDate ascending, limited to the given count.
   * Includes the project relation for project name display.
   */
  async findUpcomingDeadlines(today: Date, endDate: Date, limit: number): Promise<TaskWithProject[]> {
    const records = await prisma.task.findMany({
      where: {
        dueDate: {
          gte: today,
          lte: endDate,
        },
      },
      orderBy: { dueDate: "asc" },
      take: limit,
      include: { project: true },
    });

    return records.map(mapToTaskWithProject);
  }
}

/**
 * Singleton instance of the TaskRepository.
 */
export const taskRepository = new TaskRepository();
