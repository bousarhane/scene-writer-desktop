import type {
  InteriorExterior,
  Scene,
  SceneStatus,
  TimeOfDay,
  UUID,
} from "../../types";

import type {
  EpisodeRepository,
  LocationRepository,
  SceneRepository,
} from "../../database";

export interface CreateSceneInput {
  projectId: UUID;

  episodeId?: UUID | null;
  locationId?: UUID | null;

  sceneNumber?: string;
  title?: string | null;

  heading?: string;

  interiorExterior?:
    InteriorExterior;

  timeOfDay?: TimeOfDay;

  customTimeOfDay?:
    string | null;

  synopsis?: string | null;

  dramaticPurpose?:
    string | null;

  notes?: string | null;

  estimatedDurationSeconds?:
    number | null;

  status?: SceneStatus;
}

export interface UpdateSceneInput {
  episodeId: UUID | null;
  locationId: UUID | null;

  sceneNumber: string;
  title: string | null;

  heading: string;

  interiorExterior:
    InteriorExterior;

  timeOfDay: TimeOfDay;

  customTimeOfDay:
    string | null;

  synopsis: string | null;

  dramaticPurpose:
    string | null;

  notes: string | null;

  estimatedDurationSeconds:
    number | null;

  status: SceneStatus;
  orderIndex: number;
}

export class SceneService {
  constructor(
    private readonly repository:
      SceneRepository,

    private readonly episodeRepository:
      EpisodeRepository,

    private readonly locationRepository:
      LocationRepository,
  ) {}

  async listScenes(
    projectId: UUID,
  ): Promise<Scene[]> {
    return this.repository
      .findByProjectId(projectId);
  }

  async listScenesByEpisode(
    projectId: UUID,
    episodeId: UUID | null,
  ): Promise<Scene[]> {
    return this.repository
      .findByEpisodeId(
        projectId,
        episodeId,
      );
  }

  async getScene(
    id: UUID,
  ): Promise<Scene | null> {
    return this.repository.findById(
      id,
    );
  }

  async createScene(
    input: CreateSceneInput,
  ): Promise<Scene> {
    const episodeId =
      input.episodeId ?? null;

    const locationId =
      input.locationId ?? null;

    await this.validateEpisode(
      input.projectId,
      episodeId,
    );

    await this.validateLocation(
      input.projectId,
      locationId,
    );

    const siblingScenes =
      await this.repository
        .findByEpisodeId(
          input.projectId,
          episodeId,
        );

    const sceneNumber =
      normalizeOptionalText(
        input.sceneNumber,
      ) ??
      getNextSceneNumber(
        siblingScenes,
      );

    ensureUniqueSceneNumber(
      siblingScenes,
      sceneNumber,
    );

    const timeOfDay =
      input.timeOfDay ??
      "unspecified";

    const customTimeOfDay =
      normalizeOptionalText(
        input.customTimeOfDay,
      );

    validateCustomTimeOfDay(
      timeOfDay,
      customTimeOfDay,
    );

    const estimatedDurationSeconds =
      normalizeDuration(
        input.estimatedDurationSeconds,
      );

    const now =
      new Date().toISOString();

    const scene: Scene = {
      id: crypto.randomUUID(),

      projectId:
        input.projectId,

      episodeId,
      locationId,

      sceneNumber,

      title:
        normalizeOptionalText(
          input.title,
        ),

      heading:
        normalizeOptionalText(
          input.heading,
        ) ?? "",

      interiorExterior:
        input.interiorExterior ??
        "unspecified",

      timeOfDay,
      customTimeOfDay,

      synopsis:
        normalizeOptionalText(
          input.synopsis,
        ),

      dramaticPurpose:
        normalizeOptionalText(
          input.dramaticPurpose,
        ),

      notes:
        normalizeOptionalText(
          input.notes,
        ),

      estimatedDurationSeconds,

      status:
        input.status ??
        "draft",

      orderIndex:
        getNextOrderIndex(
          siblingScenes,
        ),

      createdAt: now,
      updatedAt: now,
    };

    await this.repository.create(
      scene,
    );

    return scene;
  }

