import type {
  Scene,
  UUID,
} from "../../types";

export interface SceneRepository {
  findByProjectId(
    projectId: UUID,
  ): Promise<Scene[]>;

  findByEpisodeId(
    projectId: UUID,
    episodeId: UUID | null,
  ): Promise<Scene[]>;

  findById(
    id: UUID,
  ): Promise<Scene | null>;

  create(
    scene: Scene,
  ): Promise<void>;

  update(
    scene: Scene,
  ): Promise<void>;

  delete(
    id: UUID,
  ): Promise<void>;
}