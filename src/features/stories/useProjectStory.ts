import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  projectStoryService,
} from "../../application";

import type {
  ProjectStory,
  ProjectStoryContent,
} from "../../types";

const emptyContent: ProjectStoryContent = {
  premise: "",
  logline: "",
  synopsis: "",
  themes: "",
  centralConflict: "",
  startingPoint: "",
  expectedDirection: "",
  writerNotes: "",
};

export function useProjectStory(
  projectId: string,
) {
  const [story, setStory] =
    useState<ProjectStory | null>(null);

  const [content, setContent] =
    useState<ProjectStoryContent>(
      emptyContent,
    );

  const [isLoading, setIsLoading] =
    useState(true);

  const [isSaving, setIsSaving] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  const [isDirty, setIsDirty] =
    useState(false);

  const loadStory =
    useCallback(async (): Promise<void> => {
      setIsLoading(true);
      setError(null);

      try {
        const loadedStory =
          await projectStoryService.getStory(
            projectId,
          );

        setStory(loadedStory);

        setContent(
          storyToContent(loadedStory),
        );

        setIsDirty(false);
      } catch (caughtError) {
        setError(
          getErrorMessage(caughtError),
        );
      } finally {
        setIsLoading(false);
      }
    }, [projectId]);

  useEffect(() => {
    void loadStory();
  }, [loadStory]);

  function updateContent(
    nextContent: ProjectStoryContent,
  ): void {
    setContent(nextContent);
    setIsDirty(true);
  }

  async function saveStory():
    Promise<ProjectStory | null> {
    setIsSaving(true);
    setError(null);

    try {
      const savedStory =
        await projectStoryService.saveStory(
          projectId,
          content,
        );

      setStory(savedStory);
      setContent(
        storyToContent(savedStory),
      );

      setIsDirty(false);

      return savedStory;
    } catch (caughtError) {
      setError(
        getErrorMessage(caughtError),
      );

      return null;
    } finally {
      setIsSaving(false);
    }
  }

  function restoreSavedContent(): void {
    if (story === null) {
      setContent(emptyContent);
    } else {
      setContent(
        storyToContent(story),
      );
    }

    setIsDirty(false);
  }

  return {
    story,
    content,

    isLoading,
    isSaving,
    isDirty,
    error,

    updateContent,
    saveStory,
    restoreSavedContent,
    loadStory,
  };
}

function storyToContent(
  story: ProjectStory,
): ProjectStoryContent {
  return {
    premise: story.premise,
    logline: story.logline,
    synopsis: story.synopsis,

    themes: story.themes,

    centralConflict:
      story.centralConflict,

    startingPoint:
      story.startingPoint,

    expectedDirection:
      story.expectedDirection,

    writerNotes:
      story.writerNotes,
  };
}

function getErrorMessage(
  error: unknown,
): string {
  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
}