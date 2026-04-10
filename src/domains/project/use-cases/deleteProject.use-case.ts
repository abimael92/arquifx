import { ProjectRepository } from "@/domains/project/types";

export async function deleteProjectUseCase(repository: ProjectRepository, projectId: string) {
  return repository.delete(projectId);
}
