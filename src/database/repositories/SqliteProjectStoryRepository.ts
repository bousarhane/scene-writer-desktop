import { getDatabase } from "../sqlite";

import type {
  ProjectStory,
  UUID,
} from "../../types";

import type {
  ProjectStoryRepository,
} from "./ProjectStoryRepository";

interface ProjectStoryRow {
  project_id: string;

  premise: string;
  logline: string;
  synopsis: string;

  themes: string;
  central_conflict: string;

  starting_point: string;
  expected_direction: string;

  writer_notes: string;

  created_at: string;
  updated_at: string;
}

export class SqliteProjectStoryRepository
  implements ProjectStoryRepository
{
  async findByProjectId(
    projectId: UUID,
  ): Promise<ProjectStory | null> {
    const database = await getDatabase();

    const rows =
      await database.select<ProjectStoryRow[]>(
        `
          SELECT
            project_id,
            premise,
            logline,
            synopsis,
            themes,
            central_conflict,
            starting_point,
            expected_direction,
            writer_notes,
            created_at,
            updated_at
          FROM project_stories
          WHERE project_id = ?
          LIMIT 1
        `,
        [projectId],
      );

    const row = rows[0];

    return row
      ? mapProjectStoryRow(row)
      : null;
  }

  async create(
    story: ProjectStory,
  ): Promise<void> {
    const database = await getDatabase();

    await database.execute(
      `
        INSERT INTO project_stories (
          project_id,
          premise,
          logline,
          synopsis,
          themes,
          central_conflict,
          starting_point,
          expected_direction,
          writer_notes,
          created_at,
          updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        story.projectId,
        story.premise,
        story.logline,
        story.synopsis,
        story.themes,
        story.centralConflict,
        story.startingPoint,
        story.expectedDirection,
        story.writerNotes,
        story.createdAt,
        story.updatedAt,
      ],
    );
  }

  async update(
    story: ProjectStory,
  ): Promise<void> {
    const database = await getDatabase();

    await database.execute(
      `
        UPDATE project_stories
        SET
          premise = ?,
          logline = ?,
          synopsis = ?,
          themes = ?,
          central_conflict = ?,
          starting_point = ?,
          expected_direction = ?,
          writer_notes = ?,
          updated_at = ?
        WHERE project_id = ?
      `,
      [
        story.premise,
        story.logline,
        story.synopsis,
        story.themes,
        story.centralConflict,
        story.startingPoint,
        story.expectedDirection,
        story.writerNotes,
        story.updatedAt,
        story.projectId,
      ],
    );
  }

  async deleteByProjectId(
    projectId: UUID,
  ): Promise<void> {
    const database = await getDatabase();

    await database.execute(
      `
        DELETE FROM project_stories
        WHERE project_id = ?
      `,
      [projectId],
    );
  }
}

function mapProjectStoryRow(
  row: ProjectStoryRow,
): ProjectStory {
  return {
    projectId: row.project_id,

    premise: row.premise,
    logline: row.logline,
    synopsis: row.synopsis,

    themes: row.themes,
    centralConflict:
      row.central_conflict,

    startingPoint:
      row.starting_point,

    expectedDirection:
      row.expected_direction,

    writerNotes: row.writer_notes,

    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}