import type {
  Season,
  UUID,
} from "../../types";

export interface SeasonRepository {
  findByProjectId(
    projectId: UUID,
  ): Promise<Season[]>;

  findById(
    id: UUID,
  ): Promise<Season | null>;

  create(
    season: Season,
  ): Promise<void>;

  update(
    season: Season,
  ): Promise<void>;

  delete(
    id: UUID,
  ): Promise<void>;
}