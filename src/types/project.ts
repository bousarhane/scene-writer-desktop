import type {
  AppLanguage,
  ISODateTime,
  TextDirection,
  TimestampedEntity,
  UUID,
} from "./common";

export type ProjectType =
  | "film"
  | "series"
  | "short_film"
  | "single_episode"
  | "stage_play";

export type SeriesStructure =
  | "single_season"
  | "multi_season";

export type ProjectStatus =
  | "draft"
  | "in_progress"
  | "review"
  | "completed"
  | "archived";

export interface Project
  extends TimestampedEntity {
  id: UUID;

  title: string;
  subtitle: string | null;

  projectType: ProjectType;
  seriesStructure:
    SeriesStructure | null;

  status: ProjectStatus;

  language: AppLanguage;
  textDirection: TextDirection;

  authorName: string | null;
  description: string | null;

  plannedSeasonCount: number | null;
  plannedEpisodeCount: number | null;

  defaultEpisodeDurationMinutes:
    number | null;

  defaultMinimumScenesPerEpisode:
    number | null;

  defaultMaximumScenesPerEpisode:
    number | null;

  lastOpenedAt: ISODateTime | null;
}