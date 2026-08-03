import type {
  TimestampedEntity,
  UUID,
} from "./common";

export type InteriorExterior =
  | "interior"
  | "exterior"
  | "interior_exterior"
  | "unspecified";

export type TimeOfDay =
  | "day"
  | "night"
  | "morning"
  | "evening"
  | "dawn"
  | "sunset"
  | "continuous"
  | "later"
  | "unspecified"
  | "custom";

export type SceneStatus =
  | "draft"
  | "review"
  | "approved"
  | "omitted";

export interface Scene
  extends TimestampedEntity
{
  id: UUID;
  projectId: UUID;

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