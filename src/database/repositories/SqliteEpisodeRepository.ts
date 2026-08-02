import {
  getDatabase,
} from "../sqlite";

import type {
  Episode,
  EpisodeStatus,
  UUID,
} from "../../types";

import type {
  EpisodeRepository,
} from "./EpisodeRepository";

interface EpisodeRow {
  id: string;
  project_id: string;
  season_id: string | null;

  number: number;
  title: string | null;

  synopsis: string | null;
  notes: string | null;

  target_duration_minutes: number;
  estimated_duration_seconds:
    number | null;

  status: EpisodeStatus;
  order_index: number;

  created_at: string;
  updated_at: string;
}

export class SqliteEpisodeRepository
  implements EpisodeRepository
{
  async findByProjectId(
    projectId: UUID,
  ): Promise<Episode[]> {
    const database =
      await getDatabase();

    const rows =
      await database.select<
        EpisodeRow[]
      >(
        `
          SELECT
            id,
            project_id,
            season_id,
            number,
            title,
            synopsis,
            notes,
            target_duration_minutes,
            estimated_duration_seconds,
            status,
            order_index,
            created_at,
            updated_at
          FROM episodes
          WHERE project_id = ?
          ORDER BY order_index ASC
        `,
        [projectId],
      );

    return rows.map(mapEpisodeRow);
  }

  async findBySeasonId(
    projectId: UUID,
    seasonId: UUID | null,
  ): Promise<Episode[]> {
    const database =
      await getDatabase();

    const rows =
      seasonId === null
        ? await database.select<
            EpisodeRow[]
          >(
            `
              SELECT
                id,
                project_id,
                season_id,
                number,
                title,
                synopsis,
                notes,
                target_duration_minutes,
                estimated_duration_seconds,
                status,
                order_index,
                created_at,
                updated_at
              FROM episodes
              WHERE project_id = ?
                AND season_id IS NULL
              ORDER BY order_index ASC
            `,
            [projectId],
          )
        : await database.select<
            EpisodeRow[]
          >(
            `
              SELECT
                id,
                project_id,
                season_id,
                number,
                title,
                synopsis,
                notes,
                target_duration_minutes,
                estimated_duration_seconds,
                status,
                order_index,
                created_at,
                updated_at
              FROM episodes
              WHERE project_id = ?
                AND season_id = ?
              ORDER BY order_index ASC
            `,
            [
              projectId,
              seasonId,
            ],
          );

    return rows.map(mapEpisodeRow);
  }

  async findById(
    id: UUID,
  ): Promise<Episode | null> {
    const database =
      await getDatabase();

    const rows =
      await database.select<
        EpisodeRow[]
      >(
        `
          SELECT
            id,
            project_id,
            season_id,
            number,
            title,
            synopsis,
            notes,
            target_duration_minutes,
            estimated_duration_seconds,
            status,
            order_index,
            created_at,
            updated_at
          FROM episodes
          WHERE id = ?
          LIMIT 1
        `,
        [id],
      );

    const row = rows[0];

    return row
      ? mapEpisodeRow(row)
      : null;
  }

  async create(
    episode: Episode,
  ): Promise<void> {
    const database =
      await getDatabase();

    await database.execute(
      `
        INSERT INTO episodes (
          id,
          project_id,
          season_id,
          number,
          title,
          synopsis,
          notes,
          target_duration_minutes,
          estimated_duration_seconds,
          status,
          order_index,
          created_at,
          updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        episode.id,
        episode.projectId,
        episode.seasonId,
        episode.number,
        episode.title,
        episode.synopsis,
        episode.notes,
        episode.targetDurationMinutes,
        episode.estimatedDurationSeconds,
        episode.status,
        episode.orderIndex,
        episode.createdAt,
        episode.updatedAt,
      ],
    );
  }

  async update(
    episode: Episode,
  ): Promise<void> {
    const database =
      await getDatabase();

    await database.execute(
      `
        UPDATE episodes
        SET
          season_id = ?,
          number = ?,
          title = ?,
          synopsis = ?,
          notes = ?,
          target_duration_minutes = ?,
          estimated_duration_seconds = ?,
          status = ?,
          order_index = ?,
          updated_at = ?
        WHERE id = ?
      `,
      [
        episode.seasonId,
        episode.number,
        episode.title,
        episode.synopsis,
        episode.notes,
        episode.targetDurationMinutes,
        episode.estimatedDurationSeconds,
        episode.status,
        episode.orderIndex,
        episode.updatedAt,
        episode.id,
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
        DELETE FROM episodes
        WHERE id = ?
      `,
      [id],
    );
  }
}

function mapEpisodeRow(
  row: EpisodeRow,
): Episode {
  return {
    id: row.id,
    projectId: row.project_id,
    seasonId: row.season_id,

    number: row.number,
    title: row.title,

    synopsis: row.synopsis,
    notes: row.notes,

    targetDurationMinutes:
      row.target_duration_minutes,

    estimatedDurationSeconds:
      row.estimated_duration_seconds,

    status: row.status,

    orderIndex:
      row.order_index,

    createdAt:
      row.created_at,

    updatedAt:
      row.updated_at,
  };
}