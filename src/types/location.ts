import type { TimestampedEntity, UUID } from "./common";

export type LocationType =
  | "house"
  | "room"
  | "street"
  | "workplace"
  | "public_space"
  | "vehicle"
  | "rural"
  | "other";

export interface Location extends TimestampedEntity {
  id: UUID;
  projectId: UUID;

  name: string;
  type: LocationType;

  parentLocationId: UUID | null;

  description: string | null;
  notes: string | null;
}