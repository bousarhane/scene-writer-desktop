import type {
  AppLanguage,
  TimestampedEntity,
  UUID,
} from "./common";

export type PageSize = "a4" | "letter";

export type AppTheme = "light" | "dark" | "system";

export interface ProjectSettings extends TimestampedEntity {
  projectId: UUID;

  defaultFontFamily: string;
  defaultFontSize: number;

  pageSize: PageSize;

  showSceneNumbers: boolean;
  automaticSceneNumbering: boolean;

  autoSaveEnabled: boolean;
  autoSaveIntervalSeconds: number;

  estimatedMinutesPerPage: number;
}

export interface AppSettings {
  interfaceLanguage: AppLanguage;
  theme: AppTheme;

  lastProjectId: UUID | null;
}