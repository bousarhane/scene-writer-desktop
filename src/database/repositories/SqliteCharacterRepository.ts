import {
  getDatabase,
} from "../sqlite";

import type {
  Character,
  CharacterGender,
  CharacterRole,
  UUID,
} from "../../types";

import type {
  CharacterRepository,
} from "./CharacterRepository";

interface CharacterRow {
  id: string;
  project_id: string;

  name: string;
  short_name: string | null;

  gender: CharacterGender;
  age: string | null;
  role: CharacterRole;

  physical_description: string | null;
  personality: string | null;
  psychological_profile: string | null;

  goals: string | null;
  motivations: string | null;
  background: string | null;

  notes: string | null;

  order_index: number;

  created_at: string;
  updated_at: string;
}

interface MaximumOrderRow {
  maximum_order_index: number | null;
}

export class SqliteCharacterRepository
  implements CharacterRepository
{
  async findByProjectId(
    projectId: UUID,
  ): Promise<Character[]> {
    const database =
      await getDatabase();

    const rows =
      await database.select<CharacterRow[]>(
        `
          SELECT
            id,
            project_id,
            name,
            short_name,
            gender,
            age,
            role,
            physical_description,
            personality,
            psychological_profile,
            goals,
            motivations,
            background,
            notes,
            order_index,
            created_at,
            updated_at
          FROM characters
          WHERE project_id = ?
          ORDER BY order_index ASC
        `,
        [projectId],
      );

    return rows.map(
      mapCharacterRow,
    );
  }

  async findById(
    id: UUID,
  ): Promise<Character | null> {
    const database =
      await getDatabase();

    const rows =
      await database.select<CharacterRow[]>(
        `
          SELECT
            id,
            project_id,
            name,
            short_name,
            gender,
            age,
            role,
            physical_description,
            personality,
            psychological_profile,
            goals,
            motivations,
            background,
            notes,
            order_index,
            created_at,
            updated_at
          FROM characters
          WHERE id = ?
          LIMIT 1
        `,
        [id],
      );

    const row = rows[0];

    return row
      ? mapCharacterRow(row)
      : null;
  }

  async create(
    character: Character,
  ): Promise<void> {
    const database =
      await getDatabase();

    await database.execute(
      `
        INSERT INTO characters (
          id,
          project_id,
          name,
          short_name,
          gender,
          age,
          role,
          physical_description,
          personality,
          psychological_profile,
          goals,
          motivations,
          background,
          notes,
          order_index,
          created_at,
          updated_at
        )
        VALUES (
          ?, ?, ?, ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?, ?, ?, ?
        )
      `,
      [
        character.id,
        character.projectId,

        character.name,
        character.shortName,

        character.gender,
        character.age,
        character.role,

        character.physicalDescription,
        character.personality,
        character.psychologicalProfile,

        character.goals,
        character.motivations,
        character.background,

        character.notes,

        character.orderIndex,

        character.createdAt,
        character.updatedAt,
      ],
    );
  }

  async update(
    character: Character,
  ): Promise<void> {
    const database =
      await getDatabase();

    await database.execute(
      `
        UPDATE characters
        SET
          name = ?,
          short_name = ?,
          gender = ?,
          age = ?,
          role = ?,
          physical_description = ?,
          personality = ?,
          psychological_profile = ?,
          goals = ?,
          motivations = ?,
          background = ?,
          notes = ?,
          order_index = ?,
          updated_at = ?
        WHERE id = ?
      `,
      [
        character.name,
        character.shortName,

        character.gender,
        character.age,
        character.role,

        character.physicalDescription,
        character.personality,
        character.psychologicalProfile,

        character.goals,
        character.motivations,
        character.background,

        character.notes,

        character.orderIndex,
        character.updatedAt,

        character.id,
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
        DELETE FROM characters
        WHERE id = ?
      `,
      [id],
    );
  }

  async getNextOrderIndex(
    projectId: UUID,
  ): Promise<number> {
    const database =
      await getDatabase();

    const rows =
      await database.select<MaximumOrderRow[]>(
        `
          SELECT
            MAX(order_index)
              AS maximum_order_index
          FROM characters
          WHERE project_id = ?
        `,
        [projectId],
      );

    const maximumOrderIndex =
      rows[0]?.maximum_order_index;

    return maximumOrderIndex === null ||
      maximumOrderIndex === undefined
      ? 0
      : maximumOrderIndex + 1;
  }
}

function mapCharacterRow(
  row: CharacterRow,
): Character {
  return {
    id: row.id,
    projectId: row.project_id,

    name: row.name,
    shortName: row.short_name,

    gender: row.gender,
    age: row.age,
    role: row.role,

    physicalDescription:
      row.physical_description,

    personality:
      row.personality,

    psychologicalProfile:
      row.psychological_profile,

    goals: row.goals,
    motivations: row.motivations,
    background: row.background,

    notes: row.notes,

    orderIndex: row.order_index,

    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}