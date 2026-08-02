import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  ProjectValidationError,
  projectService,
} from "../../application";

import type {
  Project,
  ProjectType,
} from "../../types";

export interface CreateProjectInput {
  title: string;
  projectType: ProjectType;

  plannedSeasonCount: number | null;
  plannedEpisodeCount: number | null;

  durationMinutes: number;
  minimumScenes: number | null;
  maximumScenes: number | null;
}

export function useProjects() {
  const [projects, setProjects] =
    useState<Project[]>([]);

  const [isLoading, setIsLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  const loadProjects =
    useCallback(async (): Promise<void> => {
      setIsLoading(true);
      setError(null);

      try {
        const items =
          await projectService.listProjects();

        setProjects(items);
      } catch (caughtError) {
        setError(
          getErrorMessage(caughtError),
        );
      } finally {
        setIsLoading(false);
      }
    }, []);

  useEffect(() => {
    void loadProjects();
  }, [loadProjects]);

  async function createProject(
    input: CreateProjectInput,
  ): Promise<Project | null> {
    setError(null);

    try {
      const project =
        await projectService.createProject({
          title: input.title,
          projectType: input.projectType,

          language: "ar",
          textDirection: "rtl",

          plannedSeasonCount:
            input.plannedSeasonCount,

          plannedEpisodeCount:
            input.plannedEpisodeCount,

          defaultEpisodeDurationMinutes:
            input.durationMinutes,

          defaultMinimumScenesPerEpisode:
            input.minimumScenes,

          defaultMaximumScenesPerEpisode:
            input.maximumScenes,
        });

      await loadProjects();

      return project;
    } catch (caughtError) {
      setError(
        getErrorMessage(caughtError),
      );

      return null;
    }
  }

  async function deleteProject(
    projectId: string,
  ): Promise<void> {
    setError(null);

    try {
      await projectService.deleteProject(
        projectId,
      );

      await loadProjects();
    } catch (caughtError) {
      setError(
        getErrorMessage(caughtError),
      );
    }
  }

  return {
    projects,
    isLoading,
    error,

    loadProjects,
    createProject,
    deleteProject,
  };
}

function getErrorMessage(
  error: unknown,
): string {
  if (
    error instanceof
    ProjectValidationError
  ) {
    return error.errors.join("\n");
  }

  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
}