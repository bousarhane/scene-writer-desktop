import type { Project } from "./project";

export interface ValidationError {
  field: keyof Project | string;
  message: string;
}

export function validateProject(
  project: Project,
): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!project.title.trim()) {
    errors.push({
      field: "title",
      message: "عنوان المشروع إلزامي.",
    });
  }

  if (project.projectType === "series") {
    if (
      project.plannedSeasonCount === null ||
      project.plannedSeasonCount < 1
    ) {
      errors.push({
        field: "plannedSeasonCount",
        message: "يجب تحديد عدد مواسم المسلسل.",
      });
    }

    if (
      project.plannedEpisodeCount === null ||
      project.plannedEpisodeCount < 1
    ) {
      errors.push({
        field: "plannedEpisodeCount",
        message: "يجب تحديد عدد حلقات المسلسل.",
      });
    }

    if (
      project.defaultEpisodeDurationMinutes === null ||
      project.defaultEpisodeDurationMinutes < 1
    ) {
      errors.push({
        field: "defaultEpisodeDurationMinutes",
        message: "يجب تحديد مدة الحلقة.",
      });
    }
  }

  const minimumScenes =
    project.defaultMinimumScenesPerEpisode;

  const maximumScenes =
    project.defaultMaximumScenesPerEpisode;

  if (
    minimumScenes !== null &&
    maximumScenes !== null &&
    minimumScenes > maximumScenes
  ) {
    errors.push({
      field: "defaultMaximumScenesPerEpisode",
      message:
        "الحد الأقصى لعدد المشاهد يجب ألا يقل عن الحد الأدنى.",
    });
  }

  return errors;
}