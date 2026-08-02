import type {
  Character,
  UUID,
} from "../../types";

export interface CharacterRepository {
  findByProjectId(
    projectId: UUID,
  ): Promise<Character[]>;

  findById(
    id: UUID,
  ): Promise<Character | null>;

  create(
    character: Character,
  ): Promise<void>;

  update(
    character: Character,
  ): Promise<void>;

  delete(
    id: UUID,
  ): Promise<void>;

  getNextOrderIndex(
    projectId: UUID,
  ): Promise<number>;
}