import {
  getDatabase,
} from "../sqlite";

import type {
  Location,
  LocationType,
  UUID,
} from "../../types";

import type {
  LocationRepository,
} from "./LocationRepository";

interface LocationRow {
  id: string;
  project_id: string;
  parent_location_id: string | null;

  name: string;
  type: LocationType;

  description: string | null;
  notes: string | null;

  created_at: string;
  updated_at: string;
}

export class SqliteLocationRepository
  implements LocationRepository
{
  async findByProjectId(
    projectId: UUID,
  ): Promise<Location[]> {
    const database =
      await getDatabase();

    const rows =
      await database.select<
        LocationRow[]
      >(
        `
          SELECT
            id,
            project_id,
            parent_location_id,
            name,
            type,
            description,
            notes,
            created_at,
            updated_at
          FROM locations
          WHERE project_id = ?
          ORDER BY name COLLATE NOCASE ASC
        `,
        [projectId],
      );

    return rows.map(
      mapLocationRow,
    );
  }

  async findById(
    id: UUID,
  ): Promise<Location | null> {
    const database =
      await getDatabase();

    const rows =
      await database.select<
        LocationRow[]
      >(
        `
          SELECT
            id,
            project_id,
            parent_location_id,
            name,
            type,
            description,
            notes,
            created_at,
            updated_at
          FROM locations
          WHERE id = ?
          LIMIT 1
        `,
        [id],
      );

    const row = rows[0];

    return row
      ? mapLocationRow(row)
      : null;
  }

  async create(
    location: Location,
  ): Promise<void> {
    const database =
      await getDatabase();

    await database.execute(
      `
        INSERT INTO locations (
          id,
          project_id,
          parent_location_id,
          name,
          type,
          description,
          notes,
          created_at,
          updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        location.id,
        location.projectId,
        location.parentLocationId,
        location.name,
        location.type,
        location.description,
        location.notes,
        location.createdAt,
        location.updatedAt,
      ],
    );
  }

  async update(
    location: Location,
  ): Promise<void> {
    const database =
      await getDatabase();

    await database.execute(
      `
        UPDATE locations
        SET
          parent_location_id = ?,
          name = ?,
          type = ?,
          description = ?,
          notes = ?,
          updated_at = ?
        WHERE id = ?
      `,
      [
        location.parentLocationId,
        location.name,
        location.type,
        location.description,
        location.notes,
        location.updatedAt,
        location.id,
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
        DELETE FROM locations
        WHERE id = ?
      `,
      [id],
    );
  }
}

function mapLocationRow(
  row: LocationRow,
): Location {
  return {
    id: row.id,
    projectId: row.project_id,

    parentLocationId:
      row.parent_location_id,

    name: row.name,
    type: row.type,

    description:
      row.description,

    notes:
      row.notes,

    createdAt:
      row.created_at,

    updatedAt:
      row.updated_at,
  };
}
