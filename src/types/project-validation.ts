import type {
  Project,
} from "./project";

export interface ValidationError {
  field:
    | keyof Project
    | string;

  message: string;
}

export function validateProject(
  project: Project,
): ValidationError[] {
  const errors:
    ValidationError[] = [];

  if (!project.title.trim()) {
    errors.push({
      field: "title",
      message:
        "عنوان المشروع إلزامي.",
    });
  }

  if (
    project.projectType === "series"
  ) {
    validateSeriesProject(
      project,
      errors,
    );
  } else if (
    project.seriesStructure !== null
  ) {
    errors.push({
      field: "seriesStructure",
      message:
        "بنية المواسم متاحة لمشاريع المسلسلات فقط.",
    });
  }

  validateDuration(
    project,
    errors,
  );

  validateSceneRange(
    project,
    errors,
  );

  return errors;
}

function validateSeriesProject(
  project: Project,
  errors: ValidationError[],
): void {
  if (
    project.seriesStructure === null
  ) {
    errors.push({
      field: "seriesStructure",
      message:
        "يجب تحديد ما إذا كان المسلسل من موسم واحد أو متعدد المواسم.",
    });
  }

  if (
    project.seriesStructure ===
    "single_season" &&
    project.plannedSeasonCount !== 1
  ) {
    errors.push({
      field: "plannedSeasonCount",
      message:
        "يجب أن يكون عدد المواسم واحدًا في مسلسل الموسم الواحد.",
    });
  }

  if (
    project.seriesStructure ===
    "multi_season" &&
    (
      project.plannedSeasonCount ===
        null ||
      project.plannedSeasonCount < 2
    )
  ) {
    errors.push({
      field: "plannedSeasonCount",
      message:
        "يجب تحديد موسمين على الأقل للمسلسل متعدد المواسم.",
    });
  }

  if (
    project.plannedEpisodeCount ===
      null ||
    project.plannedEpisodeCount < 1
  ) {
    errors.push({
      field: "plannedEpisodeCount",
      message:
        "يجب تحديد عدد حلقات المسلسل.",
    });
  }

  if (
    project
      .defaultEpisodeDurationMinutes ===
      null ||
    project
      .defaultEpisodeDurationMinutes <
      1
  ) {
    errors.push({
      field:
        "defaultEpisodeDurationMinutes",

      message:
        "يجب تحديد مدة الحلقة.",
    });
  }
}

function validateDuration(
  project: Project,
  errors: ValidationError[],
): void {
  const duration =
    project
      .defaultEpisodeDurationMinutes;

  if (
    duration !== null &&
    duration < 1
  ) {
    errors.push({
      field:
        "defaultEpisodeDurationMinutes",

      message:
        "يجب أن تكون المدة أكبر من صفر.",
    });
  }
}

function validateSceneRange(
  project: Project,
  errors: ValidationError[],
): void {
  const minimumScenes =
    project
      .defaultMinimumScenesPerEpisode;

  const maximumScenes =
    project
      .defaultMaximumScenesPerEpisode;

  if (
    minimumScenes !== null &&
    minimumScenes < 0
  ) {
    errors.push({
      field:
        "defaultMinimumScenesPerEpisode",

      message:
        "لا يمكن أن يكون الحد الأدنى للمشاهد سالبًا.",
    });
  }

  if (
    maximumScenes !== null &&
    maximumScenes < 0
  ) {
    errors.push({
      field:
        "defaultMaximumScenesPerEpisode",

      message:
        "لا يمكن أن يكون الحد الأقصى للمشاهد سالبًا.",
    });
  }

  if (
    minimumScenes !== null &&
    maximumScenes !== null &&
    minimumScenes > maximumScenes
  ) {
    errors.push({
      field:
        "defaultMaximumScenesPerEpisode",

      message:
        "يجب ألا يقل الحد الأقصى للمشاهد عن الحد الأدنى.",
    });
  }
}