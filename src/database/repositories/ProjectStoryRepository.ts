import type {
  ProjectStory,
  UUID,
} from "../../types";

export interface ProjectStoryRepository {
  findByProjectId(
    projectId: UUID,
  ): Promise<ProjectStory | null>;

  create(
    story: ProjectStory,
  ): Promise<void>;

  update(
    story: ProjectStory,
  ): Promise<void>;

  deleteByProjectId(
    projectId: UUID,
  ): Promise<void>;
}