  async updateScene(
    id: UUID,
    input: UpdateSceneInput,
  ): Promise<Scene> {
    const existingScene =
      await this.repository.findById(
        id,
      );

    if (existingScene === null) {
      throw new Error(
        "المشهد المطلوب غير موجود.",
      );
    }

    await this.validateEpisode(
      existingScene.projectId,
      input.episodeId,
    );

    await this.validateLocation(
      existingScene.projectId,
      input.locationId,
    );

    const sceneNumber =
      normalizeRequiredText(
        input.sceneNumber,
        "رقم المشهد",
      );

    const siblingScenes =
      await this.repository
        .findByEpisodeId(
          existingScene.projectId,
          input.episodeId,
        );

    ensureUniqueSceneNumber(
      siblingScenes,
      sceneNumber,
      existingScene.id,
    );

    validateNonNegativeInteger(
      input.orderIndex,
      "ترتيب المشهد",
    );

    const customTimeOfDay =
      normalizeOptionalText(
        input.customTimeOfDay,
      );

    validateCustomTimeOfDay(
      input.timeOfDay,
      customTimeOfDay,
    );

    const updatedScene: Scene = {
      ...existingScene,

      episodeId:
        input.episodeId,

      locationId:
        input.locationId,

      sceneNumber,

      title:
        normalizeOptionalText(
          input.title,
        ),

      heading:
        normalizeOptionalText(
          input.heading,
        ) ?? "",

      interiorExterior:
        input.interiorExterior,

      timeOfDay:
        input.timeOfDay,

      customTimeOfDay,

      synopsis:
        normalizeOptionalText(
          input.synopsis,
        ),

      dramaticPurpose:
        normalizeOptionalText(
          input.dramaticPurpose,
        ),

      notes:
        normalizeOptionalText(
          input.notes,
        ),

      estimatedDurationSeconds:
        normalizeDuration(
          input.estimatedDurationSeconds,
        ),

      status:
        input.status,

      orderIndex:
        input.orderIndex,

      updatedAt:
        new Date().toISOString(),
    };

    await this.repository.update(
      updatedScene,
    );

    return updatedScene;
  }

  async deleteScene(
    id: UUID,
  ): Promise<void> {
    await this.repository.delete(id);
  }

  private async validateEpisode(
    projectId: UUID,
    episodeId: UUID | null,
  ): Promise<void> {
    if (episodeId === null) {
      return;
    }

    const episode =
      await this.episodeRepository
        .findById(episodeId);

    if (
      episode === null ||
      episode.projectId !== projectId
    ) {
      throw new Error(
        "الحلقة المحددة غير موجودة داخل هذا المشروع.",
      );
    }
  }

  private async validateLocation(
    projectId: UUID,
    locationId: UUID | null,
  ): Promise<void> {
    if (locationId === null) {
      return;
    }

    const location =
      await this.locationRepository
        .findById(locationId);

    if (
      location === null ||
      location.projectId !== projectId
    ) {
      throw new Error(
        "المكان المحدد غير موجود داخل هذا المشروع.",
      );
    }
  }
}

function ensureUniqueSceneNumber(
  scenes: Scene[],
  sceneNumber: string,
  excludedSceneId?: UUID,
): void {
  const normalizedNumber =
    normalizeComparableText(
      sceneNumber,
    );

  const duplicate =
    scenes.some(
      (scene) =>
        scene.id !==
          excludedSceneId &&
        normalizeComparableText(
          scene.sceneNumber,
        ) === normalizedNumber,
    );

  if (duplicate) {
    throw new Error(
      `المشهد رقم «${sceneNumber}» موجود مسبقًا في القسم نفسه.`,
    );
  }
}

function getNextSceneNumber(
  scenes: Scene[],
): string {
  const numericNumbers =
    scenes
      .map((scene) =>
        Number(scene.sceneNumber),
      )
      .filter(
        (value) =>
          Number.isInteger(value) &&
          value >= 1,
      );

  const maximum =
    numericNumbers.length === 0
      ? 0
      : Math.max(
          ...numericNumbers,
        );

  return String(maximum + 1);
}

function getNextOrderIndex(
  scenes: Scene[],
): number {
  return scenes.reduce(
    (maximum, scene) =>
      Math.max(
        maximum,
        scene.orderIndex,
      ),
    -1,
  ) + 1;
}

function validateCustomTimeOfDay(
  timeOfDay: TimeOfDay,
  customTimeOfDay: string | null,
): void {
  if (
    timeOfDay === "custom" &&
    customTimeOfDay === null
  ) {
    throw new Error(
      "أدخل التحديد الزمني الخاص بالمشهد.",
    );
  }
}

function normalizeDuration(
  value:
    number | null | undefined,
): number | null {
  if (
    value === null ||
    value === undefined
  ) {
    return null;
  }

  validateNonNegativeInteger(
    value,
    "المدة التقديرية",
  );

  return value;
}

function normalizeRequiredText(
  value: string,
  label: string,
): string {
  const normalized =
    normalizeOptionalText(value);

  if (normalized === null) {
    throw new Error(
      `${label} إلزامي.`,
    );
  }

  return normalized;
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

function normalizeComparableText(
  value: string,
): string {
  return value
    .trim()
    .replace(/\s+/g, " ")
    .toLocaleLowerCase();
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