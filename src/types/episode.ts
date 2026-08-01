import type { TimestampedEntity, UUID } from "./common";

export type EpisodeStatus =
  | "outline"
  | "draft"
  | "review"
  | "final";

export interface Episode extends TimestampedEntity {
  id: UUID;
  projectId: UUID;
  seasonId: UUID | null;

  number: number;
  title: string | null;

  synopsis: string | null;
  notes: string | null;

  targetDurationMinutes: number;
  estimatedDurationSeconds: number | null;

  status: EpisodeStatus;
  orderIndex: number;
}