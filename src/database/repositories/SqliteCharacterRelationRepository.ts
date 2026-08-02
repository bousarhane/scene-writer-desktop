import {
  getDatabase,
} from "../sqlite";

import type {
  CharacterRelation,
  CharacterRelationType,
  UUID,
} from "../../types";

import type {
  CharacterRelationRepository,
} from "./CharacterRelationRepository";

interface CharacterRelationRow {
  id: string;
  project_id: string;

  source_character_id: string;
  target_character_id: string;

  relation_type: CharacterRelationType;
  custom_label: string | null;
  description: string | null;

  created_at: string;
  updated_at: string;
}

export class SqliteCharacterRelationRepository
  implements CharacterRelationRepository
{
  async findByCharacterId(
    projectId: UUID,
    characterId: UUID,
  ): Promise<CharacterRelation[]> {
    const database =
      await getDatabase();

    const rows =
      await database.select<
        CharacterRelationRow[]
      >(
        `
          SELECT
            id,
            project_id,
            source_character_id,
            target_character_id,
            relation_type,
            custom_label,
            description,
            created_at,
            updated_at
          FROM character_relations
          WHERE project_id = ?
            AND (
              source_character_id = ?
              OR target_character_id = ?
            )
          ORDER BY created_at ASC
        `,
        [
          projectId,
          characterId,
          characterId,
        ],
      );

    return rows.map(
      mapCharacterRelationRow,
    );
  }

  async findById(
    id: UUID,
  ): Promise<CharacterRelation | null> {
    const database =
      await getDatabase();

    const rows =
      await database.select<
        CharacterRelationRow[]
      >(
        `
          SELECT
            id,
            project_id,
            source_character_id,
            target_character_id,
            relation_type,
            custom_label,
            description,
            created_at,
            updated_at
          FROM character_relations
          WHERE id = ?
          LIMIT 1
        `,
        [id],
      );

    const row = rows[0];

    return row
      ? mapCharacterRelationRow(row)
      : null;
  }

  async create(
    relation: CharacterRelation,
  ): Promise<void> {
    const database =
      await getDatabase();

    await database.execute(
      `
        INSERT INTO character_relations (
          id,
          project_id,
          source_character_id,
          target_character_id,
          relation_type,
          custom_label,
          description,
          created_at,
          updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        relation.id,
        relation.projectId,

        relation.sourceCharacterId,
        relation.targetCharacterId,

        relation.relationType,
        relation.customLabel,
        relation.description,

        relation.createdAt,
        relation.updatedAt,
      ],
    );
  }

  async update(
    relation: CharacterRelation,
  ): Promise<void> {
    const database =
      await getDatabase();

    await database.execute(
      `
        UPDATE character_relations
        SET
          source_character_id = ?,
          target_character_id = ?,
          relation_type = ?,
          custom_label = ?,
          description = ?,
          updated_at = ?
        WHERE id = ?
      `,
      [
        relation.sourceCharacterId,
        relation.targetCharacterId,

        relation.relationType,
        relation.customLabel,
        relation.description,

        relation.updatedAt,
        relation.id,
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
        DELETE FROM character_relations
        WHERE id = ?
      `,
      [id],
    );
  }
}

function mapCharacterRelationRow(
  row: CharacterRelationRow,
): CharacterRelation {
  return {
    id: row.id,
    projectId: row.project_id,

    sourceCharacterId:
      row.source_character_id,

    targetCharacterId:
      row.target_character_id,

    relationType:
      row.relation_type,

    customLabel:
      row.custom_label,

    description:
      row.description,

    createdAt:
      row.created_at,

    updatedAt:
      row.updated_at,
  };
}