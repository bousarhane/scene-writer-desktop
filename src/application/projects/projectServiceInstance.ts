import { SqliteProjectRepository } from "../../database";
import { ProjectService } from "./ProjectService";

const projectRepository = new SqliteProjectRepository();

export const projectService = new ProjectService(
  projectRepository,
);