// Placeholder ProjectsService to keep build passing during module migration.
// TODO: replace with real implementation in modules/content-management/projects.
export interface Project {
  id: string;
  name: string;
  description?: string;
}

export class ProjectsService {
  async listProjects(): Promise<Project[]> {
    return [];
  }
}

export const projectsService = new ProjectsService();
