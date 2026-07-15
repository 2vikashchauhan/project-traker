import { prisma } from "@/lib/prisma";
import {
  ProjectStatus as PrismaProjectStatus,
  Priority as PrismaPriority,
  Prisma,
} from "@prisma/client";
import { Project, ProjectWithTasks } from "@/types/project.types";
import { Task } from "@/types/task.types";
import { ProjectStatus, Priority } from "@/types/common.types";
import { ListQueryParams } from "@/types/api.types";

/**
 * Maps application-level ProjectStatus string literals to Prisma enum values.
 */
const statusToPrisma: Record<ProjectStatus, PrismaProjectStatus> = {
  Planned: PrismaProjectStatus.Planned,
  "In Progress": PrismaProjectStatus.InProgress,
  Completed: PrismaProjectStatus.Completed,
  "On Hold": PrismaProjectStatus.OnHold,
  Cancelled: PrismaProjectStatus.Cancelled,
};

/**
 * Maps Prisma ProjectStatus enum values back to application-level string literals.
 */
const statusFromPrisma: Record<PrismaProjectStatus, ProjectStatus> = {
  [PrismaProjectStatus.Planned]: "Planned",
  [PrismaProjectStatus.InProgress]: "In Progress",
  [PrismaProjectStatus.Completed]: "Completed",
  [PrismaProjectStatus.OnHold]: "On Hold",
  [PrismaProjectStatus.Cancelled]: "Cancelled",
};

/**
 * Maps application-level Priority string literals to Prisma enum values.
 */
const priorityToPrisma: Record<Priority, PrismaPriority> = {
  Low: PrismaPriority.Low,
  Medium: PrismaPriority.Medium,
  High: PrismaPriority.High,
};

/**
 * Maps Prisma Priority enum values back to application-level string literals.
 */
const priorityFromPrisma: Record<PrismaPriority, Priority> = {
  [PrismaPriority.Low]: "Low",
  [PrismaPriority.Medium]: "Medium",
  [PrismaPriority.High]: "High",
};

/**
 * Maps Prisma TaskStatus enum values to application-level string literals.
 */
import { TaskStatus as PrismaTaskStatus } from "@prisma/client";
import { TaskStatus } from "@/types/common.types";

const taskStatusFromPrisma: Record<PrismaTaskStatus, TaskStatus> = {
  [PrismaTaskStatus.Todo]: "Todo",
  [PrismaTaskStatus.InProgress]: "In Progress",
  [PrismaTaskStatus.Review]: "Review",
  [PrismaTaskStatus.Done]: "Done",
};

/**
 * Data required to create a project in the database.
 */
export interface ProjectCreateData {
  name: string;
  description?: string | null;
  status?: ProjectStatus;
  priority: Priority;
  startDate?: string | null;
  dueDate?: string | null;
  progress?: number;
  ownerId?: string | null;
}

/**
 * Data for updating a project in the database.
 */
export interface ProjectUpdateData {
  name?: string;
  description?: string | null;
  status?: ProjectStatus;
  priority?: Priority;
  startDate?: string | null;
  dueDate?: string | null;
  progress?: number;
}

/**
 * Transforms a Prisma project record into the application Project type.
 */
