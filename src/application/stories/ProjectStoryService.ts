import type {
  ProjectStory,
  ProjectStoryContent,
  UUID,
} from "../../types";

import type {
  ProjectStoryRepository,
} from "../../database";

export class ProjectStoryService {
  constructor(
    private readonly repository:
      ProjectStoryRepository,
  ) {}

  async getStory(
    projectId: UUID,
  ): Promise<ProjectStory> {
    const existingStory =
      await this.repository.findByProjectId(
        projectId,
      );

    if (existingStory !== null) {
      return existingStory;
    }

    return this.createEmptyStory(
      projectId,
    );
  }

  async saveStory(
    projectId: UUID,
    content: ProjectStoryContent,
  ): Promise<ProjectStory> {
    const existingStory =
      await this.repository.findByProjectId(
        projectId,
      );

    const now =
      new Date().toISOString();

    if (existingStory === null) {
      const story: ProjectStory = {
        projectId,

        premise: content.premise,
        logline: content.logline,
        synopsis: content.synopsis,

        themes: content.themes,

        centralConflict:
          content.centralConflict,

        startingPoint:
          content.startingPoint,

        expectedDirection:
          content.expectedDirection,

        writerNotes:
          content.writerNotes,

        createdAt: now,
        updatedAt: now,
      };

      await this.repository.create(
        story,
      );

      return story;
    }

    const updatedStory: ProjectStory = {
      ...existingStory,

      premise: content.premise,
      logline: content.logline,
      synopsis: content.synopsis,

      themes: content.themes,

      centralConflict:
        content.centralConflict,

      startingPoint:
        content.startingPoint,

      expectedDirection:
        content.expectedDirection,

      writerNotes:
        content.writerNotes,

      updatedAt: now,
    };

    await this.repository.update(
      updatedStory,
    );

    return updatedStory;
  }

  async clearStory(
    projectId: UUID,
  ): Promise<void> {
    await this.repository
      .deleteByProjectId(projectId);
  }

  private createEmptyStory(
    projectId: UUID,
  ): ProjectStory {
    const now =
      new Date().toISOString();

    return {
      projectId,

      premise: "",
      logline: "",
      synopsis: "",

      themes: "",
      centralConflict: "",

      startingPoint: "",
      expectedDirection: "",

      writerNotes: "",

      createdAt: now,
      updatedAt: now,
    };
  }
}