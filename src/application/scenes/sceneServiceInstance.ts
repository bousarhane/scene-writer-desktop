import {
  SqliteEpisodeRepository,
  SqliteLocationRepository,
  SqliteSceneRepository,
} from "../../database";

import {
  SceneService,
} from "./SceneService";

const sceneRepository =
  new SqliteSceneRepository();

const episodeRepository =
  new SqliteEpisodeRepository();

const locationRepository =
  new SqliteLocationRepository();

export const sceneService =
  new SceneService(
    sceneRepository,
    episodeRepository,
    locationRepository,
  );