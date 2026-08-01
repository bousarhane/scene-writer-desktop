import { getDatabase } from "../sqlite";
import type {
  Project,
  ProjectStatus,
  ProjectType,
  AppLanguage,
  TextDirection,
  UUID,
} from "../../types";
import type { ProjectRepository } from "./ProjectRepository";

interface ProjectRow {
  id: string;

  title: string;
  subtitle: string | null;

  project_type: ProjectType;
  status: ProjectStatus;

  language: AppLanguage;
  text_direction: TextDirection;

  author_name: string | null;
  description: string | null;

  planned_season_count: number | null;
  planned_episode_count: number | null;

  default_episode_duration_minutes: number | null;
  default_minimum_scenes_per_episode: number | null;
  default_maximum_scenes_per_episode: number | null;

  last_opened_at: string | null;

  created_at: string;
  updated_at: string;
}

function mapProjectRow(row: ProjectRow): Project {
  return {
    id: row.id,

    title: row.title,
    subtitle: row.subtitle,

    projectType: row.project_type,
    status: row.status,

    language: row.language,
    textDirection: row.text_direction,

    authorName: row.author_name,
    description: row.description,

    plannedSeasonCount: row.planned_season_count,
    plannedEpisodeCount: row.planned_episode_count,

    defaultEpisodeDurationMinutes:
      row.default_episode_duration_minutes,

    defaultMinimumScenesPerEpisode:
      row.default_minimum_scenes_per_episode,

    defaultMaximumScenesPerEpisode:
      row.default_maximum_scenes_per_episode,

    lastOpenedAt: row.last_opened_at,

    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export class SqliteProjectRepository
  implements ProjectRepository
{
  async findAll(): Promise<Project[]> {
    const database = await getDatabase();

    const rows = await database.select<ProjectRow[]>(
      `
        SELECT
          id,
          title,
          subtitle,
          project_type,
          status,
          language,
          text_direction,
          author_name,
          description,
          planned_season_count,
          planned_episode_count,
          default_episode_duration_minutes,
          default_minimum_scenes_per_episode,
          default_maximum_scenes_per_episode,
          last_opened_at,
          created_at,
          updated_at
        FROM projects
        ORDER BY
          COALESCE(last_opened_at, updated_at) DESC
      `,
    );

    return rows.map(mapProjectRow);
  }

  async findById(id: UUID): Promise<Project | null> {
    const database = await getDatabase();

    const rows = await database.select<ProjectRow[]>(
      `
        SELECT
          id,
          title,
          subtitle,
          project_type,
          status,
          language,
          text_direction,
          author_name,
          description,
          planned_season_count,
          planned_episode_count,
          default_episode_duration_minutes,
          default_minimum_scenes_per_episode,
          default_maximum_scenes_per_episode,
          last_opened_at,
          created_at,
          updated_at
        FROM projects
        WHERE id = ?
        LIMIT 1
      `,
      [id],
    );

    const row = rows[0];

    return row ? mapProjectRow(row) : null;
  }

  async create(project: Project): Promise<void> {
    const database = await getDatabase();

    await database.execute(
      `
        INSERT INTO projects (
          id,
          title,
          subtitle,
          project_type,
          status,
          language,
          text_direction,
          author_name,
          description,
          planned_season_count,
          planned_episode_count,
          default_episode_duration_minutes,
          default_minimum_scenes_per_episode,
          default_maximum_scenes_per_episode,
          last_opened_at,
          created_at,
          updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        project.id,
        project.title,
        project.subtitle,
        project.projectType,
        project.status,
        project.language,
        project.textDirection,
        project.authorName,
        project.description,
        project.plannedSeasonCount,
        project.plannedEpisodeCount,
        project.defaultEpisodeDurationMinutes,
        project.defaultMinimumScenesPerEpisode,
        project.defaultMaximumScenesPerEpisode,
        project.lastOpenedAt,
        project.createdAt,
        project.updatedAt,
      ],
    );
  }

  async update(project: Project): Promise<void> {
    const database = await getDatabase();

    await database.execute(
      `
        UPDATE projects
        SET
          title = ?,
          subtitle = ?,
          project_type = ?,
          status = ?,
          language = ?,
          text_direction = ?,
          author_name = ?,
          description = ?,
          planned_season_count = ?,
          planned_episode_count = ?,
          default_episode_duration_minutes = ?,
          default_minimum_scenes_per_episode = ?,
          default_maximum_scenes_per_episode = ?,
          last_opened_at = ?,
          updated_at = ?
        WHERE id = ?
      `,
      [
        project.title,
        project.subtitle,
        project.projectType,
        project.status,
        project.language,
        project.textDirection,
        project.authorName,
        project.description,
        project.plannedSeasonCount,
        project.plannedEpisodeCount,
        project.defaultEpisodeDurationMinutes,
        project.defaultMinimumScenesPerEpisode,
        project.defaultMaximumScenesPerEpisode,
        project.lastOpenedAt,
        project.updatedAt,
        project.id,
      ],
    );
  }

  async delete(id: UUID): Promise<void> {
    const database = await getDatabase();

    await database.execute(
      "DELETE FROM projects WHERE id = ?",
      [id],
    );
  }
}