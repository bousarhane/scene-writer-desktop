import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  projectStoryService,
} from "../../application";

import type {
  ProjectStory,
  ProjectStoryContent,
} from "../../types";

export type ProjectStorySaveStatus =
  | "saved"
  | "dirty"
  | "saving"
  | "error";

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

const AUTO_SAVE_DELAY_MS = 2000;

export function useProjectStory(
  projectId: string,
) {
  const [story, setStory] =
    useState<ProjectStory | null>(null);

  const [content, setContent] =
    useState<ProjectStoryContent>({
      ...emptyContent,
    });

  const [isLoading, setIsLoading] =
    useState(true);

  const [isSaving, setIsSaving] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  const [isDirty, setIsDirty] =
    useState(false);

  const contentRef =
    useRef<ProjectStoryContent>({
      ...emptyContent,
    });

  const storyRef =
    useRef<ProjectStory | null>(null);

  const isDirtyRef =
    useRef(false);

  const isSavingRef =
    useRef(false);

  const saveRequestedRef =
    useRef(false);

  const contentVersionRef =
    useRef(0);

  const loadStory =
    useCallback(async (): Promise<void> => {
      setIsLoading(true);
      setError(null);

      try {
        const loadedStory =
          await projectStoryService.getStory(
            projectId,
          );

        const loadedContent =
          storyToContent(loadedStory);

        storyRef.current =
          loadedStory;

        contentRef.current =
          loadedContent;

        isDirtyRef.current =
          false;

        contentVersionRef.current =
          0;

        setStory(loadedStory);
        setContent(loadedContent);
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
    contentRef.current =
      nextContent;

    isDirtyRef.current =
      true;

    contentVersionRef.current += 1;

    setContent(nextContent);
    setIsDirty(true);
    setError(null);
  }

  const saveStory =
    useCallback(
      async (): Promise<ProjectStory | null> => {
        if (!isDirtyRef.current) {
          return storyRef.current;
        }

        if (isSavingRef.current) {
          saveRequestedRef.current =
            true;

          return null;
        }

        isSavingRef.current =
          true;

        setIsSaving(true);
        setError(null);

        const contentToSave = {
          ...contentRef.current,
        };

        const savedVersion =
          contentVersionRef.current;

        try {
          const savedStory =
            await projectStoryService.saveStory(
              projectId,
              contentToSave,
            );

          storyRef.current =
            savedStory;

          setStory(savedStory);

          const contentChangedDuringSave =
            contentVersionRef.current !==
            savedVersion;

          if (
            !contentChangedDuringSave
          ) {
            const savedContent =
              storyToContent(
                savedStory,
              );

            contentRef.current =
              savedContent;

            isDirtyRef.current =
              false;

            setContent(savedContent);
            setIsDirty(false);
          }

          return savedStory;
        } catch (caughtError) {
          isDirtyRef.current =
            true;

          setIsDirty(true);

          setError(
            getErrorMessage(
              caughtError,
            ),
          );

          return null;
        } finally {
          isSavingRef.current =
            false;

          setIsSaving(false);

          if (
            saveRequestedRef.current
          ) {
            saveRequestedRef.current =
              false;

            if (
              isDirtyRef.current
            ) {
              window.setTimeout(() => {
                void saveStory();
              }, 0);
            }
          }
        }
      },
      [projectId],
    );

  useEffect(() => {
    if (
      isLoading ||
      !isDirty ||
      isSaving
    ) {
      return;
    }

    const timeoutId =
      window.setTimeout(() => {
        void saveStory();
      }, AUTO_SAVE_DELAY_MS);

    return () => {
      window.clearTimeout(
        timeoutId,
      );
    };
  }, [
    content,
    isDirty,
    isLoading,
    isSaving,
    saveStory,
  ]);

  useEffect(() => {
    function handleKeyDown(
      event: KeyboardEvent,
    ): void {
      const usesSaveShortcut =
        (event.ctrlKey ||
          event.metaKey) &&
        event.key.toLowerCase() === "s";

      if (!usesSaveShortcut) {
        return;
      }

      event.preventDefault();

      if (
        isDirtyRef.current
      ) {
        void saveStory();
      }
    }

    window.addEventListener(
      "keydown",
      handleKeyDown,
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handleKeyDown,
      );
    };
  }, [saveStory]);

  useEffect(() => {
    function handleBeforeUnload(
      event: BeforeUnloadEvent,
    ): void {
      if (
        !isDirtyRef.current
      ) {
        return;
      }

      event.preventDefault();
      event.returnValue = "";
    }

    window.addEventListener(
      "beforeunload",
      handleBeforeUnload,
    );

    return () => {
      window.removeEventListener(
        "beforeunload",
        handleBeforeUnload,
      );
    };
  }, []);

  function restoreSavedContent(): void {
    const savedStory =
      storyRef.current;

    const restoredContent =
      savedStory === null
        ? { ...emptyContent }
        : storyToContent(
            savedStory,
          );

    contentRef.current =
      restoredContent;

    isDirtyRef.current =
      false;

    contentVersionRef.current += 1;

    setContent(restoredContent);
    setIsDirty(false);
    setError(null);
  }

  const saveStatus:
    ProjectStorySaveStatus =
      isSaving
        ? "saving"
        : error !== null
          ? "error"
          : isDirty
            ? "dirty"
            : "saved";

  return {
    story,
    content,

    isLoading,
    isSaving,
    isDirty,
    error,
    saveStatus,

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