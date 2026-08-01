import type { Project, UUID } from "../../types";

export interface ProjectRepository {
  findAll(): Promise<Project[]>;
  findById(id: UUID): Promise<Project | null>;
  create(project: Project): Promise<void>;
  update(project: Project): Promise<void>;
  delete(id: UUID): Promise<void>;
}