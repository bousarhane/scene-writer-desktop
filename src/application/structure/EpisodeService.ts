import type {
  Episode,
  EpisodeStatus,
  UUID,
} from "../../types";

import type {
  EpisodeRepository,
  SeasonRepository,
} from "../../database";

export interface CreateEpisodeInput {
  projectId: UUID;
  seasonId?: UUID | null;

  number?: number;
  title?: string | null;

  synopsis?: string | null;
  notes?: string | null;

  targetDurationMinutes?: number;

  status?: EpisodeStatus;
}

export interface UpdateEpisodeInput {
  seasonId: UUID | null;

  number: number;
  title: string | null;

  synopsis: string | null;
  notes: string | null;

  targetDurationMinutes: number;

  estimatedDurationSeconds:
    number | null;

  status: EpisodeStatus;
  orderIndex: number;
}

export class EpisodeService {
  constructor(
    private readonly repository:
      EpisodeRepository,

    private readonly seasonRepository:
      SeasonRepository,
  ) {}

  async listEpisodes(
    projectId: UUID,
  ): Promise<Episode[]> {
    return this.repository
      .findByProjectId(projectId);
  }

  async createEpisode(
    input: CreateEpisodeInput,
  ): Promise<Episode> {
    const seasonId =
      input.seasonId ??
      null;

    await this.validateSeason(
      input.projectId,
      seasonId,
    );

    const episodes =
      await this.repository
        .findBySeasonId(
          input.projectId,
          seasonId,
        );

    const number =
      input.number ??
      getNextNumber(episodes);

    validatePositiveInteger(
      number,
      "رقم الحلقة",
    );

    ensureUniqueEpisodeNumber(
      episodes,
      number,
    );

    const projectEpisodes =
      await this.repository
        .findByProjectId(
          input.projectId,
        );

    const duration =
      input.targetDurationMinutes ??
      52;

    validatePositiveInteger(
      duration,
      "مدة الحلقة",
    );

    const now =
      new Date().toISOString();

    const episode: Episode = {
      id: crypto.randomUUID(),

      projectId:
        input.projectId,

      seasonId,

      number,

      title:
        normalizeOptionalText(
          input.title,
        ),

      synopsis:
        normalizeOptionalText(
          input.synopsis,
        ),

      notes:
        normalizeOptionalText(
          input.notes,
        ),

      targetDurationMinutes:
        duration,

      estimatedDurationSeconds:
        null,

      status:
        input.status ??
        "outline",

      orderIndex:
        getNextOrderIndex(
          projectEpisodes,
        ),

      createdAt: now,
      updatedAt: now,
    };

    await this.repository.create(
      episode,
    );

    return episode;
  }

  async updateEpisode(
    id: UUID,
    input: UpdateEpisodeInput,
  ): Promise<Episode> {
    const existingEpisode =
      await this.repository.findById(id);

    if (existingEpisode === null) {
      throw new Error(
        "الحلقة المطلوبة غير موجودة.",
      );
    }

    await this.validateSeason(
      existingEpisode.projectId,
      input.seasonId,
    );

    validatePositiveInteger(
      input.number,
      "رقم الحلقة",
    );

    validatePositiveInteger(
      input.targetDurationMinutes,
      "مدة الحلقة",
    );

    validateNonNegativeInteger(
      input.orderIndex,
      "ترتيب الحلقة",
    );

    if (
      input.estimatedDurationSeconds !==
        null &&
      (
        !Number.isInteger(
          input.estimatedDurationSeconds,
        ) ||
        input.estimatedDurationSeconds < 0
      )
    ) {
      throw new Error(
        "المدة التقديرية يجب أن تكون عددًا صحيحًا غير سالب.",
      );
    }

    const episodes =
      await this.repository
        .findBySeasonId(
          existingEpisode.projectId,
          input.seasonId,
        );

    ensureUniqueEpisodeNumber(
      episodes,
      input.number,
      existingEpisode.id,
    );

    const updatedEpisode: Episode = {
      ...existingEpisode,

      seasonId:
        input.seasonId,

      number:
        input.number,

      title:
        normalizeOptionalText(
          input.title,
        ),

      synopsis:
        normalizeOptionalText(
          input.synopsis,
        ),

      notes:
        normalizeOptionalText(
          input.notes,
        ),

      targetDurationMinutes:
        input.targetDurationMinutes,

      estimatedDurationSeconds:
        input.estimatedDurationSeconds,

      status:
        input.status,

      orderIndex:
        input.orderIndex,

      updatedAt:
        new Date().toISOString(),
    };

    await this.repository.update(
      updatedEpisode,
    );

    return updatedEpisode;
  }

  async deleteEpisode(
    id: UUID,
  ): Promise<void> {
    await this.repository.delete(id);
  }

  private async validateSeason(
    projectId: UUID,
    seasonId: UUID | null,
  ): Promise<void> {
    if (seasonId === null) {
      return;
    }

    const season =
      await this.seasonRepository
        .findById(seasonId);

    if (
      season === null ||
      season.projectId !== projectId
    ) {
      throw new Error(
        "الموسم المحدد غير موجود داخل هذا المشروع.",
      );
    }
  }
}

function getNextNumber(
  episodes: Episode[],
): number {
  return episodes.reduce(
    (maximum, episode) =>
      Math.max(
        maximum,
        episode.number,
      ),
    0,
  ) + 1;
}

function getNextOrderIndex(
  episodes: Episode[],
): number {
  return episodes.reduce(
    (maximum, episode) =>
      Math.max(
        maximum,
        episode.orderIndex,
      ),
    -1,
  ) + 1;
}

function ensureUniqueEpisodeNumber(
  episodes: Episode[],
  number: number,
  excludedId?: UUID,
): void {
  const duplicate =
    episodes.some(
      (episode) =>
        episode.id !== excludedId &&
        episode.number === number,
    );

  if (duplicate) {
    throw new Error(
      `الحلقة رقم ${number} موجودة مسبقًا داخل الموسم نفسه.`,
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