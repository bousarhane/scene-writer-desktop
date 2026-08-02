import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  characterRelationService,
  type CreateCharacterRelationInput,
  type UpdateCharacterRelationInput,
} from "../../application";

import type {
  CharacterRelation,
} from "../../types";

export function useCharacterRelations(
  projectId: string,
  characterId: string | null,
) {
  const [
    relations,
    setRelations,
  ] = useState<CharacterRelation[]>([]);

  const [
    isLoadingRelations,
    setIsLoadingRelations,
  ] = useState(false);

  const [
    isSavingRelation,
    setIsSavingRelation,
  ] = useState(false);

  const [
    relationError,
    setRelationError,
  ] = useState<string | null>(null);

  const loadRelations =
    useCallback(async (): Promise<void> => {
      if (characterId === null) {
        setRelations([]);
        setRelationError(null);

        return;
      }

      setIsLoadingRelations(true);
      setRelationError(null);

      try {
        const loadedRelations =
          await characterRelationService
            .listCharacterRelations(
              projectId,
              characterId,
            );

        setRelations(
          loadedRelations,
        );
      } catch (caughtError) {
        setRelationError(
          getErrorMessage(caughtError),
        );
      } finally {
        setIsLoadingRelations(false);
      }
    }, [
      projectId,
      characterId,
    ]);

  useEffect(() => {
    void loadRelations();
  }, [loadRelations]);

  async function createRelation(
    input: Omit<
      CreateCharacterRelationInput,
      "projectId" |
      "sourceCharacterId"
    >,
  ): Promise<CharacterRelation | null> {
    if (
      characterId === null ||
      isSavingRelation
    ) {
      return null;
    }

    setIsSavingRelation(true);
    setRelationError(null);

    try {
      const createdRelation =
        await characterRelationService
          .createCharacterRelation({
            ...input,

            projectId,

            sourceCharacterId:
              characterId,
          });

      setRelations(
        (currentRelations) => [
          ...currentRelations,
          createdRelation,
        ],
      );

      return createdRelation;
    } catch (caughtError) {
      setRelationError(
        getErrorMessage(caughtError),
      );

      return null;
    } finally {
      setIsSavingRelation(false);
    }
  }

  async function updateRelation(
    id: string,
    input: UpdateCharacterRelationInput,
  ): Promise<CharacterRelation | null> {
    if (isSavingRelation) {
      return null;
    }

    setIsSavingRelation(true);
    setRelationError(null);

    try {
      const updatedRelation =
        await characterRelationService
          .updateCharacterRelation(
            id,
            input,
          );

      setRelations(
        (currentRelations) =>
          currentRelations.map(
            (relation) =>
              relation.id === id
                ? updatedRelation
                : relation,
          ),
      );

      return updatedRelation;
    } catch (caughtError) {
      setRelationError(
        getErrorMessage(caughtError),
      );

      return null;
    } finally {
      setIsSavingRelation(false);
    }
  }

  async function deleteRelation(
    id: string,
  ): Promise<boolean> {
    if (isSavingRelation) {
      return false;
    }

    setIsSavingRelation(true);
    setRelationError(null);

    try {
      await characterRelationService
        .deleteCharacterRelation(id);

      setRelations(
        (currentRelations) =>
          currentRelations.filter(
            (relation) =>
              relation.id !== id,
          ),
      );

      return true;
    } catch (caughtError) {
      setRelationError(
        getErrorMessage(caughtError),
      );

      return false;
    } finally {
      setIsSavingRelation(false);
    }
  }

  function clearRelationError(): void {
    setRelationError(null);
  }

  return {
    relations,

    isLoadingRelations,
    isSavingRelation,
    relationError,

    createRelation,
    updateRelation,
    deleteRelation,

    clearRelationError,
    loadRelations,
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