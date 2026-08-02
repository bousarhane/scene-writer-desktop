import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  episodeService,
  seasonService,
  type CreateEpisodeInput,
  type CreateSeasonInput,
  type UpdateEpisodeInput,
  type UpdateSeasonInput,
} from "../../application";

import type {
  Episode,
  Season,
} from "../../types";

export function useProjectStructure(
  projectId: string,
) {
  const [seasons, setSeasons] =
    useState<Season[]>([]);

  const [episodes, setEpisodes] =
    useState<Episode[]>([]);

  const [isLoading, setIsLoading] =
    useState(true);

  const [isSaving, setIsSaving] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  const loadStructure =
    useCallback(async (): Promise<void> => {
      setIsLoading(true);
      setError(null);

      try {
        const [
          loadedSeasons,
          loadedEpisodes,
        ] = await Promise.all([
          seasonService.listSeasons(
            projectId,
          ),

          episodeService.listEpisodes(
            projectId,
          ),
        ]);

        setSeasons(
          sortSeasons(loadedSeasons),
        );

        setEpisodes(
          sortEpisodes(loadedEpisodes),
        );
      } catch (caughtError) {
        setError(
          getErrorMessage(caughtError),
        );
      } finally {
        setIsLoading(false);
      }
    }, [projectId]);

  useEffect(() => {
    void loadStructure();
  }, [loadStructure]);

  async function createSeason(
    input: Omit<
      CreateSeasonInput,
      "projectId"
    >,
  ): Promise<Season | null> {
    if (isSaving) {
      return null;
    }

    setIsSaving(true);
    setError(null);

    try {
      const createdSeason =
        await seasonService.createSeason({
          ...input,
          projectId,
        });

      setSeasons(
        (currentSeasons) =>
          sortSeasons([
            ...currentSeasons,
            createdSeason,
          ]),
      );

      return createdSeason;
    } catch (caughtError) {
      setError(
        getErrorMessage(caughtError),
      );

      return null;
    } finally {
      setIsSaving(false);
    }
  }

  async function updateSeason(
    id: string,
    input: UpdateSeasonInput,
  ): Promise<Season | null> {
    if (isSaving) {
      return null;
    }

    setIsSaving(true);
    setError(null);

    try {
      const updatedSeason =
        await seasonService.updateSeason(
          id,
          input,
        );

      setSeasons(
        (currentSeasons) =>
          sortSeasons(
            currentSeasons.map(
              (season) =>
                season.id === id
                  ? updatedSeason
                  : season,
            ),
          ),
      );

      return updatedSeason;
    } catch (caughtError) {
      setError(
        getErrorMessage(caughtError),
      );

      return null;
    } finally {
      setIsSaving(false);
    }
  }

  async function deleteSeason(
    id: string,
  ): Promise<boolean> {
    if (isSaving) {
      return false;
    }

    setIsSaving(true);
    setError(null);

    try {
      await seasonService.deleteSeason(
        id,
      );

      setSeasons(
        (currentSeasons) =>
          currentSeasons.filter(
            (season) =>
              season.id !== id,
          ),
      );

      setEpisodes(
        (currentEpisodes) =>
          currentEpisodes.filter(
            (episode) =>
              episode.seasonId !== id,
          ),
      );

      return true;
    } catch (caughtError) {
      setError(
        getErrorMessage(caughtError),
      );

      return false;
    } finally {
      setIsSaving(false);
    }
  }

  async function createEpisode(
    input: Omit<
      CreateEpisodeInput,
      "projectId"
    >,
  ): Promise<Episode | null> {
    if (isSaving) {
      return null;
    }

    setIsSaving(true);
    setError(null);

    try {
      const createdEpisode =
        await episodeService
          .createEpisode({
            ...input,
            projectId,
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

  async function updateEpisode(
    id: string,
    input: UpdateEpisodeInput,
  ): Promise<Episode | null> {
    if (isSaving) {
      return null;
    }

    setIsSaving(true);
    setError(null);

    try {
      const updatedEpisode =
        await episodeService
          .updateEpisode(
            id,
            input,
          );

      setEpisodes(
        (currentEpisodes) =>
          sortEpisodes(
            currentEpisodes.map(
              (episode) =>
                episode.id === id
                  ? updatedEpisode
                  : episode,
            ),
          ),
      );

      return updatedEpisode;
    } catch (caughtError) {
      setError(
        getErrorMessage(caughtError),
      );

      return null;
    } finally {
      setIsSaving(false);
    }
  }

  async function deleteEpisode(
    id: string,
  ): Promise<boolean> {
    if (isSaving) {
      return false;
    }

    setIsSaving(true);
    setError(null);

    try {
      await episodeService.deleteEpisode(
        id,
      );

      setEpisodes(
        (currentEpisodes) =>
          currentEpisodes.filter(
            (episode) =>
              episode.id !== id,
          ),
      );

      return true;
    } catch (caughtError) {
      setError(
        getErrorMessage(caughtError),
      );

      return false;
    } finally {
      setIsSaving(false);
    }
  }

  function clearError(): void {
    setError(null);
  }

  return {
    seasons,
    episodes,

    isLoading,
    isSaving,
    error,

    createSeason,
    updateSeason,
    deleteSeason,

    createEpisode,
    updateEpisode,
    deleteEpisode,

    clearError,
    loadStructure,
  };
}

function sortSeasons(
  seasons: Season[],
): Season[] {
  return [...seasons].sort(
    (firstSeason, secondSeason) =>
      firstSeason.orderIndex -
        secondSeason.orderIndex ||
      firstSeason.number -
        secondSeason.number,
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
    return "يوجد رقم مكرر داخل بنية العمل.";
  }

  if (
    message.includes(
      "FOREIGN KEY constraint failed",
    )
  ) {
    return "تعذر تنفيذ العملية بسبب ارتباط العنصر بعناصر أخرى.";
  }

  return message;
}