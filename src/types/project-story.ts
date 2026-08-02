import type {
  ISODateTime,
  UUID,
} from "./common";

export interface ProjectStory {
  projectId: UUID;

  premise: string;
  logline: string;
  synopsis: string;

  themes: string;
  centralConflict: string;

  startingPoint: string;
  expectedDirection: string;

  writerNotes: string;

  createdAt: ISODateTime;
  updatedAt: ISODateTime;
}

export interface ProjectStoryContent {
  premise: string;
  logline: string;
  synopsis: string;

  themes: string;
  centralConflict: string;

  startingPoint: string;
  expectedDirection: string;

  writerNotes: string;
}