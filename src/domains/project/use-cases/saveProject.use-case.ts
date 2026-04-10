import { ProjectRepository } from "@/domains/project/types";
import { Project } from "@/types/project.types";

export async function saveProjectUseCase(repository: ProjectRepository, project: Project) {
  return repository.save(project);
}
