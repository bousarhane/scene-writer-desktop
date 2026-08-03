import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  episodeService,
  locationService,
  sceneService,
  type CreateLocationInput,
  type CreateSceneInput,
  type UpdateSceneInput,
} from "../../application";

import type {
  Episode,
  Location,
  Project,
  Scene,
} from "../../types";

export function useScenesWorkspace(
  project: Project,
) {
  const [scenes, setScenes] =
    useState<Scene[]>([]);

  const [episodes, setEpisodes] =
    useState<Episode[]>([]);

  const [locations, setLocations] =
    useState<Location[]>([]);

  const [isLoading, setIsLoading] =
    useState(true);

  const [isSaving, setIsSaving] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  const usesEpisodes =
    project.projectType === "series" ||
    project.projectType ===
      "single_episode";

  const loadWorkspace =
    useCallback(async (): Promise<void> => {
      setIsLoading(true);
      setError(null);

      try {
        const loadedScenesPromise =
          sceneService.listScenes(
            project.id,
          );

        const loadedEpisodesPromise =
          usesEpisodes
            ? episodeService.listEpisodes(
                project.id,
              )
            : Promise.resolve(
                [] as Episode[],
              );

        const loadedLocationsPromise =
          locationService.listLocations(
            project.id,
          );

        const [
          loadedScenes,
          loadedEpisodes,
          loadedLocations,
        ] = await Promise.all([
          loadedScenesPromise,
          loadedEpisodesPromise,
          loadedLocationsPromise,
        ]);

        setScenes(
          sortScenes(loadedScenes),
        );

        setEpisodes(
          sortEpisodes(
            loadedEpisodes,
          ),
        );

        setLocations(
          sortLocations(
            loadedLocations,
          ),
        );
      } catch (caughtError) {
        setError(
          getErrorMessage(
            caughtError,
          ),
        );
      } finally {
        setIsLoading(false);
      }
    }, [
      project.id,
      usesEpisodes,
    ]);

  useEffect(() => {
    void loadWorkspace();
  }, [loadWorkspace]);

  async function createScene(
    input: Omit<
      CreateSceneInput,
      "projectId"
    >,
  ): Promise<Scene | null> {
    if (isSaving) {
      return null;
    }

    setIsSaving(true);
    setError(null);

    try {
      const createdScene =
        await sceneService
          .createScene({
            ...input,
            projectId:
              project.id,
          });

      setScenes(
        (currentScenes) =>
          sortScenes([
            ...currentScenes,
            createdScene,
          ]),
      );

      return createdScene;
    } catch (caughtError) {
      setError(
        getErrorMessage(
          caughtError,
        ),
      );

      return null;
    } finally {
      setIsSaving(false);
    }
  }

  async function updateScene(
    id: string,
    input: UpdateSceneInput,
  ): Promise<Scene | null> {
    if (isSaving) {
      return null;
    }

    setIsSaving(true);
    setError(null);

    try {
      const updatedScene =
        await sceneService
          .updateScene(
            id,
            input,
          );

      setScenes(
        (currentScenes) =>
          sortScenes(
            currentScenes.map(
              (scene) =>
                scene.id === id
                  ? updatedScene
                  : scene,
            ),
          ),
      );

      return updatedScene;
    } catch (caughtError) {
      setError(
        getErrorMessage(
          caughtError,
        ),
      );

      return null;
    } finally {
      setIsSaving(false);
    }
  }

  async function deleteScene(
    id: string,
  ): Promise<boolean> {
    if (isSaving) {
      return false;
    }

    setIsSaving(true);
    setError(null);

    try {
      await sceneService.deleteScene(
        id,
      );

      setScenes(
        (currentScenes) =>
          currentScenes.filter(
            (scene) =>
              scene.id !== id,
          ),
      );

      return true;
    } catch (caughtError) {
      setError(
        getErrorMessage(
          caughtError,
        ),
      );

      return false;
    } finally {
      setIsSaving(false);
    }
  }

  async function createQuickLocation(
    input: Omit<
      CreateLocationInput,
      "projectId"
    >,
  ): Promise<Location | null> {
    if (isSaving) {
      return null;
    }

    setIsSaving(true);
    setError(null);

    try {
      const createdLocation =
        await locationService
          .createLocation({
            ...input,
            projectId:
              project.id,
          });

      setLocations(
        (currentLocations) =>
          sortLocations([
            ...currentLocations,
            createdLocation,
          ]),
      );

      return createdLocation;
    } catch (caughtError) {
      setError(
        getErrorMessage(
          caughtError,
        ),
      );

      return null;
    } finally {
      setIsSaving(false);
    }
  }

  function clearError(): void {
    setError(null);
  }

  return {
    scenes,
    episodes,
    locations,

    usesEpisodes,

    isLoading,
    isSaving,
    error,

    createScene,
    updateScene,
    deleteScene,

    createQuickLocation,

    clearError,
    loadWorkspace,
  };
}

function sortScenes(
  scenes: Scene[],
): Scene[] {
  return [...scenes].sort(
    (firstScene, secondScene) => {
      if (
        firstScene.episodeId ===
        secondScene.episodeId
      ) {
        return (
          firstScene.orderIndex -
          secondScene.orderIndex
        );
      }

      if (
        firstScene.episodeId === null
      ) {
        return -1;
      }

      if (
        secondScene.episodeId === null
      ) {
        return 1;
      }

      return firstScene.episodeId
        .localeCompare(
          secondScene.episodeId,
        );
    },
  );
}

function sortEpisodes(
  episodes: Episode[],
): Episode[] {
  return [...episodes].sort(
    (firstEpisode, secondEpisode) =>
      firstEpisode.orderIndex -
        secondEpisode.orderIndex ||
      firstEpisode.number -
        secondEpisode.number,
  );
}

function sortLocations(
  locations: Location[],
): Location[] {
  return [...locations].sort(
    (firstLocation, secondLocation) =>
      firstLocation.name.localeCompare(
        secondLocation.name,
        "ar",
      ),
  );
}

function getErrorMessage(
  error: unknown,
): string {
  const message =
    error instanceof Error
      ? error.message
      : String(error);

  if (
    message.includes(
      "UNIQUE constraint failed",
    )
  ) {
    return "يوجد عنصر آخر يحمل الرقم أو الاسم نفسه.";
  }

  if (
    message.includes(
      "FOREIGN KEY constraint failed",
    )
  ) {
    return "تعذر حفظ المشهد بسبب ارتباط غير صالح.";
  }

  return message;
}
