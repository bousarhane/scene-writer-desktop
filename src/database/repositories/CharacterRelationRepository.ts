import type {
  CharacterRelation,
  UUID,
} from "../../types";

export interface CharacterRelationRepository {
  findByCharacterId(
    projectId: UUID,
    characterId: UUID,
  ): Promise<CharacterRelation[]>;

  findById(
    id: UUID,
  ): Promise<CharacterRelation | null>;

  create(
    relation: CharacterRelation,
  ): Promise<void>;

  update(
    relation: CharacterRelation,
  ): Promise<void>;

  delete(
    id: UUID,
  ): Promise<void>;
}