function mapProject(record: {
  id: string;
  name: string;
  description: string | null;
  status: PrismaProjectStatus;
  priority: PrismaPriority;
  startDate: Date | null;
  dueDate: Date | null;
  progress: number;
  ownerId: string | null;
  createdAt: Date;
  updatedAt: Date;
}): Project {
  return {
    id: record.id,
    name: record.name,
    description: record.description,
    status: statusFromPrisma[record.status],
    priority: priorityFromPrisma[record.priority],
    startDate: record.startDate ? record.startDate.toISOString() : null,
    dueDate: record.dueDate ? record.dueDate.toISOString() : null,
    progress: record.progress,
    ownerId: record.ownerId,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

/**
 * Transforms a Prisma task record into the application Task type.
 */
function mapTask(record: {
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
    status: taskStatusFromPrisma[record.status],
    priority: priorityFromPrisma[record.priority],
    dueDate: record.dueDate ? record.dueDate.toISOString() : null,
    assignedTo: record.assignedTo,
    projectId: record.projectId,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

/**
 * Repository for Project data access using Prisma ORM.
 * Handles all database operations for the Project model.
 */
export class ProjectRepository {
  /**
   * Retrieve all projects with optional search, status/priority filters, and sorting.
   * - search: case-insensitive substring match on name OR description
   * - status: exact match (case-insensitive) against ProjectStatus values
   * - priority: exact match (case-insensitive) against Priority values
   * - sortBy "dueDate": null dueDates appear last in asc, first in desc
   */
  async findAll(params: ListQueryParams = {}): Promise<Project[]> {
    const { search, status, priority, sortBy, sortOrder = "asc" } = params;

    const where: Prisma.ProjectWhereInput = {};

    // Search: case-insensitive substring on name OR description
    if (search && search.trim().length > 0) {
      const searchTerm = search.trim();
      where.OR = [
        { name: { contains: searchTerm, mode: "insensitive" } },
        { description: { contains: searchTerm, mode: "insensitive" } },
      ];
    }

    // Status filter
    if (status) {
      const prismaStatus = statusToPrisma[status as ProjectStatus];
      if (prismaStatus !== undefined) {
        where.status = prismaStatus;
      }
    }

    // Priority filter
    if (priority) {
      const prismaPriority = priorityToPrisma[priority as Priority];
      if (prismaPriority !== undefined) {
        where.priority = prismaPriority;
      }
    }

    // Sort handling
    let orderBy: Prisma.ProjectOrderByWithRelationInput[] | undefined;

    if (sortBy === "dueDate") {
      // For dueDate sorting with null handling:
      // Prisma's nulls option handles placement of null values
      const nullsPosition = sortOrder === "asc" ? "last" : "first";
      orderBy = [
        {
          dueDate: { sort: sortOrder as Prisma.SortOrder, nulls: nullsPosition },
        },
      ];
    }

    const records = await prisma.project.findMany({
      where,
      orderBy,
    });

    return records.map(mapProject);
  }

  /**
   * Retrieve a single project by ID, including its associated tasks.
   * Returns null if the project doesn't exist.
   */
  async findById(id: string): Promise<ProjectWithTasks | null> {
    const record = await prisma.project.findUnique({
      where: { id },
      include: { tasks: true },
    });

    if (!record) {
      return null;
    }

    const project = mapProject(record);
    const tasks = record.tasks.map(mapTask);

    return { ...project, tasks };
  }

  /**
   * Create a new project in the database.
   */
  async create(data: ProjectCreateData): Promise<Project> {
    const createData: Prisma.ProjectCreateInput = {
      name: data.name,
      description: data.description ?? null,
      status: data.status ? statusToPrisma[data.status] : undefined,
      priority: priorityToPrisma[data.priority],
      startDate: data.startDate ? new Date(data.startDate) : null,
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
      progress: data.progress ?? 0,
    };

    if (data.ownerId) {
      createData.owner = { connect: { id: data.ownerId } };
    }

    const record = await prisma.project.create({ data: createData });
    return mapProject(record);
  }

  /**
   * Update an existing project by ID.
   */
  async update(id: string, data: ProjectUpdateData): Promise<Project> {
    const updateData: Prisma.ProjectUpdateInput = {};

    if (data.name !== undefined) {
      updateData.name = data.name;
    }
    if (data.description !== undefined) {
      updateData.description = data.description;
    }
    if (data.status !== undefined) {
      updateData.status = statusToPrisma[data.status];
    }
    if (data.priority !== undefined) {
      updateData.priority = priorityToPrisma[data.priority];
    }
    if (data.startDate !== undefined) {
      updateData.startDate = data.startDate ? new Date(data.startDate) : null;
    }
    if (data.dueDate !== undefined) {
      updateData.dueDate = data.dueDate ? new Date(data.dueDate) : null;
    }
    if (data.progress !== undefined) {
      updateData.progress = data.progress;
    }

    const record = await prisma.project.update({
      where: { id },
      data: updateData,
    });

    return mapProject(record);
  }

  /**
   * Delete a project by ID. Cascade deletion of tasks is handled by the Prisma schema.
   */
  async delete(id: string): Promise<Project> {
    const record = await prisma.project.delete({ where: { id } });
    return mapProject(record);
  }

  /**
   * Count projects matching a specific status.
   */
  async countByStatus(status: ProjectStatus): Promise<number> {
    return prisma.project.count({
      where: { status: statusToPrisma[status] },
    });
  }

  /**
   * Count all projects in the database.
   */
  async countAll(): Promise<number> {
    return prisma.project.count();
  }

  /**
   * Get the average progress across all projects, rounded to 1 decimal place.
   * Returns 0.0 if there are no projects.
   */
  async getAverageProgress(): Promise<number> {
    const result = await prisma.project.aggregate({
      _avg: { progress: true },
    });

    const avg = result._avg.progress;
    if (avg === null || avg === undefined) {
      return 0.0;
    }

    return Math.round(avg * 10) / 10;
  }
}

/**
 * Singleton instance of ProjectRepository for use across the application.
 */
export const projectRepository = new ProjectRepository();
