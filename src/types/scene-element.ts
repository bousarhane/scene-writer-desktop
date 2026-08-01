 import type { TimestampedEntity, UUID } from "./common";

export type SceneElementType =
  | "action"
  | "character"
  | "dialogue"
  | "parenthetical"
  | "transition"
  | "shot"
  | "centered_text"
  | "note";

export interface SceneElement extends TimestampedEntity {
  id: UUID;
  projectId: UUID;
  sceneId: UUID;

  type: SceneElementType;
  content: string;

  characterId: UUID | null;

  orderIndex: number;

  isDualDialogue: boolean;
  isLocked: boolean;
}