import type { TimestampedEntity, UUID } from "./common";

export interface Season extends TimestampedEntity {
  id: UUID;
  projectId: UUID;

  number: number;
  title: string | null;
  description: string | null;

  plannedEpisodeCount: number | null;
  defaultEpisodeDurationMinutes: number | null;

  orderIndex: number;
}