import type {
  Season,
  UUID,
} from "../../types";

import type {
  SeasonRepository,
} from "../../database";

export interface CreateSeasonInput {
  projectId: UUID;

  number?: number;
  title?: string | null;
  description?: string | null;

  plannedEpisodeCount?:
    number | null;

  defaultEpisodeDurationMinutes?:
    number | null;
}

export interface UpdateSeasonInput {
  number: number;

  title: string | null;
  description: string | null;

  plannedEpisodeCount:
    number | null;

  defaultEpisodeDurationMinutes:
    number | null;

  orderIndex: number;
}

export class SeasonService {
  constructor(
    private readonly repository:
      SeasonRepository,
  ) {}

  async listSeasons(
    projectId: UUID,
  ): Promise<Season[]> {
    return this.repository
      .findByProjectId(projectId);
  }

  async createSeason(
    input: CreateSeasonInput,
  ): Promise<Season> {
    const seasons =
      await this.repository
        .findByProjectId(
          input.projectId,
        );

    const number =
      input.number ??
      getNextNumber(seasons);

    validatePositiveInteger(
      number,
      "رقم الموسم",
    );

    ensureUniqueSeasonNumber(
      seasons,
      number,
    );

    const plannedEpisodeCount =
      normalizeNullablePositiveInteger(
        input.plannedEpisodeCount,
        "عدد الحلقات المخطط",
      );

    const defaultDuration =
      normalizeNullablePositiveInteger(
        input.defaultEpisodeDurationMinutes,
        "مدة الحلقة",
      );

    const now =
      new Date().toISOString();

    const season: Season = {
      id: crypto.randomUUID(),

      projectId:
        input.projectId,

      number,

      title:
        normalizeOptionalText(
          input.title,
        ),

      description:
        normalizeOptionalText(
          input.description,
        ),

      plannedEpisodeCount,

      defaultEpisodeDurationMinutes:
        defaultDuration,

      orderIndex:
        getNextOrderIndex(seasons),

      createdAt: now,
      updatedAt: now,
    };

    await this.repository.create(
      season,
    );

    return season;
  }

  async updateSeason(
    id: UUID,
    input: UpdateSeasonInput,
  ): Promise<Season> {
    const existingSeason =
      await this.repository.findById(id);

    if (existingSeason === null) {
      throw new Error(
        "الموسم المطلوب غير موجود.",
      );
    }

    validatePositiveInteger(
      input.number,
      "رقم الموسم",
    );

    validateNonNegativeInteger(
      input.orderIndex,
      "ترتيب الموسم",
    );

    const seasons =
      await this.repository
        .findByProjectId(
          existingSeason.projectId,
        );

    ensureUniqueSeasonNumber(
      seasons,
      input.number,
      existingSeason.id,
    );

    const updatedSeason: Season = {
      ...existingSeason,

      number:
        input.number,

      title:
        normalizeOptionalText(
          input.title,
        ),

      description:
        normalizeOptionalText(
          input.description,
        ),

      plannedEpisodeCount:
        normalizeNullablePositiveInteger(
          input.plannedEpisodeCount,
          "عدد الحلقات المخطط",
        ),

      defaultEpisodeDurationMinutes:
        normalizeNullablePositiveInteger(
          input.defaultEpisodeDurationMinutes,
          "مدة الحلقة",
        ),

      orderIndex:
        input.orderIndex,

      updatedAt:
        new Date().toISOString(),
    };

    await this.repository.update(
      updatedSeason,
    );

    return updatedSeason;
  }

  async deleteSeason(
    id: UUID,
  ): Promise<void> {
    await this.repository.delete(id);
  }
}

function getNextNumber(
  seasons: Season[],
): number {
  return seasons.reduce(
    (maximum, season) =>
      Math.max(
        maximum,
        season.number,
      ),
    0,
  ) + 1;
}

function getNextOrderIndex(
  seasons: Season[],
): number {
  return seasons.reduce(
    (maximum, season) =>
      Math.max(
        maximum,
        season.orderIndex,
      ),
    -1,
  ) + 1;
}

function ensureUniqueSeasonNumber(
  seasons: Season[],
  number: number,
  excludedId?: UUID,
): void {
  const duplicate =
    seasons.some(
      (season) =>
        season.id !== excludedId &&
        season.number === number,
    );

  if (duplicate) {
    throw new Error(
      `الموسم رقم ${number} موجود مسبقًا.`,
    );
  }
}

function normalizeOptionalText(
  value:
    string | null | undefined,
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

function normalizeNullablePositiveInteger(
  value:
    number | null | undefined,
  label: string,
): number | null {
  if (
    value === null ||
    value === undefined
  ) {
    return null;
  }

  validatePositiveInteger(
    value,
    label,
  );

  return value;
}

function validatePositiveInteger(
  value: number,
  label: string,
): void {
  if (
    !Number.isInteger(value) ||
    value < 1
  ) {
    throw new Error(
      `${label} يجب أن يكون عددًا صحيحًا أكبر من صفر.`,
    );
  }
}

function validateNonNegativeInteger(
  value: number,
  label: string,
): void {
  if (
    !Number.isInteger(value) ||
    value < 0
  ) {
    throw new Error(
      `${label} يجب أن يكون عددًا صحيحًا غير سالب.`,
    );
  }
}