import type {
  SceneElement,
  SceneElementType,
  UUID,
} from "../../types";

import {
  getDatabase,
  runExclusiveDatabaseWrite,
} from "../sqlite";

import type {
  SceneElementRepository,
} from "./SceneElementRepository";

interface SceneElementRow {
  id: string;
  project_id: string;
  scene_id: string;
  character_id: string | null;
  type: SceneElementType;
  content: string;
  order_index: number;
  is_dual_dialogue: number;
  is_locked: number;
  created_at: string;
  updated_at: string;
}

export class SqliteSceneElementRepository
  implements SceneElementRepository
{
  async findBySceneId(
    sceneId: UUID,
  ): Promise<SceneElement[]> {
    const database = await getDatabase();

    const rows = await database.select<
      SceneElementRow[]
    >(
      `
        SELECT
          id,
          project_id,
          scene_id,
          character_id,
          type,
          content,
          order_index,
          is_dual_dialogue,
          is_locked,
          created_at,
          updated_at
        FROM scene_elements
        WHERE scene_id = ?
        ORDER BY
          order_index ASC,
          created_at ASC,
          id ASC
      `,
      [sceneId],
    );

    return rows.map(mapSceneElementRow);
  }

  async findById(
    id: UUID,
  ): Promise<SceneElement | null> {
    const database = await getDatabase();

    const rows = await database.select<
      SceneElementRow[]
    >(
      `
        SELECT
          id,
          project_id,
          scene_id,
          character_id,
          type,
          content,
          order_index,
          is_dual_dialogue,
          is_locked,
          created_at,
          updated_at
        FROM scene_elements
        WHERE id = ?
        LIMIT 1
      `,
      [id],
    );

    return rows[0]
      ? mapSceneElementRow(rows[0])
      : null;
  }

  async create(
    element: SceneElement,
  ): Promise<void> {
    const database = await getDatabase();

    await database.execute(
      `
        INSERT INTO scene_elements (
          id,
          project_id,
          scene_id,
          character_id,
          type,
          content,
          order_index,
          is_dual_dialogue,
          is_locked,
          created_at,
          updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        element.id,
        element.projectId,
        element.sceneId,
        element.characterId,
        element.type,
        element.content,
        element.orderIndex,
        element.isDualDialogue ? 1 : 0,
        element.isLocked ? 1 : 0,
        element.createdAt,
        element.updatedAt,
      ],
    );
  }

  async update(
    element: SceneElement,
  ): Promise<void> {
    const database = await getDatabase();

    await database.execute(
      `
        UPDATE scene_elements
        SET
          character_id = ?,
          type = ?,
          content = ?,
          order_index = ?,
          is_dual_dialogue = ?,
          is_locked = ?,
          updated_at = ?
        WHERE id = ?
      `,
      [
        element.characterId,
        element.type,
        element.content,
        element.orderIndex,
        element.isDualDialogue ? 1 : 0,
        element.isLocked ? 1 : 0,
        element.updatedAt,
        element.id,
      ],
    );
  }

  async delete(
    id: UUID,
  ): Promise<void> {
    const database = await getDatabase();

    await database.execute(
      "DELETE FROM scene_elements WHERE id = ?",
      [id],
    );
  }

  async replaceOrder(
    sceneId: UUID,
    orderedElementIds: UUID[],
  ): Promise<void> {
    await runExclusiveDatabaseWrite(
      async (database) => {
        const timestamp =
          new Date().toISOString();

        for (
          let orderIndex = 0;
          orderIndex < orderedElementIds.length;
          orderIndex += 1
        ) {
          await database.execute(
            `
              UPDATE scene_elements
              SET
                order_index = ?,
                updated_at = ?
              WHERE id = ?
                AND scene_id = ?
            `,
            [
              orderIndex,
              timestamp,
              orderedElementIds[orderIndex],
              sceneId,
            ],
          );
        }
      },
    );
  }
}

function mapSceneElementRow(
  row: SceneElementRow,
): SceneElement {
  return {
    id: row.id,
    projectId: row.project_id,
    sceneId: row.scene_id,
    characterId: row.character_id,
    type: row.type,
    content: row.content,
    orderIndex: row.order_index,
    isDualDialogue:
      row.is_dual_dialogue === 1,
    isLocked:
      row.is_locked === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
