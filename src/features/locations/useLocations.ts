import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  locationService,
  type CreateLocationInput,
  type UpdateLocationInput,
} from "../../application";

import type {
  Location,
} from "../../types";

export function useLocations(
  projectId: string,
) {
  const [locations, setLocations] =
    useState<Location[]>([]);

  const [isLoading, setIsLoading] =
    useState(true);

  const [isSaving, setIsSaving] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  const loadLocations =
    useCallback(async (): Promise<void> => {
      setIsLoading(true);
      setError(null);

      try {
        const loadedLocations =
          await locationService
            .listLocations(projectId);

        setLocations(
          loadedLocations,
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
    void loadLocations();
  }, [loadLocations]);

  async function createLocation(
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
            projectId,
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
        getErrorMessage(caughtError),
      );

      return null;
    } finally {
      setIsSaving(false);
    }
  }

  async function updateLocation(
    id: string,
    input: UpdateLocationInput,
  ): Promise<Location | null> {
    if (isSaving) {
      return null;
    }

    setIsSaving(true);
    setError(null);

    try {
      const updatedLocation =
        await locationService
          .updateLocation(
            id,
            input,
          );

      setLocations(
        (currentLocations) =>
          sortLocations(
            currentLocations.map(
              (location) =>
                location.id === id
                  ? updatedLocation
                  : location,
            ),
          ),
      );

      return updatedLocation;
    } catch (caughtError) {
      setError(
        getErrorMessage(caughtError),
      );

      return null;
    } finally {
      setIsSaving(false);
    }
  }

  async function deleteLocation(
    id: string,
  ): Promise<boolean> {
    if (isSaving) {
      return false;
    }

    setIsSaving(true);
    setError(null);

    try {
      await locationService
        .deleteLocation(id);

      setLocations(
        (currentLocations) =>
          currentLocations.filter(
            (location) =>
              location.id !== id,
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
    locations,

    isLoading,
    isSaving,
    error,

    createLocation,
    updateLocation,
    deleteLocation,

    clearError,
    loadLocations,
  };
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
    ) &&
    message.includes(
      "locations",
    )
  ) {
    return "يوجد في المشروع مكان يحمل هذا الاسم.";
  }

  return message;
}