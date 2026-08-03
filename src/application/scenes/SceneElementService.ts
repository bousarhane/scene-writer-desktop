import type {
  SceneElement,
  SceneElementType,
  UUID,
} from "../../types";

import type {
  CharacterRepository,
  SceneElementRepository,
  SceneRepository,
} from "../../database";

export interface CreateSceneElementInput {
  sceneId: UUID;

  type: SceneElementType;

  content?: string;

  characterId?: UUID | null;

  isDualDialogue?: boolean;
  isLocked?: boolean;

  insertAfterElementId?:
    UUID | null;
}

export interface UpdateSceneElementInput {
  type: SceneElementType;

  content: string;

  characterId: UUID | null;

  isDualDialogue: boolean;
  isLocked: boolean;
}

export class SceneElementService {
  constructor(
    private readonly repository:
      SceneElementRepository,

    private readonly sceneRepository:
      SceneRepository,

    private readonly characterRepository:
      CharacterRepository,
  ) {}

  async listElements(
    sceneId: UUID,
  ): Promise<SceneElement[]> {
    return this.repository
      .findBySceneId(sceneId);
  }

  async getElement(
    id: UUID,
  ): Promise<SceneElement | null> {
    return this.repository
      .findById(id);
  }

  async createElement(
    input: CreateSceneElementInput,
  ): Promise<SceneElement> {
    const scene =
      await this.sceneRepository
        .findById(input.sceneId);

    if (scene === null) {
      throw new Error(
        "المشهد المطلوب غير موجود.",
      );
    }

    const characterId =
      input.characterId ?? null;

    await this.validateCharacter(
      scene.projectId,
      characterId,
    );

    const currentElements =
      await this.repository
        .findBySceneId(scene.id);

    const insertionIndex =
      getInsertionIndex(
        currentElements,
        input.insertAfterElementId ??
          null,
      );

    const now =
      new Date().toISOString();

    const element: SceneElement = {
      id: crypto.randomUUID(),

      projectId:
        scene.projectId,

      sceneId:
        scene.id,

      characterId,

      type:
        input.type,

      content:
        input.content ?? "",

      orderIndex:
        insertionIndex,

      isDualDialogue:
        input.isDualDialogue ??
        false,

      isLocked:
        input.isLocked ??
        false,

      createdAt: now,
      updatedAt: now,
    };

    if (
      insertionIndex >=
      currentElements.length
    ) {
      await this.repository.create(
        element,
      );

      return element;
    }

    element.orderIndex =
      currentElements.length;

    await this.repository.create(
      element,
    );

    const orderedIds = [
      ...currentElements.map(
        (currentElement) =>
          currentElement.id,
      ),
    ];

    orderedIds.splice(
      insertionIndex,
      0,
      element.id,
    );

    await this.repository
      .replaceOrder(
        scene.id,
        orderedIds,
      );

    return {
      ...element,
      orderIndex:
        insertionIndex,
    };
  }

  async updateElement(
    id: UUID,
    input: UpdateSceneElementInput,
  ): Promise<SceneElement> {
    const existingElement =
      await this.repository
        .findById(id);

    if (existingElement === null) {
      throw new Error(
        "عنصر المشهد المطلوب غير موجود.",
      );
    }

    await this.validateCharacter(
      existingElement.projectId,
      input.characterId,
    );

    const updatedElement:
      SceneElement = {
        ...existingElement,

        type:
          input.type,

        content:
          input.content,

        characterId:
          input.characterId,

        isDualDialogue:
          input.isDualDialogue,

        isLocked:
          input.isLocked,

        updatedAt:
          new Date().toISOString(),
      };

    await this.repository.update(
      updatedElement,
    );

    return updatedElement;
  }

  async deleteElement(
    id: UUID,
  ): Promise<void> {
    const element =
      await this.repository
        .findById(id);

    if (element === null) {
      return;
    }

    await this.repository.delete(
      element.id,
    );

    const remainingElements =
      await this.repository
        .findBySceneId(
          element.sceneId,
        );

    await this.repository
      .replaceOrder(
        element.sceneId,
        remainingElements.map(
          (remainingElement) =>
            remainingElement.id,
        ),
      );
  }

