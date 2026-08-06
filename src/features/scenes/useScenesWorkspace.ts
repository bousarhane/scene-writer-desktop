import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  episodeService,
  locationService,
  sceneElementService,
  sceneService,
  type CreateEpisodeInput,
  type CreateLocationInput,
  type CreateSceneElementInput,
  type CreateSceneInput,
  type UpdateSceneElementInput,
  type UpdateSceneInput,
} from "../../application";

import {
  type CreateCharacterInput,
} from "../../application/characters/CharacterService";

import {
  characterService,
} from "../../application/characters/characterServiceInstance";

import type {
  Character,
  Episode,
  Location,
  Project,
  Scene,
  SceneElement,
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

  const [characters, setCharacters] =
    useState<Character[]>([]);

  const [
    sceneElements,
    setSceneElements,
  ] = useState<SceneElement[]>([]);

  const [
    loadedSceneId,
    setLoadedSceneId,
  ] = useState<string | null>(null);

  const [isLoading, setIsLoading] =
    useState(true);

  const [
    isLoadingElements,
    setIsLoadingElements,
  ] = useState(false);

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
        const [
          loadedScenes,
          loadedEpisodes,
          loadedLocations,
          loadedCharacters,
        ] = await Promise.all([
          sceneService.listScenes(
            project.id,
          ),

          usesEpisodes
            ? episodeService.listEpisodes(
                project.id,
              )
            : Promise.resolve(
                [] as Episode[],
              ),

          locationService.listLocations(
            project.id,
          ),

          characterService.listCharacters(
            project.id,
          ),
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

        setCharacters(
          sortCharacters(
            loadedCharacters,
          ),
        );

        setSceneElements([]);
        setLoadedSceneId(null);
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

  const reloadEpisodes =
    useCallback(async (): Promise<Episode[]> => {
      if (!usesEpisodes) {
        setEpisodes([]);
        return [];
      }

      const loadedEpisodes =
        await episodeService.listEpisodes(
          project.id,
        );

      const sortedEpisodes =
        sortEpisodes(loadedEpisodes);

      setEpisodes(sortedEpisodes);

      return sortedEpisodes;
    }, [
      project.id,
      usesEpisodes,
    ]);

  async function loadSceneElements(
    sceneId: string,
  ): Promise<SceneElement[]> {
    setIsLoadingElements(true);
    setError(null);

    try {
      const loadedElements =
        await sceneElementService
          .listElements(sceneId);

      const sortedElements =
        sortSceneElements(
          loadedElements,
        );

      setSceneElements(
        sortedElements,
      );

      setLoadedSceneId(sceneId);

      return sortedElements;
    } catch (caughtError) {
      setError(
        getErrorMessage(
          caughtError,
        ),
      );

      return [];
    } finally {
      setIsLoadingElements(false);
    }
  }

  async function createScene(
    input: Omit<
      CreateSceneInput,
      "projectId"
    >,
  ): Promise<Scene | null> {
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

      if (loadedSceneId === id) {
        setSceneElements([]);
        setLoadedSceneId(null);
      }

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

  function hideSceneLocally(
    id: string,
  ): void {
    setScenes(
      (currentScenes) =>
        currentScenes.filter(
          (scene) =>
            scene.id !== id,
        ),
    );

    if (loadedSceneId === id) {
      setSceneElements([]);
      setLoadedSceneId(null);
    }
  }

  function restoreSceneLocally(
    scene: Scene,
  ): void {
    setScenes(
      (currentScenes) => {
        if (
          currentScenes.some(
            (currentScene) =>
              currentScene.id ===
              scene.id,
          )
        ) {
          return currentScenes;
        }

        return sortScenes([
          ...currentScenes,
          scene,
        ]);
      },
    );
  }

  async function commitSceneDeletion(
    id: string,
  ): Promise<boolean> {
    setIsSaving(true);
    setError(null);

    try {
      await sceneService.deleteScene(
        id,
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

  async function createSceneElement(
    input: CreateSceneElementInput,
  ): Promise<SceneElement | null> {
    setIsSaving(true);
    setError(null);

    try {
      const createdElement =
        await sceneElementService
          .createElement(input);

      setSceneElements(
        (currentElements) =>
          sortSceneElements([
            ...currentElements,
            createdElement,
          ]),
      );

      return createdElement;
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

  async function updateSceneElement(
    id: string,
    input: UpdateSceneElementInput,
  ): Promise<SceneElement | null> {
    setIsSaving(true);
    setError(null);

    try {
      const updatedElement =
        await sceneElementService
          .updateElement(
            id,
            input,
          );

      setSceneElements(
        (currentElements) =>
          sortSceneElements(
            currentElements.map(
              (element) =>
                element.id === id
                  ? updatedElement
                  : element,
            ),
          ),
      );

      return updatedElement;
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

  async function deleteSceneElement(
    id: string,
  ): Promise<boolean> {
    setIsSaving(true);
    setError(null);

    try {
      await sceneElementService
        .deleteElement(id);

      setSceneElements(
        (currentElements) =>
          currentElements
            .filter(
              (element) =>
                element.id !== id,
            )
            .map(
              (element, orderIndex) => ({
                ...element,
                orderIndex,
              }),
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

  async function reorderScenes(
    orderedSceneIds: string[],
  ): Promise<boolean> {
    if (orderedSceneIds.length < 2) {
      return true;
    }

    const previousScenes =
      [...scenes];

    const scenesById =
      new Map(
        previousScenes.map(
          (scene) => [
            scene.id,
            scene,
          ],
        ),
      );

    const orderedScenes =
      orderedSceneIds
        .map((id) =>
          scenesById.get(id),
        )
        .filter(
          (scene): scene is Scene =>
            Boolean(scene),
        );

    if (
      orderedScenes.length !==
      orderedSceneIds.length
    ) {
      setError(
        "تعذر تحديد جميع المشاهد المطلوب ترتيبها.",
      );

      return false;
    }

    const episodeId =
      orderedScenes[0].episodeId;

    if (
      orderedScenes.some(
        (scene) =>
          scene.episodeId !==
          episodeId,
      )
    ) {
      setError(
        "لا يمكن إعادة ترتيب مشاهد من حلقات مختلفة.",
      );

      return false;
    }

    const nextOrderById =
      new Map(
        orderedSceneIds.map(
          (id, orderIndex) => [
            id,
            orderIndex,
          ],
        ),
      );

    const optimisticScenes =
      previousScenes.map(
        (scene) => {
          const nextOrderIndex =
            nextOrderById.get(
              scene.id,
            );

          return nextOrderIndex ===
            undefined
            ? scene
            : {
                ...scene,
                orderIndex:
                  nextOrderIndex,
              };
        },
      );

    setScenes(
      sortScenes(
        optimisticScenes,
      ),
    );

    setIsSaving(true);
    setError(null);

    try {
      const highestOrderIndex =
        previousScenes.reduce(
          (highest, scene) =>
            Math.max(
              highest,
              scene.orderIndex,
            ),
          0,
        );

      const temporaryBase =
        highestOrderIndex +
        orderedScenes.length +
        100;

      const temporaryScenes: Scene[] =
        [];

      for (
        let index = 0;
        index < orderedScenes.length;
        index += 1
      ) {
        const scene =
          orderedScenes[index];

        const temporaryScene =
          await sceneService.updateScene(
            scene.id,
            sceneToUpdateInput(
              scene,
              temporaryBase + index,
            ),
          );

        temporaryScenes.push(
          temporaryScene,
        );
      }

      const temporaryById =
        new Map(
          temporaryScenes.map(
            (scene) => [
              scene.id,
              scene,
            ],
          ),
        );

      const persistedScenes: Scene[] =
        [];

      for (
        let index = 0;
        index < orderedSceneIds.length;
        index += 1
      ) {
        const sceneId =
          orderedSceneIds[index];

        const temporaryScene =
          temporaryById.get(
            sceneId,
          );

        if (!temporaryScene) {
          throw new Error(
            "تعذر إكمال المرحلة المؤقتة لإعادة ترتيب المشاهد.",
          );
        }

        const persistedScene =
          await sceneService.updateScene(
            sceneId,
            sceneToUpdateInput(
              temporaryScene,
              index,
            ),
          );

        persistedScenes.push(
          persistedScene,
        );
      }

      const persistedById =
        new Map(
          persistedScenes.map(
            (scene) => [
              scene.id,
              scene,
            ],
          ),
        );

      setScenes(
        (currentScenes) =>
          sortScenes(
            currentScenes.map(
              (scene) =>
                persistedById.get(
                  scene.id,
                ) ?? scene,
            ),
          ),
      );

      return true;
    } catch (caughtError) {
      setScenes(
        sortScenes(
          previousScenes,
        ),
      );

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

  async function createQuickEpisode(
    input: Omit<
      CreateEpisodeInput,
      "projectId"
    >,
  ): Promise<Episode | null> {
    if (!usesEpisodes) {
      setError(
        "هذا المشروع لا يستخدم الحلقات.",
      );
      return null;
    }

    setIsSaving(true);
    setError(null);

    try {
      const createdEpisode =
        await episodeService.createEpisode({
          ...input,
          projectId: project.id,
        });

      setEpisodes(
        (currentEpisodes) =>
          sortEpisodes([
            ...currentEpisodes,
            createdEpisode,
          ]),
      );

      return createdEpisode;
    } catch (caughtError) {
      setError(
        getErrorMessage(caughtError),
      );

      return null;
    } finally {
      setIsSaving(false);
    }
  }

  async function createQuickCharacter(
    input: Omit<
      CreateCharacterInput,
      "projectId"
    >,
  ): Promise<Character | null> {
    setIsSaving(true);
    setError(null);

    try {
      const createdCharacter =
        await characterService
          .createCharacter({
            ...input,
            projectId:
              project.id,
          });

      setCharacters(
        (currentCharacters) =>
          sortCharacters([
            ...currentCharacters,
            createdCharacter,
          ]),
      );

      return createdCharacter;
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

  async function createQuickLocation(
    input: Omit<
      CreateLocationInput,
      "projectId"
    >,
  ): Promise<Location | null> {
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

  function setLocalSceneElements(
    elements: SceneElement[],
  ): void {
    setSceneElements(
      sortSceneElements(elements),
    );
  }

  function clearError(): void {
    setError(null);
  }

  return {
    scenes,
    episodes,
    locations,
    characters,
    sceneElements,
    loadedSceneId,

    usesEpisodes,

    isLoading,
    isLoadingElements,
    isSaving,
    error,

    loadSceneElements,
    setLocalSceneElements,

    createScene,
    updateScene,
    deleteScene,
    hideSceneLocally,
    restoreSceneLocally,
    commitSceneDeletion,
    reorderScenes,

    createSceneElement,
    updateSceneElement,
    deleteSceneElement,

    createQuickEpisode,
    createQuickCharacter,
    createQuickLocation,

    clearError,
    loadWorkspace,
    reloadEpisodes,
  };
}

function sceneToUpdateInput(
  scene: Scene,
  orderIndex: number,
): UpdateSceneInput {
  return {
    episodeId: scene.episodeId,
    locationId: scene.locationId,
    sceneNumber: scene.sceneNumber,
    title: scene.title,
    heading: scene.heading,
    interiorExterior:
      scene.interiorExterior,
    timeOfDay: scene.timeOfDay,
    customTimeOfDay:
      scene.customTimeOfDay,
    synopsis: scene.synopsis,
    dramaticPurpose:
      scene.dramaticPurpose,
    notes: scene.notes,
    estimatedDurationSeconds:
      scene.estimatedDurationSeconds,
    status: scene.status,
    orderIndex,
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

function sortCharacters(
  characters: Character[],
): Character[] {
  return [...characters].sort(
    (firstCharacter, secondCharacter) =>
      firstCharacter.orderIndex -
        secondCharacter.orderIndex ||
      firstCharacter.name.localeCompare(
        secondCharacter.name,
        "ar",
      ),
  );
}

function sortSceneElements(
  elements: SceneElement[],
): SceneElement[] {
  return [...elements].sort(
    (firstElement, secondElement) =>
      firstElement.orderIndex -
      secondElement.orderIndex,
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
    return "تعذر الحفظ بسبب ارتباط غير صالح.";
  }

  return message;
}