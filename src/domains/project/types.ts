import { Project } from "@/types/project.types";

export interface ProjectRecord {
  id: string;
  user_id: string;
  name: string;
  data: Project;
  created_at: string;
  updated_at: string;
}

export interface ProjectRepository {
  save(project: Project): Promise<ProjectRecord>;
  load(id: string): Promise<Project | null>;
  listForCurrentUser(): Promise<ProjectRecord[]>;
  delete(id: string): Promise<void>;
}
