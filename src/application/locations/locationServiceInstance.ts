import {
  SqliteLocationRepository,
} from "../../database";

import {
  LocationService,
} from "./LocationService";

const locationRepository =
  new SqliteLocationRepository();

export const locationService =
  new LocationService(
    locationRepository,
  );