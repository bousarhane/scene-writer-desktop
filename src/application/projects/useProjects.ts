import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  ProjectValidationError,
  projectService,
} from "../../application";

import type { Project } from "../../types";

export const PROJECTS_CHANGED_EVENT =
  "scene-writer:projects-changed";

export const OPEN_PROJECT_FORM_EVENT =
  "scene-writer:open-project-form";

export interface CreateSeriesInput {
  title: string;
  plannedSeasonCount: number;
  plannedEpisodeCount: number;
  episodeDurationMinutes: number;

  minimumScenesPerEpisode: number | null;
  maximumScenesPerEpisode: number | null;
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
        const projectList =
          await projectService.listProjects();

        setProjects(projectList);
      } catch (caughtError) {
        setError(
          getErrorMessage(caughtError),
        );
      } finally {
        setIsLoading(false);
      }
    }, []);

  useEffect(() => {
    function handleProjectsChanged(): void {
      void loadProjects();
    }

    void loadProjects();

    window.addEventListener(
      PROJECTS_CHANGED_EVENT,
      handleProjectsChanged,
    );

    return () => {
      window.removeEventListener(
        PROJECTS_CHANGED_EVENT,
        handleProjectsChanged,
      );
    };
  }, [loadProjects]);

  async function createSeries(
    input: CreateSeriesInput,
  ): Promise<Project | null> {
    setError(null);

    try {
      const project =
        await projectService.createProject({
          title: input.title,
          projectType: "series",

          language: "ar",
          textDirection: "rtl",

          plannedSeasonCount:
            input.plannedSeasonCount,

          plannedEpisodeCount:
            input.plannedEpisodeCount,

          defaultEpisodeDurationMinutes:
            input.episodeDurationMinutes,

          defaultMinimumScenesPerEpisode:
            input.minimumScenesPerEpisode,

          defaultMaximumScenesPerEpisode:
            input.maximumScenesPerEpisode,
        });

      await loadProjects();

      window.dispatchEvent(
        new Event(PROJECTS_CHANGED_EVENT),
      );

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

      window.dispatchEvent(
        new Event(PROJECTS_CHANGED_EVENT),
      );
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
    createSeries,
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