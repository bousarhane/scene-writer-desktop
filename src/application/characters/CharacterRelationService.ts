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

    await this.ensureRelationDoesNotExist({
      projectId:
        input.projectId,

      firstCharacterId:
        input.sourceCharacterId,

      secondCharacterId:
        input.targetCharacterId,

      relationType:
        input.relationType,

      customLabel,
    });

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

    await this.ensureRelationDoesNotExist({
      projectId:
        existingRelation.projectId,

      firstCharacterId:
        existingRelation.sourceCharacterId,

      secondCharacterId:
        input.targetCharacterId,

      relationType:
        input.relationType,

      customLabel,

      excludedRelationId:
        existingRelation.id,
    });

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
    input: {
      projectId: UUID;

      firstCharacterId: UUID;
      secondCharacterId: UUID;

      relationType:
        CharacterRelationType;

      customLabel: string | null;

      excludedRelationId?: UUID;
    },
  ): Promise<void> {
    const relations =
      await this.repository
        .findByCharacterId(
          input.projectId,
          input.firstCharacterId,
        );

    const duplicate =
      relations.some((relation) => {
        if (
          relation.id ===
          input.excludedRelationId
        ) {
          return false;
        }

        if (
          !connectsSameCharacters(
            relation,
            input.firstCharacterId,
            input.secondCharacterId,
          )
        ) {
          return false;
        }

        if (
          relation.relationType !==
          input.relationType
        ) {
          return false;
        }

        if (
          input.relationType !==
          "custom"
        ) {
          return true;
        }

        return (
          normalizeComparableText(
            relation.customLabel,
          ) ===
          normalizeComparableText(
            input.customLabel,
          )
        );
      });

    if (duplicate) {
      const relationLabel =
        input.relationType ===
        "custom"
          ? input.customLabel ??
            "العلاقة الخاصة"
          : getRelationTypeLabel(
              input.relationType,
            );

      throw new Error(
        `العلاقة «${relationLabel}» مسجلة مسبقًا بين الشخصيتين.`,
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

function connectsSameCharacters(
  relation: CharacterRelation,
  firstCharacterId: UUID,
  secondCharacterId: UUID,
): boolean {
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

function normalizeComparableText(
  value: string | null,
): string {
  return (value ?? "")
    .trim()
    .replace(/\s+/g, " ")
    .toLocaleLowerCase();
}

function getRelationTypeLabel(
  relationType:
    CharacterRelationType,
): string {
  switch (relationType) {
    case "parent":
      return "أب أو أم";

    case "child":
      return "ابن أو ابنة";

    case "spouse":
      return "زوج أو زوجة";

    case "sibling":
      return "أخ أو أخت";

    case "friend":
      return "صديق";

    case "enemy":
      return "خصم";

    case "colleague":
      return "زميل";

    case "relative":
      return "قريب";

    case "custom":
      return "علاقة خاصة";
  }
}