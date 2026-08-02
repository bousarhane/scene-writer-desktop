import type {
  Episode,
  UUID,
} from "../../types";

export interface EpisodeRepository {
  findByProjectId(
    projectId: UUID,
  ): Promise<Episode[]>;

  findBySeasonId(
    projectId: UUID,
    seasonId: UUID | null,
  ): Promise<Episode[]>;

  findById(
    id: UUID,
  ): Promise<Episode | null>;

  create(
    episode: Episode,
  ): Promise<void>;

  update(
    episode: Episode,
  ): Promise<void>;

  delete(
    id: UUID,
  ): Promise<void>;
}