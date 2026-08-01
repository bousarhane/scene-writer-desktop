import type { TimestampedEntity, UUID } from "./common";

export type CharacterGender =
  | "male"
  | "female"
  | "other"
  | "unspecified";

export type CharacterRole =
  | "main"
  | "supporting"
  | "secondary"
  | "minor"
  | "extra"
  | "unspecified";

export interface Character extends TimestampedEntity {
  id: UUID;
  projectId: UUID;

  name: string;
  shortName: string | null;

  gender: CharacterGender;
  age: string | null;
  role: CharacterRole;

  physicalDescription: string | null;
  personality: string | null;
  psychologicalProfile: string | null;

  goals: string | null;
  motivations: string | null;
  background: string | null;

  notes: string | null;

  orderIndex: number;
}

export interface CharacterAlias {
  id: UUID;
  characterId: UUID;

  alias: string;
}

export type CharacterRelationType =
  | "parent"
  | "child"
  | "spouse"
  | "sibling"
  | "friend"
  | "enemy"
  | "colleague"
  | "relative"
  | "custom";

export interface CharacterRelation extends TimestampedEntity {
  id: UUID;
  projectId: UUID;

  sourceCharacterId: UUID;
  targetCharacterId: UUID;

  relationType: CharacterRelationType;
  customLabel: string | null;
  description: string | null;
}

export interface SceneCharacter {
  id: UUID;
  sceneId: UUID;
  characterId: UUID;

  isSpeaking: boolean;
  notes: string | null;

  createdAt: string;
}