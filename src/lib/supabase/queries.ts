import { deleteProjectUseCase } from "@/domains/project/use-cases/deleteProject.use-case";
import { listUserProjectsUseCase } from "@/domains/project/use-cases/listUserProjects.use-case";
import { loadProjectUseCase } from "@/domains/project/use-cases/loadProject.use-case";
import { saveProjectUseCase } from "@/domains/project/use-cases/saveProject.use-case";
import { ProjectRecord } from "@/domains/project/types";
import { supabaseProjectRepository } from "@/infrastructure/persistence/project.repository.supabase";
import { Project } from "@/types/project.types";

export async function saveProject(project: Project): Promise<ProjectRecord> {
  return saveProjectUseCase(supabaseProjectRepository, project);
}

export async function loadProject(id: string): Promise<Project | null> {
  return loadProjectUseCase(supabaseProjectRepository, id);
}

export async function listUserProjects(): Promise<ProjectRecord[]> {
  return listUserProjectsUseCase(supabaseProjectRepository);
}

export async function deleteProject(id: string): Promise<void> {
  return deleteProjectUseCase(supabaseProjectRepository, id);
}
