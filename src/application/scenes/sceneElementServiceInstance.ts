import {
  SqliteCharacterRepository,
  SqliteSceneElementRepository,
  SqliteSceneRepository,
} from "../../database";

import {
  SceneElementService,
} from "./SceneElementService";

const sceneElementRepository =
  new SqliteSceneElementRepository();

const sceneRepository =
  new SqliteSceneRepository();

const characterRepository =
  new SqliteCharacterRepository();

export const sceneElementService =
  new SceneElementService(
    sceneElementRepository,
    sceneRepository,
    characterRepository,
  );