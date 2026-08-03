import type {
  SceneElement,
  UUID,
} from "../../types";

export interface SceneElementRepository {
  findBySceneId(
    sceneId: UUID,
  ): Promise<SceneElement[]>;

  findById(
    id: UUID,
  ): Promise<SceneElement | null>;

  create(
    element: SceneElement,
  ): Promise<void>;

  update(
    element: SceneElement,
  ): Promise<void>;

  delete(
    id: UUID,
  ): Promise<void>;

  replaceOrder(
    sceneId: UUID,
    orderedElementIds: UUID[],
  ): Promise<void>;
}