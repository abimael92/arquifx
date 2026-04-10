import { ProjectRepository } from "@/domains/project/types";

export async function loadProjectUseCase(repository: ProjectRepository, projectId: string) {
  return repository.load(projectId);
}
