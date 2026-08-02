import {
  SqliteProjectStoryRepository,
} from "../../database";

import {
  ProjectStoryService,
} from "./ProjectStoryService";

const projectStoryRepository =
  new SqliteProjectStoryRepository();

export const projectStoryService =
  new ProjectStoryService(
    projectStoryRepository,
  );