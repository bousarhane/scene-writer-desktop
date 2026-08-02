import type {
  Character,
  CharacterGender,
  CharacterRole,
  UUID,
} from "../../types";

import type {
  CharacterRepository,
} from "../../database";

export interface CreateCharacterInput {
  projectId: UUID;

  name: string;
  shortName?: string | null;

  gender?: CharacterGender;
  age?: string | null;
  role?: CharacterRole;

  physicalDescription?: string | null;
  personality?: string | null;
  psychologicalProfile?: string | null;

  goals?: string | null;
  motivations?: string | null;
  background?: string | null;

  notes?: string | null;
}

export interface UpdateCharacterInput {
  name: string;
  shortName: string | null;

  gender: CharacterGender;
  age: string | null;
  role: CharacterRole;

  physicalDescription: string | null;
  personality: string | null;
  psychologicalProfile: string | null;

  goals: string | null;
  motivations: string | null;
  background: string | null;

  notes: string | null;
}

export class CharacterValidationError
  extends Error
{
  constructor(
    public readonly errors: string[],
  ) {
    super(errors.join("\n"));

    this.name =
      "CharacterValidationError";
  }
}

export class CharacterService {
  constructor(
    private readonly repository:
      CharacterRepository,
  ) {}

  async listCharacters(
    projectId: UUID,
  ): Promise<Character[]> {
    return this.repository
      .findByProjectId(projectId);
  }

  async getCharacter(
    id: UUID,
  ): Promise<Character | null> {
    return this.repository
      .findById(id);
  }

  async createCharacter(
    input: CreateCharacterInput,
  ): Promise<Character> {
    const name =
      normalizeRequiredName(
        input.name,
      );

    await this.ensureUniqueName(
      input.projectId,
      name,
    );

    const now =
      new Date().toISOString();

    const orderIndex =
      await this.repository
        .getNextOrderIndex(
          input.projectId,
        );

    const character: Character = {
      id: crypto.randomUUID(),
      projectId: input.projectId,

      name,

      shortName:
        normalizeOptionalText(
          input.shortName,
        ),

      gender:
        input.gender ??
        "unspecified",

      age:
        normalizeOptionalText(
          input.age,
        ),

      role:
        input.role ??
        "unspecified",

      physicalDescription:
        normalizeOptionalText(
          input.physicalDescription,
        ),

      personality:
        normalizeOptionalText(
          input.personality,
        ),

      psychologicalProfile:
        normalizeOptionalText(
          input.psychologicalProfile,
        ),

      goals:
        normalizeOptionalText(
          input.goals,
        ),

      motivations:
        normalizeOptionalText(
          input.motivations,
        ),

      background:
        normalizeOptionalText(
          input.background,
        ),

      notes:
        normalizeOptionalText(
          input.notes,
        ),

      orderIndex,

      createdAt: now,
      updatedAt: now,
    };

    await this.repository.create(
      character,
    );

    return character;
  }

  async updateCharacter(
    id: UUID,
    input: UpdateCharacterInput,
  ): Promise<Character> {
    const character =
      await this.requireCharacter(id);

    const name =
      normalizeRequiredName(
        input.name,
      );

    await this.ensureUniqueName(
      character.projectId,
      name,
      character.id,
    );

    const updatedCharacter: Character = {
      ...character,

      name,

      shortName:
        normalizeOptionalText(
          input.shortName,
        ),

      gender: input.gender,

      age:
        normalizeOptionalText(
          input.age,
        ),

      role: input.role,

      physicalDescription:
        normalizeOptionalText(
          input.physicalDescription,
        ),

      personality:
        normalizeOptionalText(
          input.personality,
        ),

      psychologicalProfile:
        normalizeOptionalText(
          input.psychologicalProfile,
        ),

      goals:
        normalizeOptionalText(
          input.goals,
        ),

      motivations:
        normalizeOptionalText(
          input.motivations,
        ),

      background:
        normalizeOptionalText(
          input.background,
        ),

      notes:
        normalizeOptionalText(
          input.notes,
        ),

      updatedAt:
        new Date().toISOString(),
    };

    await this.repository.update(
      updatedCharacter,
    );

    return updatedCharacter;
  }

  async deleteCharacter(
    id: UUID,
  ): Promise<void> {
    await this.repository.delete(id);
  }

  private async ensureUniqueName(
    projectId: UUID,
    name: string,
    excludedCharacterId?: UUID,
  ): Promise<void> {
    const characters =
      await this.repository
        .findByProjectId(projectId);

    const normalizedName =
      normalizeNameForComparison(
        name,
      );

    const duplicate =
      characters.some(
        (character) =>
          character.id !==
            excludedCharacterId &&
          normalizeNameForComparison(
            character.name,
          ) === normalizedName,
      );

    if (duplicate) {
      throw new CharacterValidationError([
        `توجد في المشروع شخصية تحمل الاسم «${name}».`,
      ]);
    }
  }

  private async requireCharacter(
    id: UUID,
  ): Promise<Character> {
    const character =
      await this.repository
        .findById(id);

    if (character === null) {
      throw new Error(
        "الشخصية المطلوبة غير موجودة.",
      );
    }

    return character;
  }
}

function normalizeRequiredName(
  value: string,
): string {
  const normalized =
    normalizeSpacing(value);

  if (!normalized) {
    throw new CharacterValidationError([
      "اسم الشخصية إلزامي.",
    ]);
  }

  return normalized;
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

function normalizeNameForComparison(
  value: string,
): string {
  return normalizeSpacing(value)
    .toLocaleLowerCase();
}

function normalizeSpacing(
  value: string,
): string {
  return value
    .trim()
    .replace(/\s+/g, " ");
}