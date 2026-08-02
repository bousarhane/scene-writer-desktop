import {
  getDatabase,
} from "../sqlite";

import type {
  Season,
  UUID,
} from "../../types";

import type {
  SeasonRepository,
} from "./SeasonRepository";

interface SeasonRow {
  id: string;
  project_id: string;

  number: number;
  title: string | null;
  description: string | null;

  planned_episode_count:
    number | null;

  default_episode_duration_minutes:
    number | null;

  order_index: number;

  created_at: string;
  updated_at: string;
}

export class SqliteSeasonRepository
  implements SeasonRepository
{
  async findByProjectId(
    projectId: UUID,
  ): Promise<Season[]> {
    const database =
      await getDatabase();

    const rows =
      await database.select<
        SeasonRow[]
      >(
        `
          SELECT
            id,
            project_id,
            number,
            title,
            description,
            planned_episode_count,
            default_episode_duration_minutes,
            order_index,
            created_at,
            updated_at
          FROM seasons
          WHERE project_id = ?
          ORDER BY order_index ASC
        `,
        [projectId],
      );

    return rows.map(mapSeasonRow);
  }

  async findById(
    id: UUID,
  ): Promise<Season | null> {
    const database =
      await getDatabase();

    const rows =
      await database.select<
        SeasonRow[]
      >(
        `
          SELECT
            id,
            project_id,
            number,
            title,
            description,
            planned_episode_count,
            default_episode_duration_minutes,
            order_index,
            created_at,
            updated_at
          FROM seasons
          WHERE id = ?
          LIMIT 1
        `,
        [id],
      );

    const row = rows[0];

    return row
      ? mapSeasonRow(row)
      : null;
  }

  async create(
    season: Season,
  ): Promise<void> {
    const database =
      await getDatabase();

    await database.execute(
      `
        INSERT INTO seasons (
          id,
          project_id,
          number,
          title,
          description,
          planned_episode_count,
          default_episode_duration_minutes,
          order_index,
          created_at,
          updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        season.id,
        season.projectId,
        season.number,
        season.title,
        season.description,
        season.plannedEpisodeCount,
        season.defaultEpisodeDurationMinutes,
        season.orderIndex,
        season.createdAt,
        season.updatedAt,
      ],
    );
  }

  async update(
    season: Season,
  ): Promise<void> {
    const database =
      await getDatabase();

    await database.execute(
      `
        UPDATE seasons
        SET
          number = ?,
          title = ?,
          description = ?,
          planned_episode_count = ?,
          default_episode_duration_minutes = ?,
          order_index = ?,
          updated_at = ?
        WHERE id = ?
      `,
      [
        season.number,
        season.title,
        season.description,
        season.plannedEpisodeCount,
        season.defaultEpisodeDurationMinutes,
        season.orderIndex,
        season.updatedAt,
        season.id,
      ],
    );
  }

  async delete(
    id: UUID,
  ): Promise<void> {
    const database =
      await getDatabase();

    await database.execute(
      `
        DELETE FROM seasons
        WHERE id = ?
      `,
      [id],
    );
  }
}

function mapSeasonRow(
  row: SeasonRow,
): Season {
  return {
    id: row.id,
    projectId: row.project_id,

    number: row.number,
    title: row.title,
    description: row.description,

    plannedEpisodeCount:
      row.planned_episode_count,

    defaultEpisodeDurationMinutes:
      row.default_episode_duration_minutes,

    orderIndex:
      row.order_index,

    createdAt:
      row.created_at,

    updatedAt:
      row.updated_at,
  };
}