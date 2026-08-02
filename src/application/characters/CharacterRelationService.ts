import type {
  CharacterRelation,
  CharacterRelationType,
  UUID,
} from "../../types";

import type {
  CharacterRelationRepository,
} from "../../database";

export interface CreateCharacterRelationInput {
  projectId: UUID;

  sourceCharacterId: UUID;
  targetCharacterId: UUID;

  relationType: CharacterRelationType;
  customLabel?: string | null;
  description?: string | null;
}

export interface UpdateCharacterRelationInput {
  targetCharacterId: UUID;

  relationType: CharacterRelationType;
  customLabel: string | null;
  description: string | null;
}

export class CharacterRelationService {
  constructor(
    private readonly repository:
      CharacterRelationRepository,
  ) {}

  async listCharacterRelations(
    projectId: UUID,
    characterId: UUID,
  ): Promise<CharacterRelation[]> {
    return this.repository
      .findByCharacterId(
        projectId,
        characterId,
      );
  }

  async createCharacterRelation(
    input: CreateCharacterRelationInput,
  ): Promise<CharacterRelation> {
    this.validateCharacters(
      input.sourceCharacterId,
      input.targetCharacterId,
    );

    const customLabel =
      normalizeOptionalText(
        input.customLabel,
      );

    this.validateCustomLabel(
      input.relationType,
      customLabel,
    );

    await this.ensureRelationDoesNotExist(
      input.projectId,
      input.sourceCharacterId,
      input.targetCharacterId,
    );

    const now =
      new Date().toISOString();

    const relation:
      CharacterRelation = {
        id: crypto.randomUUID(),

        projectId:
          input.projectId,

        sourceCharacterId:
          input.sourceCharacterId,

        targetCharacterId:
          input.targetCharacterId,

        relationType:
          input.relationType,

        customLabel,

        description:
          normalizeOptionalText(
            input.description,
          ),

        createdAt: now,
        updatedAt: now,
      };

    await this.repository.create(
      relation,
    );

    return relation;
  }

  async updateCharacterRelation(
    id: UUID,
    input: UpdateCharacterRelationInput,
  ): Promise<CharacterRelation> {
    const existingRelation =
      await this.repository.findById(id);

    if (existingRelation === null) {
      throw new Error(
        "العلاقة المطلوبة غير موجودة.",
      );
    }

    this.validateCharacters(
      existingRelation.sourceCharacterId,
      input.targetCharacterId,
    );

    const customLabel =
      normalizeOptionalText(
        input.customLabel,
      );

    this.validateCustomLabel(
      input.relationType,
      customLabel,
    );

    if (
      input.targetCharacterId !==
      existingRelation.targetCharacterId
    ) {
      await this.ensureRelationDoesNotExist(
        existingRelation.projectId,
        existingRelation.sourceCharacterId,
        input.targetCharacterId,
        existingRelation.id,
      );
    }

    const updatedRelation:
      CharacterRelation = {
        ...existingRelation,

        targetCharacterId:
          input.targetCharacterId,

        relationType:
          input.relationType,

        customLabel,

        description:
          normalizeOptionalText(
            input.description,
          ),

        updatedAt:
          new Date().toISOString(),
      };

    await this.repository.update(
      updatedRelation,
    );

    return updatedRelation;
  }

  async deleteCharacterRelation(
    id: UUID,
  ): Promise<void> {
    await this.repository.delete(id);
  }

  private async ensureRelationDoesNotExist(
    projectId: UUID,
    firstCharacterId: UUID,
    secondCharacterId: UUID,
    excludedRelationId?: UUID,
  ): Promise<void> {
    const relations =
      await this.repository
        .findByCharacterId(
          projectId,
          firstCharacterId,
        );

    const duplicate =
      relations.some((relation) => {
        if (
          relation.id ===
          excludedRelationId
        ) {
          return false;
        }

        const sameDirection =
          relation.sourceCharacterId ===
            firstCharacterId &&
          relation.targetCharacterId ===
            secondCharacterId;

        const oppositeDirection =
          relation.sourceCharacterId ===
            secondCharacterId &&
          relation.targetCharacterId ===
            firstCharacterId;

        return (
          sameDirection ||
          oppositeDirection
        );
      });

    if (duplicate) {
      throw new Error(
        "توجد علاقة مسجلة مسبقًا بين الشخصيتين.",
      );
    }
  }

  private validateCharacters(
    sourceCharacterId: UUID,
    targetCharacterId: UUID,
  ): void {
    if (
      sourceCharacterId ===
      targetCharacterId
    ) {
      throw new Error(
        "لا يمكن ربط الشخصية بنفسها.",
      );
    }
  }

  private validateCustomLabel(
    relationType:
      CharacterRelationType,
    customLabel: string | null,
  ): void {
    if (
      relationType === "custom" &&
      customLabel === null
    ) {
      throw new Error(
        "أدخل تسمية العلاقة الخاصة.",
      );
    }
  }
}

function normalizeOptionalText(
  value: string | null | undefined,
): string | null {
  if (
    value === null ||
    value === undefined
  ) {
    return null;
  }

  const normalized =
    value.trim();

  return normalized || null;
}