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

  return {
    characters,

    isLoading,
    isSaving,
    error,

    loadCharacters,
    createCharacter,
    updateCharacter,
    deleteCharacter,
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