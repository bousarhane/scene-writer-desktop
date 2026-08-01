import type {
  AppLanguage,
  Project,
  ProjectStatus,
  ProjectType,
  TextDirection,
  UUID,
} from "../../types";
import { validateProject } from "../../types";
import type { ProjectRepository } from "../../database";

export interface CreateProjectInput {
  title: string;
  subtitle?: string | null;

  projectType: ProjectType;
  language?: AppLanguage;
  textDirection?: TextDirection;

  authorName?: string | null;
  description?: string | null;

  plannedSeasonCount?: number | null;
  plannedEpisodeCount?: number | null;

  defaultEpisodeDurationMinutes?: number | null;

  defaultMinimumScenesPerEpisode?: number | null;
  defaultMaximumScenesPerEpisode?: number | null;
}

export class ProjectValidationError extends Error {
  constructor(public readonly errors: string[]) {
    super(errors.join("\n"));
    this.name = "ProjectValidationError";
  }
}

export class ProjectService {
  constructor(
    private readonly repository: ProjectRepository,
  ) {}

  async listProjects(): Promise<Project[]> {
    return this.repository.findAll();
  }

  async getProject(id: UUID): Promise<Project | null> {
    return this.repository.findById(id);
  }

  async createProject(
    input: CreateProjectInput,
  ): Promise<Project> {
    const now = new Date().toISOString();

    const project: Project = {
      id: crypto.randomUUID(),

      title: input.title.trim(),
      subtitle: input.subtitle?.trim() || null,

      projectType: input.projectType,
      status: "draft",

      language: input.language ?? "ar",
      textDirection: input.textDirection ?? "rtl",

      authorName: input.authorName?.trim() || null,
      description: input.description?.trim() || null,

      plannedSeasonCount:
        input.plannedSeasonCount ?? null,

      plannedEpisodeCount:
        input.plannedEpisodeCount ?? null,

      defaultEpisodeDurationMinutes:
        input.defaultEpisodeDurationMinutes ?? null,

      defaultMinimumScenesPerEpisode:
        input.defaultMinimumScenesPerEpisode ?? null,

      defaultMaximumScenesPerEpisode:
        input.defaultMaximumScenesPerEpisode ?? null,

      lastOpenedAt: null,

      createdAt: now,
      updatedAt: now,
    };

    const validationErrors = validateProject(project);

    if (validationErrors.length > 0) {
      throw new ProjectValidationError(
        validationErrors.map((error) => error.message),
      );
    }

    await this.repository.create(project);

    return project;
  }

  async renameProject(
    id: UUID,
    newTitle: string,
  ): Promise<Project> {
    const project = await this.requireProject(id);
    const title = newTitle.trim();

    if (!title) {
      throw new ProjectValidationError([
        "عنوان المشروع إلزامي.",
      ]);
    }

    const updatedProject: Project = {
      ...project,
      title,
      updatedAt: new Date().toISOString(),
    };

    await this.repository.update(updatedProject);

    return updatedProject;
  }

  async markProjectAsOpened(
    id: UUID,
  ): Promise<Project> {
    const project = await this.requireProject(id);
    const now = new Date().toISOString();

    const updatedProject: Project = {
      ...project,
      lastOpenedAt: now,
      updatedAt: now,
    };

    await this.repository.update(updatedProject);

    return updatedProject;
  }

  async changeStatus(
    id: UUID,
    status: ProjectStatus,
  ): Promise<Project> {
    const project = await this.requireProject(id);

    const updatedProject: Project = {
      ...project,
      status,
      updatedAt: new Date().toISOString(),
    };

    await this.repository.update(updatedProject);

    return updatedProject;
  }

  async deleteProject(id: UUID): Promise<void> {
    const project = await this.repository.findById(id);

    if (!project) {
      return;
    }

    await this.repository.delete(id);
  }

  private async requireProject(
    id: UUID,
  ): Promise<Project> {
    const project = await this.repository.findById(id);

    if (!project) {
      throw new Error("المشروع المطلوب غير موجود.");
    }

    return project;
  }
}