import type {
  Location,
  UUID,
} from "../../types";

export interface LocationRepository {
  findByProjectId(
    projectId: UUID,
  ): Promise<Location[]>;

  findById(
    id: UUID,
  ): Promise<Location | null>;

  create(
    location: Location,
  ): Promise<void>;

  update(
    location: Location,
  ): Promise<void>;

  delete(
    id: UUID,
  ): Promise<void>;
}