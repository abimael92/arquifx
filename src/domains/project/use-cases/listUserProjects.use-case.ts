import { ProjectRecord, ProjectRepository } from "@/domains/project/types";

export async function listUserProjectsUseCase(repository: ProjectRepository): Promise<ProjectRecord[]> {
  return repository.listForCurrentUser();
}
