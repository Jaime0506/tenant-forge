import { createProjectService } from "@/services/project.service";
import { ProjectData } from "./useProject";

export const useProjectService = () => {
    const createProject = async (data: ProjectData) => {
        await createProjectService(data);
    };

    return {
        createProject,
    };
};