  async moveElement(
    id: UUID,
    direction: "up" | "down",
  ): Promise<SceneElement[]> {
    const element =
      await this.repository
        .findById(id);

    if (element === null) {
      throw new Error(
        "عنصر المشهد المطلوب غير موجود.",
      );
    }

    const elements =
      await this.repository
        .findBySceneId(
          element.sceneId,
        );

    const currentIndex =
      elements.findIndex(
        (candidate) =>
          candidate.id === id,
      );

    if (currentIndex < 0) {
      throw new Error(
        "تعذر تحديد موضع عنصر المشهد.",
      );
    }

    const targetIndex =
      direction === "up"
        ? currentIndex - 1
        : currentIndex + 1;

    if (
      targetIndex < 0 ||
      targetIndex >= elements.length
    ) {
      return elements;
    }

    const reorderedElements = [
      ...elements,
    ];

    const [
      movedElement,
    ] = reorderedElements.splice(
      currentIndex,
      1,
    );

    reorderedElements.splice(
      targetIndex,
      0,
      movedElement,
    );

    await this.repository
      .replaceOrder(
        element.sceneId,
        reorderedElements.map(
          (reorderedElement) =>
            reorderedElement.id,
        ),
      );

    return reorderedElements.map(
      (
        reorderedElement,
        orderIndex,
      ) => ({
        ...reorderedElement,
        orderIndex,
      }),
    );
  }

  async reorderElements(
    sceneId: UUID,
    orderedElementIds: UUID[],
  ): Promise<SceneElement[]> {
    const scene =
      await this.sceneRepository
        .findById(sceneId);

    if (scene === null) {
      throw new Error(
        "المشهد المطلوب غير موجود.",
      );
    }

    const currentElements =
      await this.repository
        .findBySceneId(sceneId);

    validateCompleteOrder(
      currentElements,
      orderedElementIds,
    );

    await this.repository
      .replaceOrder(
        sceneId,
        orderedElementIds,
      );

    const elementsById =
      new Map(
        currentElements.map(
          (element) => [
            element.id,
            element,
          ],
        ),
      );

    return orderedElementIds.map(
      (elementId, orderIndex) => {
        const element =
          elementsById.get(
            elementId,
          );

        if (element === undefined) {
          throw new Error(
            "يتضمن الترتيب عنصرًا غير موجود.",
          );
        }

        return {
          ...element,
          orderIndex,
        };
      },
    );
  }

  private async validateCharacter(
    projectId: UUID,
    characterId: UUID | null,
  ): Promise<void> {
    if (characterId === null) {
      return;
    }

    const character =
      await this.characterRepository
        .findById(characterId);

    if (
      character === null ||
      character.projectId !== projectId
    ) {
      throw new Error(
        "الشخصية المحددة غير موجودة داخل هذا المشروع.",
      );
    }
  }
}

function getInsertionIndex(
  elements: SceneElement[],
  insertAfterElementId:
    UUID | null,
): number {
  if (
    insertAfterElementId === null
  ) {
    return elements.length;
  }

  const precedingIndex =
    elements.findIndex(
      (element) =>
        element.id ===
        insertAfterElementId,
    );

  if (precedingIndex < 0) {
    return elements.length;
  }

  return precedingIndex + 1;
}

function validateCompleteOrder(
  currentElements:
    SceneElement[],

  orderedElementIds:
    UUID[],
): void {
  if (
    currentElements.length !==
    orderedElementIds.length
  ) {
    throw new Error(
      "يجب أن يتضمن الترتيب جميع عناصر المشهد.",
    );
  }

  const currentIds =
    new Set(
      currentElements.map(
        (element) =>
          element.id,
      ),
    );

  const orderedIds =
    new Set(
      orderedElementIds,
    );

  if (
    orderedIds.size !==
    orderedElementIds.length
  ) {
    throw new Error(
      "يتضمن الترتيب عناصر مكررة.",
    );
  }

  const containsUnknownElement =
    orderedElementIds.some(
      (elementId) =>
        !currentIds.has(elementId),
    );

  if (containsUnknownElement) {
    throw new Error(
      "يتضمن الترتيب عنصرًا لا ينتمي إلى المشهد.",
    );
  }
}