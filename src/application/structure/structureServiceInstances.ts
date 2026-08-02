import {
  SqliteEpisodeRepository,
  SqliteSeasonRepository,
} from "../../database";

import {
  EpisodeService,
} from "./EpisodeService";

import {
  SeasonService,
} from "./SeasonService";

const seasonRepository =
  new SqliteSeasonRepository();

const episodeRepository =
  new SqliteEpisodeRepository();

export const seasonService =
  new SeasonService(
    seasonRepository,
  );

export const episodeService =
  new EpisodeService(
    episodeRepository,
    seasonRepository,
  );