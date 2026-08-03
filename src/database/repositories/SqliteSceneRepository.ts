import {
  getDatabase,
} from "../sqlite";

import type {
  InteriorExterior,
  Scene,
  SceneStatus,
  TimeOfDay,
  UUID,
} from "../../types";

import type {
  SceneRepository,
} from "./SceneRepository";

interface SceneRow {
  id: string;
  project_id: string;

  episode_id: string | null;
  location_id: string | null;

  scene_number: string;
  title: string | null;

  heading: string;

  interior_exterior:
    InteriorExterior;

  time_of_day: TimeOfDay;

  custom_time_of_day:
    string | null;

  synopsis: string | null;

  dramatic_purpose:
    string | null;

  notes: string | null;

  estimated_duration_seconds:
    number | null;

  status: SceneStatus;
  order_index: number;

  created_at: string;
  updated_at: string;
}

export class SqliteSceneRepository
  implements SceneRepository
{
  async findByProjectId(
    projectId: UUID,
  ): Promise<Scene[]> {
    const database =
      await getDatabase();

    const rows =
      await database.select<
        SceneRow[]
      >(
        `
          SELECT
            id,
            project_id,
            episode_id,
            location_id,
            scene_number,
            title,
            heading,
            interior_exterior,
            time_of_day,
            custom_time_of_day,
            synopsis,
            dramatic_purpose,
            notes,
            estimated_duration_seconds,
            status,
            order_index,
            created_at,
            updated_at
          FROM scenes
          WHERE project_id = ?
          ORDER BY
            CASE
              WHEN episode_id IS NULL
                THEN 0
              ELSE 1
            END,
            episode_id,
            order_index ASC
        `,
        [projectId],
      );

    return rows.map(
      mapSceneRow,
    );
  }

  async findByEpisodeId(
    projectId: UUID,
    episodeId: UUID | null,
  ): Promise<Scene[]> {
    const database =
      await getDatabase();

    const rows =
      episodeId === null
        ? await database.select<
            SceneRow[]
          >(
            `
              SELECT
                id,
                project_id,
                episode_id,
                location_id,
                scene_number,
                title,
                heading,
                interior_exterior,
                time_of_day,
                custom_time_of_day,
                synopsis,
                dramatic_purpose,
                notes,
                estimated_duration_seconds,
                status,
                order_index,
                created_at,
                updated_at
              FROM scenes
              WHERE project_id = ?
                AND episode_id IS NULL
              ORDER BY order_index ASC
            `,
            [projectId],
          )
        : await database.select<
            SceneRow[]
          >(
            `
              SELECT
                id,
                project_id,
                episode_id,
                location_id,
                scene_number,
                title,
                heading,
                interior_exterior,
                time_of_day,
                custom_time_of_day,
                synopsis,
                dramatic_purpose,
                notes,
                estimated_duration_seconds,
                status,
                order_index,
                created_at,
                updated_at
              FROM scenes
              WHERE project_id = ?
                AND episode_id = ?
              ORDER BY order_index ASC
            `,
            [
              projectId,
              episodeId,
            ],
          );

    return rows.map(
      mapSceneRow,
    );
  }

  async findById(
    id: UUID,
  ): Promise<Scene | null> {
    const database =
      await getDatabase();

    const rows =
      await database.select<
        SceneRow[]
      >(
        `
          SELECT
            id,
            project_id,
            episode_id,
            location_id,
            scene_number,
            title,
            heading,
            interior_exterior,
            time_of_day,
            custom_time_of_day,
            synopsis,
            dramatic_purpose,
            notes,
            estimated_duration_seconds,
            status,
            order_index,
            created_at,
            updated_at
          FROM scenes
          WHERE id = ?
          LIMIT 1
        `,
        [id],
      );

    const row = rows[0];

    return row
      ? mapSceneRow(row)
      : null;
  }

  async create(
    scene: Scene,
  ): Promise<void> {
    const database =
      await getDatabase();

    await database.execute(
      `
        INSERT INTO scenes (
          id,
          project_id,
          episode_id,
          location_id,
          scene_number,
          title,
          heading,
          interior_exterior,
          time_of_day,
          custom_time_of_day,
          synopsis,
          dramatic_purpose,
          notes,
          estimated_duration_seconds,
          status,
          order_index,
          created_at,
          updated_at
        )
        VALUES (
          ?, ?, ?, ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?, ?, ?, ?, ?
        )
      `,
      [
        scene.id,
        scene.projectId,

        scene.episodeId,
        scene.locationId,

        scene.sceneNumber,
        scene.title,

        scene.heading,

        scene.interiorExterior,

        scene.timeOfDay,
        scene.customTimeOfDay,

        scene.synopsis,
        scene.dramaticPurpose,
        scene.notes,

        scene.estimatedDurationSeconds,

        scene.status,
        scene.orderIndex,

        scene.createdAt,
        scene.updatedAt,
      ],
    );
  }

  async update(
    scene: Scene,
  ): Promise<void> {
    const database =
      await getDatabase();

    await database.execute(
      `
        UPDATE scenes
        SET
          episode_id = ?,
          location_id = ?,
          scene_number = ?,
          title = ?,
          heading = ?,
          interior_exterior = ?,
          time_of_day = ?,
          custom_time_of_day = ?,
          synopsis = ?,
          dramatic_purpose = ?,
          notes = ?,
          estimated_duration_seconds = ?,
          status = ?,
          order_index = ?,
          updated_at = ?
        WHERE id = ?
      `,
      [
        scene.episodeId,
        scene.locationId,

        scene.sceneNumber,
        scene.title,

        scene.heading,

        scene.interiorExterior,

        scene.timeOfDay,
        scene.customTimeOfDay,

        scene.synopsis,
        scene.dramaticPurpose,
        scene.notes,

        scene.estimatedDurationSeconds,

        scene.status,
        scene.orderIndex,

        scene.updatedAt,
        scene.id,
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
        DELETE FROM scenes
        WHERE id = ?
      `,
      [id],
    );
  }
}

function mapSceneRow(
  row: SceneRow,
): Scene {
  return {
    id: row.id,
    projectId: row.project_id,

    episodeId: row.episode_id,
    locationId: row.location_id,

    sceneNumber:
      row.scene_number,

    title: row.title,

    heading: row.heading,

    interiorExterior:
      row.interior_exterior,

    timeOfDay:
      row.time_of_day,

    customTimeOfDay:
      row.custom_time_of_day,

    synopsis: row.synopsis,

    dramaticPurpose:
      row.dramatic_purpose,

    notes: row.notes,

    estimatedDurationSeconds:
      row.estimated_duration_seconds,

    status: row.status,

    orderIndex:
      row.order_index,

    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}