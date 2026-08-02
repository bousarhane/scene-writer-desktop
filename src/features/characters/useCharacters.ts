import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  characterService,
  type CreateCharacterInput,
  type UpdateCharacterInput,
} from "../../application";

import type {
  Character,
} from "../../types";

export function useCharacters(
  projectId: string,
) {
  const [characters, setCharacters] =
    useState<Character[]>([]);

  const [isLoading, setIsLoading] =
    useState(true);

  const [isSaving, setIsSaving] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  const loadCharacters =
    useCallback(async (): Promise<void> => {
      setIsLoading(true);
      setError(null);

      try {
        const loadedCharacters =
          await characterService
            .listCharacters(projectId);

        setCharacters(
          loadedCharacters,
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
    void loadCharacters();
  }, [loadCharacters]);

  async function createCharacter(
    input: Omit<
      CreateCharacterInput,
      "projectId"
    >,
  ): Promise<Character | null> {
    if (isSaving) {
      return null;
    }

    setIsSaving(true);
    setError(null);

    try {
      const createdCharacter =
        await characterService
          .createCharacter({
            ...input,
            projectId,
          });

      setCharacters(
        (currentCharacters) => [
          ...currentCharacters,
          createdCharacter,
        ],
      );

      return createdCharacter;
    } catch (caughtError) {
      setError(
        getErrorMessage(caughtError),
      );

      return null;
    } finally {
      setIsSaving(false);
    }
  }

  async function updateCharacter(
    id: string,
    input: UpdateCharacterInput,
  ): Promise<Character | null> {
    if (isSaving) {
      return null;
    }

    setIsSaving(true);
    setError(null);

    try {
      const updatedCharacter =
        await characterService
          .updateCharacter(
            id,
            input,
          );

      setCharacters(
        (currentCharacters) =>
          currentCharacters.map(
            (character) =>
              character.id === id
                ? updatedCharacter
                : character,
          ),
      );

      return updatedCharacter;
    } catch (caughtError) {
      setError(
        getErrorMessage(caughtError),
      );

      return null;
    } finally {
      setIsSaving(false);
    }
  }

  async function deleteCharacter(
    id: string,
  ): Promise<boolean> {
    if (isSaving) {
      return false;
    }

    setIsSaving(true);
    setError(null);

    try {
      await characterService
        .deleteCharacter(id);

      setCharacters(
        (currentCharacters) =>
          currentCharacters.filter(
            (character) =>
              character.id !== id,
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
    characters,

    isLoading,
    isSaving,
    error,

    loadCharacters,
    createCharacter,
    updateCharacter,
    deleteCharacter,
    clearError,
  };
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
      "characters",
    )
  ) {
    return "توجد في المشروع شخصية تحمل هذا الاسم.";
  }

  return message;
}